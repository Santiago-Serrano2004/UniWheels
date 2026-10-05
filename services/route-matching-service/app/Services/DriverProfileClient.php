<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cliente HTTP hacia auth-service y vehicle-service para enriquecer los
 * resultados de búsqueda del pasajero con el nombre/calificación real del
 * conductor y los datos reales del vehículo. Igual que AiRouteServiceClient: si el
 * servicio remoto no responde, se degrada con null (nunca con datos inventados)
 * en vez de romper la búsqueda completa.
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
        // Sin datos reales no se inventa nada: nombre e iniciales quedan en null.
        $fallback = [
            'name' => null,
            'avatar_initials' => null,
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
     * Descripción corta del vehículo para mostrar ("Marca Modelo (Color)"), o null si no hay datos.
     *
     * @param  array{brand: ?string, model_line: ?string, color: ?string}  $vehiculo
     */
    public static function describeVehicle(array $vehiculo): ?string
    {
        $descripcion = trim(($vehiculo['brand'] ?? '').' '.($vehiculo['model_line'] ?? ''));

        if ($descripcion === '') {
            return null;
        }

        return ! empty($vehiculo['color']) ? "{$descripcion} ({$vehiculo['color']})" : $descripcion;
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
     * Datos del vehículo para validar una publicación (tipo, estado, dueño y cupos),
     * según vehicle-service. Devuelve null si falla: sin fallback, porque ni el tope
     * del aporte ni la propiedad del vehículo se pueden validar a ciegas.
     *
     * @return array{type: string, status: ?string, owner_id: ?string, available_seats: int}|null
     *
     * @throws VehicleNotFoundException si vehicle-service responde 404 (el vehículo no existe)
     */
    public function getVehicleForValidation(string $vehicleId): ?array
    {
        try {
            $baseUrl = config('services.vehicle_service.url');
            $respuesta = Http::withToken($this->serviceToken())
                ->timeout(3)
                ->get("{$baseUrl}/api/v1/vehicles/{$vehicleId}/public-summary");

            if ($respuesta->successful() && $respuesta->json('success')) {
                $tipo = $respuesta->json('data.vehicle_type');

                if (! in_array($tipo, ['carro', 'moto'], true)) {
                    return null;
                }

                return [
                    'type' => $tipo,
                    'status' => $respuesta->json('data.status'),
                    'owner_id' => $respuesta->json('data.owner_id'),
                    'available_seats' => (int) $respuesta->json('data.available_seats'),
                ];
            }

            if ($respuesta->status() === 404) {
                throw new VehicleNotFoundException;
            }
        } catch (VehicleNotFoundException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::warning('vehicle-service no disponible para validar el vehículo.', [
                'vehicle_id' => $vehicleId,
                'exception_class' => get_class($e),
            ]);
        }

        return null;
    }
}
