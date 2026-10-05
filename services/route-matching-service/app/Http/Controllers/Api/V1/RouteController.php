<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContributionSuggestionRequest;
use App\Http\Requests\PublishRouteRequest;
use App\Http\Requests\SearchMatchRequest;
use App\Models\Route;
use App\Models\SearchLog;
use App\Services\AiRouteServiceClient;
use App\Services\ContributionCalculator;
use App\Services\DriverProfileClient;
use App\Services\OsrmRoutingService;
use App\Services\PostGisSpatialRepository;
use App\Services\SpatialMatchingService;
use App\Services\VehicleNotFoundException;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class RouteController extends Controller
{
    public function __construct(
        protected SpatialMatchingService $matchingService,
        protected PostGisSpatialRepository $spatialRepo,
        protected OsrmRoutingService $routingService,
        protected AiRouteServiceClient $aiClient,
        protected DriverProfileClient $driverProfileClient
    ) {}

    /**
     * Listar rutas publicadas disponibles para los pasajeros en tiempo real.
     */
    public function index(Request $request): JsonResponse
    {
        $campusId = $request->query('campus_id');
        $mine = $request->boolean('mine');

        $query = Route::orderBy('scheduled_departure_time', 'asc');

        if ($mine) {
            // Rutas propias del conductor autenticado: sin filtrar por estado/cupos,
            // el conductor necesita ver también las que ya cerró o canceló.
            $query->where('driver_id', $request->attributes->get('user_id'));
        } else {
            $query->where('status', 'publicada')->where('available_seats', '>', 0);
        }

        if ($campusId) {
            $query->where('destination_campus_id', $campusId);
        }

        $perfiles = [];
        $vehiculos = [];

        $routes = $query->get()->map(function ($route) use ($mine, &$perfiles, &$vehiculos) {
            $base = [
                'id' => $route->id,
                'driver_id' => $route->driver_id,
                'origin' => $route->origin_name,
                'origin_name' => $route->origin_name,
                'destination' => $route->destination_campus_name,
                'destination_campus_name' => $route->destination_campus_name,
                'departure_time' => $route->scheduled_departure_time ? Carbon::parse($route->scheduled_departure_time)->setTimezone('America/Bogota')->format('h:i A') : '06:45 AM',
                'arrival_time' => $route->target_arrival_time ? Carbon::parse($route->target_arrival_time)->setTimezone('America/Bogota')->format('h:i A') : '07:15 AM',
                'scheduled_departure_time' => $route->scheduled_departure_time?->toISOString(),
                'available_seats' => $route->available_seats,
                'fare' => '$ '.number_format($route->base_contribution_cop, 0, ',', '.'),
                'base_contribution_cop' => (float) $route->base_contribution_cop,
                'distance_km' => $route->distance_km,
                'suggested_contribution_cop' => $route->suggested_contribution_cop,
                'status' => $route->status,
                'detour_minutes' => '0 min',
            ];

            // Coordenadas reales persistidas en PostGIS — sin esto, la cabina de
            // navegación del conductor y el mapa del pasajero caen a coordenadas
            // genéricas de respaldo en vez de la ubicación real publicada.
            $puntos = $this->spatialRepo->getOriginDestinationPoints($route->id);
            if ($puntos) {
                $base['origin_lat'] = $puntos['origin'][0];
                $base['origin_lng'] = $puntos['origin'][1];
                $base['destination_lat'] = $puntos['destination'][0];
                $base['destination_lng'] = $puntos['destination'][1];
            }
            $base['route_path'] = $this->spatialRepo->getRouteCoordinates($route->id);

            // SIM-016: datos reales de auth-service/vehicle-service (null si no responden).
            // En "mine" no aplican, es el propio conductor.
            if (! $mine) {
                $perfil = $perfiles[$route->driver_id] ??= $this->driverProfileClient->getDriverProfile($route->driver_id);
                $vehiculo = $vehiculos[$route->vehicle_id] ??= $this->driverProfileClient->getVehicleSummary($route->vehicle_id);

                $base['driver_name'] = $perfil['name'];
                $base['vehicle'] = DriverProfileClient::describeVehicle($vehiculo);
                $base['plate'] = $vehiculo['plate_number'];
                $base['rating'] = $perfil['rating'];
            }

            return $base;
        });

        return response()->json([
            'success' => true,
            'data' => $routes,
        ]);
    }

    /**
     * Aporte sugerido y tope para el conductor, según la distancia vial y el tipo de vehículo.
     */
    public function contributionSuggestion(ContributionSuggestionRequest $request): JsonResponse
    {
        $datos = $request->validated();

        $vehiculo = $this->vehicleForValidation($datos['vehicle_id']);

        if ($vehiculo instanceof JsonResponse) {
            return $vehiculo;
        }

        if ($error = $this->vehicleOwnershipError($vehiculo, (string) $request->attributes->get('user_id'))) {
            return $error;
        }

        $tipoVehiculo = $vehiculo['type'];

        $calculoRuta = $this->routingService->calculateRoute(
            [(float) $datos['origin_lat'], (float) $datos['origin_lng']],
            [(float) $datos['destination_lat'], (float) $datos['destination_lng']]
        );
        $distanciaKm = $calculoRuta['distance_meters'] / 1000;
        $sugerido = ContributionCalculator::suggest($distanciaKm, $tipoVehiculo);

        return response()->json([
            'success' => true,
            'data' => [
                'distance_km' => round($distanciaKm, 1),
                'vehicle_type' => $tipoVehiculo,
                'suggested_contribution_cop' => $sugerido,
                'max_contribution_cop' => $sugerido,
            ],
        ]);
    }

    /**
     * @param  array{type: string, status: ?string, owner_id: ?string, available_seats: int}  $vehiculo
     */
    private function vehicleOwnershipError(array $vehiculo, string $driverId): ?JsonResponse
    {
        if ((string) $vehiculo['owner_id'] !== $driverId || $vehiculo['status'] !== 'aprobado') {
            return response()->json([
                'success' => false,
                'message' => 'Necesitas un vehículo propio aprobado para publicar rutas.',
            ], 422);
        }

        return null;
    }

    /**
     * SIM-019: 404 de vehicle-service -> 422 (el vehículo no existe); red caída o 5xx -> 503.
     *
     * @return array{type: string, status: ?string, owner_id: ?string, available_seats: int}|JsonResponse
     */
    private function vehicleForValidation(string $vehicleId): array|JsonResponse
    {
        try {
            $vehiculo = $this->driverProfileClient->getVehicleForValidation($vehicleId);
        } catch (VehicleNotFoundException) {
            return response()->json([
                'success' => false,
                'message' => 'El vehículo no existe.',
                'errors' => ['vehicle_id' => ['El vehículo no existe.']],
            ], 422);
        }

        return $vehiculo ?? $this->vehicleValidationFailed();
    }

    private function vehicleValidationFailed(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'No fue posible validar el vehículo. Intenta nuevamente.',
        ], 503);
    }

    /**
     * Publicar una nueva ruta con cálculo topológico de tiempo y persistencia PostGIS.
     */
    public function store(PublishRouteRequest $request): JsonResponse
    {
        $datos = $request->validated();
        // La identidad del conductor siempre viene del JWT verificado, nunca del payload —
        // evita que un usuario publique una ruta suplantando a otro conductor.
        $datos['driver_id'] = $request->attributes->get('user_id');

        // SIM-005: las horas con offset (-05:00) se normalizan a UTC antes de guardar;
        // sin esto el cast guarda el wall-time del offset en una columna sin zona.
        $datos['scheduled_departure_time'] = Carbon::parse($datos['scheduled_departure_time'])->utc();
        $datos['target_arrival_time'] = Carbon::parse($datos['target_arrival_time'])->utc();

        $origen = [(float) $datos['origin_lat'], (float) $datos['origin_lng']];
        $destino = [(float) $datos['destination_lat'], (float) $datos['destination_lng']];

        // 1. Obtener coordenadas topológicas y duración estimada con OSRM
        $coordenadas = $datos['coordinates'] ?? null;
        $duracionMinutos = 25.0;

        if (! $coordenadas || count($coordenadas) < 2) {
            $calculoRuta = $this->routingService->calculateRoute($origen, $destino);
            $coordenadas = $calculoRuta['coordinates'];
            $duracionMinutos = $calculoRuta['duration_minutes'];
        } else {
            $calculoRuta = $this->routingService->calculateRoute($origen, $destino);
            $duracionMinutos = $calculoRuta['duration_minutes'];
        }

        // El aporte indicado por el conductor no puede superar el sugerido (reglas §1.2).
        $distanciaKm = $calculoRuta['distance_meters'] / 1000;
        $vehiculo = $this->vehicleForValidation($datos['vehicle_id']);

        if ($vehiculo instanceof JsonResponse) {
            return $vehiculo;
        }

        // SIM-002: solo un vehículo propio y aprobado.
        if ($error = $this->vehicleOwnershipError($vehiculo, (string) $datos['driver_id'])) {
            return $error;
        }

        // SIM-018: los cupos no pueden superar los del vehículo (las motos, siempre 1).
        $maxCupos = $vehiculo['type'] === 'moto' ? 1 : min(6, max(1, $vehiculo['available_seats']));

        if ((int) $datos['available_seats'] > $maxCupos) {
            return response()->json([
                'success' => false,
                'message' => "Este vehículo admite máximo {$maxCupos} cupo(s) para pasajeros.",
                'errors' => [
                    'available_seats' => ["El máximo de cupos para este vehículo es {$maxCupos}."],
                ],
                'data' => ['max_available_seats' => $maxCupos],
            ], 422);
        }

        $tipoVehiculo = $vehiculo['type'];

        $sugerido = ContributionCalculator::suggest($distanciaKm, $tipoVehiculo);

        if ($datos['base_contribution_cop'] > $sugerido) {
            $maximo = '$ '.number_format($sugerido, 0, ',', '.');

            return response()->json([
                'success' => false,
                'message' => 'El aporte indicado supera el máximo permitido para esta ruta.',
                'errors' => [
                    'base_contribution_cop' => ["El aporte máximo para esta ruta es de {$maximo} COP."],
                ],
                'data' => ['max_contribution_cop' => $sugerido],
            ], 422);
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
            'total_seats' => $datos['available_seats'],
            'base_contribution_cop' => $datos['base_contribution_cop'],
            'distance_km' => round($distanciaKm, 2),
            'suggested_contribution_cop' => $sugerido,
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
                'distance_km' => $ruta->distance_km,
                'suggested_contribution_cop' => $ruta->suggested_contribution_cop,
                'coordinates_count' => count($coordenadas),
            ],
        ], 201);
    }

    /**
     * Registra la búsqueda para las métricas del piloto. Nunca rompe la búsqueda.
     */
    private function logSearch(string $passengerId, array $coincidencias): void
    {
        try {
            $modalidad1 = count(array_filter($coincidencias, fn ($m) => ($m['modality'] ?? null) === 'modalidad_1_directa'));

            SearchLog::create([
                'passenger_id' => $passengerId,
                'results_count' => count($coincidencias),
                'modality_1_count' => $modalidad1,
                'modality_2_count' => count($coincidencias) - $modalidad1,
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('No se pudo registrar la búsqueda en search_logs.', [
                'exception_class' => get_class($e),
            ]);
        }
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

        $this->logSearch((string) $request->attributes->get('user_id'), $coincidencias);

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
        $perfil = $this->driverProfileClient->getDriverProfile((string) $ruta->driver_id);
        $vehiculo = $this->driverProfileClient->getVehicleSummary((string) $ruta->vehicle_id);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $ruta->id,
                'driver_id' => $ruta->driver_id,
                'vehicle_id' => $ruta->vehicle_id,
                'driver_name' => $perfil['name'],
                'vehicle_plate' => $vehiculo['plate_number'],
                'vehicle_model' => DriverProfileClient::describeVehicle($vehiculo),
                'origin_name' => $ruta->origin_name,
                'destination_campus_name' => $ruta->destination_campus_name,
                'scheduled_departure_time' => $ruta->scheduled_departure_time->toISOString(),
                'estimated_duration_minutes' => $ruta->estimated_duration_minutes,
                'available_seats' => $ruta->available_seats,
                'base_contribution_cop' => (float) $ruta->base_contribution_cop,
                'distance_km' => $ruta->distance_km,
                'suggested_contribution_cop' => $ruta->suggested_contribution_cop,
                'status' => $ruta->status,
                'coordinates' => $coordenadas,
            ],
        ]);
    }

    /**
     * Optimizar el orden de paradas de los pasajeros ya confirmados en una ruta
     * (ALNS/DARP-TW vía ai-route-service). Solo el conductor dueño de la ruta puede
     * invocarlo. Si el motor de IA no responde, se devuelve el orden recibido tal
     * cual (fallback degradado, sin reordenar) para no romper la experiencia.
     */
    public function optimizePassengers(Request $request, string $id): JsonResponse
    {
        $ruta = Route::findOrFail($id);

        if ((string) $ruta->driver_id !== (string) $request->attributes->get('user_id')) {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado para optimizar los pasajeros de esta ruta.',
            ], 403);
        }

        $datos = $request->validate([
            'passengers' => ['required', 'array', 'min:1', 'max:6'],
            'passengers.*.id' => ['required', 'string'],
            'passengers.*.name' => ['nullable', 'string', 'max:120'],
            'passengers.*.pickup_address' => ['nullable', 'string', 'max:150'],
            'passengers.*.pickup_lat' => ['required', 'numeric', 'between:6.80,7.35'],
            'passengers.*.pickup_lng' => ['required', 'numeric', 'between:-73.35,-72.95'],
        ]);

        if (count($datos['passengers']) < 2) {
            // Un solo pasajero no necesita optimización de orden.
            return response()->json([
                'success' => true,
                'ai_powered' => false,
                'data' => ['ordered_stops' => $datos['passengers']],
            ]);
        }

        $puntos = $this->spatialRepo->getOriginDestinationPoints($ruta->id);

        $candidatos = array_map(function ($p) use ($puntos, $ruta) {
            return [
                'passenger_id' => $p['id'],
                'passenger_name' => $p['name'] ?? 'Pasajero',
                'pickup_location' => ['lat' => $p['pickup_lat'], 'lng' => $p['pickup_lng']],
                'pickup_address' => $p['pickup_address'] ?? '',
                'destination_location' => [
                    'lat' => $puntos['destination'][0] ?? $p['pickup_lat'],
                    'lng' => $puntos['destination'][1] ?? $p['pickup_lng'],
                ],
                'destination_address' => $ruta->destination_campus_name,
            ];
        }, $datos['passengers']);

        $resultado = $this->aiClient->optimizeMultiPassenger($ruta, $candidatos);

        if ($resultado) {
            return response()->json([
                'success' => true,
                'ai_powered' => true,
                'data' => $resultado,
            ]);
        }

        return response()->json([
            'success' => true,
            'ai_powered' => false,
            'data' => ['ordered_stops' => $datos['passengers']],
        ]);
    }
}
