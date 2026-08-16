<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Servicio de Ruteo Topológico OSRM (Open Source Routing Machine)
 * 
 * Consulta distancias y duraciones reales sobre la malla vial de OpenStreetMap.
 * Incluye mecanismo de respaldo geodésico automático con factor de sinuosidad
 * vial para el Área Metropolitana de Bucaramanga.
 */
class OsrmRoutingService
{
    protected string $osrmBaseUrl;
    const URBAN_SPEED_KMH = 28.0; // Velocidad promedio urbana en Bucaramanga
    const ROAD_TORTUOSITY_FACTOR = 1.35; // Factor de curvatura vial en Santander

    public function __construct()
    {
        $this->osrmBaseUrl = env('OSRM_API_URL', 'https://router.project-osrm.org/route/v1/driving');
    }

    /**
     * Calcular la ruta y tiempos entre un origen, un destino y paradas intermedias opcionales.
     *
     * @param array $origin [lat, lng]
     * @param array $destination [lat, lng]
     * @param array $waypoints Array de paradas intermedias [[lat, lng], ...]
     * @return array { distance_meters, duration_minutes, coordinates, is_fallback }
     */
    public function calculateRoute(array $origin, array $destination, array $waypoints = []): array
    {
        $todosLosPuntos = array_merge([$origin], $waypoints, [$destination]);

        // Formato OSRM: 'lng1,lat1;lng2,lat2;lng3,lat3'
        $coordenadasParam = implode(';', array_map(function ($p) {
            return "{$p[1]},{$p[0]}";
        }, $todosLosPuntos));

        try {
            $url = "{$this->osrmBaseUrl}/{$coordenadasParam}?overview=full&geometries=geojson";
            $respuesta = Http::timeout(3.5)->get($url);

            if ($respuesta->successful() && $respuesta->json('code') === 'Ok') {
                $rutaPrincipal = $respuesta->json('routes.0');
                $distanciaMetros = (float) ($rutaPrincipal['distance'] ?? 0.0);
                $duracionSegundos = (float) ($rutaPrincipal['duration'] ?? 0.0);

                // Convertir GeoJSON [lng, lat] a [lat, lng]
                $geometriaGeoJson = $rutaPrincipal['geometry']['coordinates'] ?? [];
                $coordenadas = array_map(function ($pt) {
                    return [(float) $pt[1], (float) $pt[0]];
                }, $geometriaGeoJson);

                return [
                    'distance_meters' => round($distanciaMetros, 1),
                    'duration_seconds' => round($duracionSegundos, 1),
                    'duration_minutes' => round($duracionSegundos / 60.0, 2),
                    'coordinates' => $coordenadas,
                    'is_fallback' => false,
                ];
            }
        } catch (\Throwable $e) {
            Log::warning('Fallo en conexión con OSRM, activando respaldo geodésico: ' . $e->getMessage());
        }

        // Respaldo Inteligente Geodésico
        return $this->calculateGeodesicFallback($todosLosPuntos);
    }

    /**
     * Respaldo Geodésico Haversine con corrección por curvatura vial y velocidad urbana.
     *
     * @param array $puntos Array de coordenadas [[lat, lng], ...]
     * @return array
     */
    public function calculateGeodesicFallback(array $puntos): array
    {
        $distanciaTotalMetros = 0.0;

        for ($i = 0; $i < count($puntos) - 1; $i++) {
            $distanciaTotalMetros += $this->haversineDistance(
                $puntos[$i][0],
                $puntos[$i][1],
                $puntos[$i + 1][0],
                $puntos[$i + 1][1]
            );
        }

        // Aplicar factor de sinuosidad vial de Bucaramanga
        $distanciaVialEstimada = $distanciaTotalMetros * self::ROAD_TORTUOSITY_FACTOR;
        $duracionHoras = ($distanciaVialEstimada / 1000.0) / self::URBAN_SPEED_KMH;
        $duracionMinutos = $duracionHoras * 60.0;

        return [
            'distance_meters' => round($distanciaVialEstimada, 1),
            'duration_seconds' => round($duracionMinutos * 60.0, 1),
            'duration_minutes' => round($duracionMinutos, 2),
            'coordinates' => $puntos,
            'is_fallback' => true,
        ];
    }

    /**
     * Fórmula de Haversine para distancia en línea recta sobre la esfera terrestre.
     */
    protected function haversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $radioTierraMetros = 6371000.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $radioTierraMetros * $c;
    }
}
