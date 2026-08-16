<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\PublishRouteRequest;
use App\Http\Requests\SearchMatchRequest;
use App\Models\Route;
use App\Services\OsrmRoutingService;
use App\Services\PostGisSpatialRepository;
use App\Services\SpatialMatchingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RouteController extends Controller
{
    public function __construct(
        protected SpatialMatchingService $matchingService,
        protected PostGisSpatialRepository $spatialRepo,
        protected OsrmRoutingService $routingService
    ) {}

    /**
     * Publicar una nueva ruta con cálculo topológico de tiempo y persistencia PostGIS.
     */
    public function store(PublishRouteRequest $request): JsonResponse
    {
        $datos = $request->validated();

        $origen = [(float) $datos['origin_lat'], (float) $datos['origin_lng']];
        $destino = [(float) $datos['destination_lat'], (float) $datos['destination_lng']];

        // 1. Obtener coordenadas topológicas y duración estimada con OSRM
        $coordenadas = $datos['coordinates'] ?? null;
        $duracionMinutos = 25.0;

        if (!$coordenadas || count($coordenadas) < 2) {
            $calculoRuta = $this->routingService->calculateRoute($origen, $destino);
            $coordenadas = $calculoRuta['coordinates'];
            $duracionMinutos = $calculoRuta['duration_minutes'];
        } else {
            $calculoRuta = $this->routingService->calculateRoute($origen, $destino);
            $duracionMinutos = $calculoRuta['duration_minutes'];
        }

        // 2. Crear la entidad en la base de datos
        $ruta = Route::create([
            'driver_id' => $datos['driver_id'],
            'vehicle_id' => $datos['vehicle_id'],
            'origin_name' => $datos['origin_name'],
            'destination_campus_id' => $datos['destination_campus_id'],
            'destination_campus_name' => $datos['destination_campus_name'],
            'scheduled_departure_time' => $datos['scheduled_departure_time'],
            'target_arrival_time' => $datos['target_arrival_time'],
            'estimated_duration_minutes' => $duracionMinutos,
            'max_detour_minutes' => $datos['max_detour_minutes'] ?? 15,
            'accumulated_detour_minutes' => 0.0,
            'available_seats' => $datos['available_seats'],
            'base_contribution_cop' => $datos['base_contribution_cop'],
            'status' => 'publicada',
        ]);

        // 3. Guardar geometría PostGIS (LineString y Points con SRID 4326)
        $this->spatialRepo->saveRouteGeometry(
            $ruta->id,
            $coordenadas,
            $origen,
            $destino
        );

        return response()->json([
            'success' => true,
            'message' => 'Ruta publicada exitosamente con indexación espacial PostGIS.',
            'data' => [
                'id' => $ruta->id,
                'origin_name' => $ruta->origin_name,
                'destination_campus_name' => $ruta->destination_campus_name,
                'scheduled_departure_time' => $ruta->scheduled_departure_time->toISOString(),
                'target_arrival_time' => $ruta->target_arrival_time->toISOString(),
                'estimated_duration_minutes' => $ruta->estimated_duration_minutes,
                'available_seats' => $ruta->available_seats,
                'base_contribution_cop' => (float) $ruta->base_contribution_cop,
                'coordinates_count' => count($coordenadas),
            ],
        ], 201);
    }

    /**
     * Buscar rutas coincidentes (Modalidad 1 y Modalidad 2 con IA) para un pasajero.
     */
    public function searchMatches(SearchMatchRequest $request): JsonResponse
    {
        $datos = $request->validated();

        $coincidencias = $this->matchingService->findMatchesForPassenger(
            (float) $datos['pickup_lat'],
            (float) $datos['pickup_lng'],
            (int) $datos['destination_campus_id'],
            $datos['preferred_time'] ?? null
        );

        return response()->json([
            'success' => true,
            'total_matches' => count($coincidencias),
            'data' => $coincidencias,
        ]);
    }

    /**
     * Evaluar detalladamente la inserción de una parada en una ruta específica.
     */
    public function evaluateDetour(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'pickup_lat' => ['required', 'numeric', 'between:6.80,7.35'],
            'pickup_lng' => ['required', 'numeric', 'between:-73.35,-72.95'],
        ]);

        $ruta = Route::findOrFail($id);

        $evaluacion = $this->matchingService->evaluateRouteDetourForPassenger(
            $ruta,
            (float) $request->input('pickup_lat'),
            (float) $request->input('pickup_lng')
        );

        return response()->json([
            'success' => true,
            'data' => $evaluacion,
        ]);
    }

    /**
     * Obtener el detalle de una ruta con su polilínea completa.
     */
    public function show(string $id): JsonResponse
    {
        $ruta = Route::findOrFail($id);
        $coordenadas = $this->spatialRepo->getRouteCoordinates($ruta->id);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $ruta->id,
                'driver_id' => $ruta->driver_id,
                'origin_name' => $ruta->origin_name,
                'destination_campus_name' => $ruta->destination_campus_name,
                'scheduled_departure_time' => $ruta->scheduled_departure_time->toISOString(),
                'estimated_duration_minutes' => $ruta->estimated_duration_minutes,
                'available_seats' => $ruta->available_seats,
                'base_contribution_cop' => (float) $ruta->base_contribution_cop,
                'status' => $ruta->status,
                'coordinates' => $coordenadas,
            ],
        ]);
    }
}
