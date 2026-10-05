<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cliente HTTP hacia route-matching-service para validar server-side los datos
 * de una ruta (dueño real y tarifa base) antes de crear un viaje — evita que
 * el cliente fije total_fare_cop o driver_id arbitrariamente.
 */
class RouteMatchingClient
{
    public function __construct(private JwtVerifier $jwtVerifier) {}

    public function getRoute(string $routeId): ?array
    {
        try {
            $token = $this->jwtVerifier->issueServiceToken('trip-service');
            $baseUrl = config('services.route_matching.url');

            $respuesta = Http::withToken($token)
                ->timeout(3)
                ->get("{$baseUrl}/api/v1/routes/{$routeId}");

            if ($respuesta->successful() && $respuesta->json('success')) {
                return $respuesta->json('data');
            }
        } catch (\Throwable $e) {
            Log::warning('No se pudo validar la ruta contra route-matching-service.', [
                'route_id' => $routeId,
                'exception_class' => get_class($e),
            ]);
        }

        return null;
    }

    /**
     * Hashes de usuarios activos (buscaron o publicaron) por semana, desde route-matching-service.
     * Devuelve null si no responde: quien llama debe marcar el resultado como parcial.
     *
     * @return array<string, list<string>>|null
     */
    public function weeklyActiveUserHashes(int $weeks): ?array
    {
        try {
            $respuesta = Http::withToken($this->jwtVerifier->issueServiceToken('trip-service'))
                ->timeout(3)
                ->get(config('services.route_matching.url').'/api/v1/internal/metrics/weekly-active-users', ['weeks' => $weeks]);

            if ($respuesta->successful() && is_array($respuesta->json('data'))) {
                return $respuesta->json('data');
            }

            Log::warning('route-matching-service no devolvió los usuarios activos.', ['status' => $respuesta->status()]);
        } catch (\Throwable $e) {
            Log::warning('No se pudieron pedir los usuarios activos a route-matching-service.', [
                'exception_class' => get_class($e),
            ]);
        }

        return null;
    }

    public const SEAT_RESERVED = 'reserved';

    public const SEAT_FULL = 'full';

    public const SEAT_UNAVAILABLE = 'unavailable';

    /**
     * Descuenta un cupo de la ruta de forma atómica (SIM-001). route-matching es la
     * dueña de routes.available_seats. Devuelve SEAT_RESERVED, SEAT_FULL (409) o
     * SEAT_UNAVAILABLE si no se pudo contactar o respondió algo inesperado.
     */
    public function reserveSeat(string $routeId): string
    {
        try {
            $respuesta = Http::withToken($this->jwtVerifier->issueServiceToken('trip-service'))
                ->timeout(3)
                ->post(config('services.route_matching.url')."/api/v1/internal/routes/{$routeId}/reserve-seat");

            if ($respuesta->successful()) {
                return self::SEAT_RESERVED;
            }

            if ($respuesta->status() === 409) {
                return self::SEAT_FULL;
            }
        } catch (\Throwable $e) {
            Log::warning('No se pudo reservar el cupo en route-matching-service.', [
                'route_id' => $routeId,
                'exception_class' => get_class($e),
            ]);
        }

        return self::SEAT_UNAVAILABLE;
    }

    /**
     * Devuelve un cupo a la ruta. Nunca lanza: si falla, deja un warning y quien llama
     * no debe bloquearse por ello.
     *
     * TODO: conciliación futura — un job que compare viajes activos vs. cupos tomados
     * por ruta y repare los release-seat perdidos.
     */
    public function releaseSeat(string $routeId): bool
    {
        try {
            $respuesta = Http::withToken($this->jwtVerifier->issueServiceToken('trip-service'))
                ->timeout(3)
                ->post(config('services.route_matching.url')."/api/v1/internal/routes/{$routeId}/release-seat");

            if ($respuesta->successful()) {
                return true;
            }

            Log::warning('route-matching-service rechazó la liberación del cupo.', [
                'route_id' => $routeId,
                'status' => $respuesta->status(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('No se pudo liberar el cupo en route-matching-service.', [
                'route_id' => $routeId,
                'exception_class' => get_class($e),
            ]);
        }

        return false;
    }

    /**
     * Distancia real recorrida (km) sumando la geometría de la ruta publicada
     * (route-matching-service es el único servicio que conoce la geometría real
     * PostGIS del trayecto — trip-service solo guarda direcciones en texto).
     * Usada para poblar trip_completed_summaries al finalizar un viaje, que a su
     * vez alimenta el reentrenamiento del modelo XGBoost de ETA con datos reales.
     */
    public function getRouteDistanceKm(string $routeId): ?float
    {
        $ruta = $this->getRoute($routeId);
        $coordenadas = $ruta['coordinates'] ?? null;

        if (! is_array($coordenadas) || count($coordenadas) < 2) {
            return null;
        }

        $distanciaMetros = 0.0;
        for ($i = 1; $i < count($coordenadas); $i++) {
            $distanciaMetros += $this->haversineMetros(
                $coordenadas[$i - 1][0],
                $coordenadas[$i - 1][1],
                $coordenadas[$i][0],
                $coordenadas[$i][1]
            );
        }

        return round($distanciaMetros / 1000.0, 2);
    }

    private function haversineMetros(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $radioTierraMetros = 6371000.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return $radioTierraMetros * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
