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
