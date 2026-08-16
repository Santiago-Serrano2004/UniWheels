<?php

namespace App\Services;

use App\Models\Route;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Repositorio de Consultas Espaciales Nativas PostGIS 3.4
 * 
 * Gestiona indexación GiST, operaciones de proximidad (ST_DWithin),
 * cálculo de distancias esféricas (ST_DistanceSphere) y proyecciones
 * escalares sobre trayectorias geométricas (ST_LineLocatePoint).
 */
class PostGisSpatialRepository
{
    /**
     * Buscar rutas activas cuya trayectoria pase a menos de un radio de tolerancia en metros.
     * Utiliza el índice espacial GiST para poda de candidatos en O(log N).
     *
     * @param float $pickupLat Latitud del punto de recogida del pasajero
     * @param float $pickupLng Longitud del punto de recogida del pasajero
     * @param float $radiusMeters Radio de tolerancia (default: 800m)
     * @param int|null $destinationCampusId ID opcional de la sede universitaria
     * @return Collection
     */
    public function findCandidateRoutes(
        float $pickupLat,
        float $pickupLng,
        float $radiusMeters = 800.0,
        ?int $destinationCampusId = null
    ): Collection {
        $query = Route::query()
            ->select('routes.*')
            ->selectRaw(
                'ST_Distance(
                    path_geometry::geography, 
                    ST_SetSRID(ST_Point(?, ?), 4326)::geography
                ) AS distance_to_route_meters',
                [$pickupLng, $pickupLat]
            )
            ->selectRaw(
                'ST_LineLocatePoint(
                    path_geometry, 
                    ST_SetSRID(ST_Point(?, ?), 4326)
                ) AS pickup_fraction',
                [$pickupLng, $pickupLat]
            )
            ->where('status', 'publicada')
            ->where('available_seats', '>', 0)
            ->whereRaw(
                'ST_DWithin(
                    path_geometry::geography, 
                    ST_SetSRID(ST_Point(?, ?), 4326)::geography, 
                    ?
                )',
                [$pickupLng, $pickupLat, $radiusMeters]
            );

        if ($destinationCampusId) {
            $query->where('destination_campus_id', $destinationCampusId);
        }

        return $query
            ->orderBy('distance_to_route_meters', 'asc')
            ->get();
    }

    /**
     * Validar que el punto de recogida esté ubicado ANTES del destino a lo largo de la trayectoria.
     * Evita que se sugieran viajes a un pasajero en sentido contrario al recorrido del conductor.
     *
     * @param string $routeId UUID de la ruta
     * @param float $pickupLat Latitud de recogida
     * @param float $pickupLng Longitud de recogida
     * @return bool True si el punto está en el sentido correcto del viaje
     */
    public function isPointInForwardDirection(string $routeId, float $pickupLat, float $pickupLng): bool
    {
        $resultado = DB::selectOne(
            'SELECT 
                ST_LineLocatePoint(path_geometry, ST_SetSRID(ST_Point(?, ?), 4326)) AS pickup_fraction
             FROM routes 
             WHERE id = ? AND path_geometry IS NOT NULL',
            [$pickupLng, $pickupLat, $routeId]
        );

        if (!$resultado || $resultado->pickup_fraction === null) {
            return false;
        }

        // El punto de recogida debe ubicarse a lo largo del recorrido antes de la meta final
        return (float) $resultado->pickup_fraction < 0.99;
    }

    /**
     * Guardar o actualizar la geometría PostGIS (LineString y Points) para una ruta dada.
     *
     * @param string $routeId UUID de la ruta
     * @param array $coordinates Array de pares de coordenadas [[lat, lng], [lat, lng], ...]
     * @param array $originCoords [lat, lng]
     * @param array $destinationCoords [lat, lng]
     * @return bool
     */
    public function saveRouteGeometry(
        string $routeId,
        array $coordinates,
        array $originCoords,
        array $destinationCoords
    ): bool {
        if (count($coordinates) < 2) {
            return false;
        }

        // Construir WKT (Well-Known Text) para LineString con formato 'LONGITUDE LATITUDE'
        $puntosWkt = [];
        foreach ($coordinates as $coord) {
            $lat = (float) $coord[0];
            $lng = (float) $coord[1];
            $puntosWkt[] = "{$lng} {$lat}";
        }
        $lineStringWkt = 'SRID=4326;LINESTRING(' . implode(', ', $puntosWkt) . ')';

        $originPointWkt = "SRID=4326;POINT({$originCoords[1]} {$originCoords[0]})";
        $destinationPointWkt = "SRID=4326;POINT({$destinationCoords[1]} {$destinationCoords[0]})";

        return DB::update(
            'UPDATE routes 
             SET path_geometry = ST_GeomFromEWKT(?),
                 origin_geom = ST_GeomFromEWKT(?),
                 destination_geom = ST_GeomFromEWKT(?),
                 updated_at = NOW()
             WHERE id = ?',
            [$lineStringWkt, $originPointWkt, $destinationPointWkt, $routeId]
        ) > 0;
    }

    /**
     * Obtener la polilínea de la ruta serializada en formato GeoJSON.
     *
     * @param string $routeId UUID de la ruta
     * @return array|null Array de coordenadas [[lat, lng], ...]
     */
    public function getRouteCoordinates(string $routeId): ?array
    {
        $resultado = DB::selectOne(
            'SELECT ST_AsGeoJSON(path_geometry) AS geojson FROM routes WHERE id = ?',
            [$routeId]
        );

        if (!$resultado || !$resultado->geojson) {
            return null;
        }

        $geoJson = json_decode($resultado->geojson, true);
        if (!isset($geoJson['coordinates']) || !is_array($geoJson['coordinates'])) {
            return null;
        }

        // Convertir de [lng, lat] GeoJSON a [lat, lng] estándar de Leaflet
        return array_map(function ($punto) {
            return [(float) $punto[1], (float) $punto[0]];
        }, $geoJson['coordinates']);
    }
}
