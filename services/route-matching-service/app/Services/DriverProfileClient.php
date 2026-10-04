<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cliente HTTP hacia auth-service y vehicle-service para enriquecer los
 * resultados de búsqueda del pasajero con el nombre/calificación real del
 * conductor y los datos reales del vehículo — antes esto era un placeholder
 * hardcodeado ('Carlos Mendoza', 'KLU-492') en el propio route-matching-service.
 * Igual que AiRouteServiceClient: si el servicio remoto no responde, se
 * degrada con valores neutros en vez de romper la búsqueda completa.
 */
class DriverProfileClient
{
    public function __construct(private JwtVerifier $jwtVerifier) {}

    private function serviceToken(): string
    {
        return $this->jwtVerifier->issueServiceToken('route-matching-service');
    }

    /**
     * Perfil público del conductor (nombre, iniciales, calificación).
     */
    public function getDriverProfile(string $driverId): array
    {
        $fallback = [
            'name' => 'Conductor UniWheels',
            'avatar_initials' => 'CU',
            'rating' => null,
        ];

        try {
            $baseUrl = config('services.auth_service.url');
            $respuesta = Http::withToken($this->serviceToken())
                ->timeout(3)
                ->get("{$baseUrl}/api/v1/users/{$driverId}/public-profile");

            if ($respuesta->successful() && $respuesta->json('success')) {
                $datos = $respuesta->json('data');

                return [
                    'name' => $datos['name'] ?? $fallback['name'],
                    'avatar_initials' => $datos['avatar_initials'] ?? $fallback['avatar_initials'],
                    'rating' => $datos['rating'] ?? null,
                ];
            }
        } catch (\Throwable $e) {
            Log::warning('auth-service no disponible para enriquecer perfil de conductor.', [
                'driver_id' => $driverId,
                'exception_class' => get_class($e),
            ]);
        }

        return $fallback;
    }

    /**
     * Resumen público del vehículo (placa, marca, modelo, color).
     */
    public function getVehicleSummary(string $vehicleId): array
    {
        $fallback = [
            'plate_number' => null,
            'brand' => null,
            'model_line' => null,
            'color' => null,
            'vehicle_type' => 'carro',
        ];

        try {
            $baseUrl = config('services.vehicle_service.url');
            $respuesta = Http::withToken($this->serviceToken())
                ->timeout(3)
                ->get("{$baseUrl}/api/v1/vehicles/{$vehicleId}/public-summary");

            if ($respuesta->successful() && $respuesta->json('success')) {
                $datos = $respuesta->json('data');

                return [
                    'plate_number' => $datos['plate_number'] ?? null,
                    'brand' => $datos['brand'] ?? null,
                    'model_line' => $datos['model_line'] ?? null,
                    'color' => $datos['color'] ?? null,
                    'vehicle_type' => $datos['vehicle_type'] ?? 'carro',
                ];
            }
        } catch (\Throwable $e) {
            Log::warning('vehicle-service no disponible para enriquecer resumen de vehículo.', [
                'vehicle_id' => $vehicleId,
                'exception_class' => get_class($e),
            ]);
        }

        return $fallback;
    }

    /**
     * Tipo de vehículo ('carro' o 'moto') según vehicle-service. Devuelve null si
     * falla: sin fallback a 'carro', porque el tope del aporte no se puede
     * calcular a ciegas.
     */
    public function getVehicleType(string $vehicleId): ?string
    {
        try {
            $baseUrl = config('services.vehicle_service.url');
            $respuesta = Http::withToken($this->serviceToken())
                ->timeout(3)
                ->get("{$baseUrl}/api/v1/vehicles/{$vehicleId}/public-summary");

            if ($respuesta->successful() && $respuesta->json('success')) {
                $tipo = $respuesta->json('data.vehicle_type');

                return in_array($tipo, ['carro', 'moto'], true) ? $tipo : null;
            }
        } catch (\Throwable $e) {
            Log::warning('vehicle-service no disponible para validar el tipo de vehículo.', [
                'vehicle_id' => $vehicleId,
                'exception_class' => get_class($e),
            ]);
        }

        return null;
    }
}
