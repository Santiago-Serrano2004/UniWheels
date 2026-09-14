<?php

namespace App\Services;

use App\Models\Route;

/**
 * Servicio de Emparejamiento Geoespacial e Inteligencia de Desvío (Fase 04)
 *
 * Orquesta la poda espacial PostGIS, el ruteo topológico OSRM y la telemetría
 * en tiempo real de TomTom Traffic API (congestión y vías cerradas) para clasificar
 * y evaluar coincidencias en Modalidad 1 (En ruta) y Modalidad 2 (Desvío con IA).
 */
class SpatialMatchingService
{
    const DIRECT_MATCH_RADIUS_METERS = 500.0; // Umbral para Modalidad 1 (en ruta) — docs/REGLAS_DE_NEGOCIO_Y_TARIFAS.md

    const MAX_SEARCH_RADIUS_METERS = 3200.0; // Radio máximo para evaluar desvío — docs/REGLAS_DE_NEGOCIO_Y_TARIFAS.md

    const BOARDING_WAIT_MINUTES = 2.0; // Tiempo estimado de abordaje

    const COP_PER_DETOUR_MINUTE = 300.0; // Recargo por minuto de desvío

    const MAX_TOTAL_DETOUR_MINUTES = 15.0; // Restricción dura máxima por trayecto

    public function __construct(
        protected PostGisSpatialRepository $spatialRepo,
        protected OsrmRoutingService $routingService,
        protected LiveTrafficService $trafficService,
        protected AiRouteServiceClient $aiClient,
        protected DriverProfileClient $driverProfileClient
    ) {}

    /**
     * Buscar y clasificar coincidencias de rutas para un pasajero.
     *
     * @param  float  $pickupLat  Latitud del punto de abordaje
     * @param  float  $pickupLng  Longitud del punto de abordaje
     * @param  int  $destinationCampusId  ID de la sede universitaria de destino
     * @param  string|null  $preferredTime  Hora preferida de salida (opcional)
     * @return array Lista de coincidencias ordenadas por menor impacto y costo
     */
    public function findMatchesForPassenger(
        float $pickupLat,
        float $pickupLng,
        int $destinationCampusId,
        ?string $preferredTime = null
    ): array {
        // 1. Poda espacial inicial en PostGIS (Candidatos en radio de 1.2 km)
        $candidatos = $this->spatialRepo->findCandidateRoutes(
            $pickupLat,
            $pickupLng,
            self::MAX_SEARCH_RADIUS_METERS,
            $destinationCampusId
        );

        $matches = [];

        foreach ($candidatos as $ruta) {
            // Validar que el punto esté en el sentido hacia el campus
            if (! $this->spatialRepo->isPointInForwardDirection($ruta->id, $pickupLat, $pickupLng)) {
                continue;
            }

            $distanciaMetros = (float) $ruta->distance_to_route_meters;

            if ($distanciaMetros <= self::DIRECT_MATCH_RADIUS_METERS) {
                // MODALIDAD 1: Match en Ruta (Sin desvío) — se consulta la IA solo para
                // enriquecer con la distancia/instrucciones a pie y el tráfico en vivo;
                // la clasificación de modalidad ya quedó decidida por el radio geoespacial.
                $infoCaminata = $this->getSmartWalkingInfo($ruta, $pickupLat, $pickupLng);

                $matches[] = array_merge([
                    'route_id' => $ruta->id,
                    'driver_id' => $ruta->driver_id,
                    'vehicle_id' => $ruta->vehicle_id,
                    'origin_name' => $ruta->origin_name,
                    'destination_campus_name' => $ruta->destination_campus_name,
                    'scheduled_departure_time' => $ruta->scheduled_departure_time->clone()->setTimezone('America/Bogota')->format('H:i A'),
                    'departure_timestamp' => $ruta->scheduled_departure_time->toISOString(),
                    'available_seats' => $ruta->available_seats,
                    'modality' => 'modalidad_1_directa',
                    'modality_label' => 'En Ruta (Sin desvío)',
                    'detour_minutes' => 0.0,
                    'detour_label' => '0 min',
                    'distance_to_pickup_meters' => round($distanciaMetros, 0),
                    'suggested_fare_cop' => (float) $ruta->base_contribution_cop,
                    'is_viable' => true,
                    'estimated_arrival_time' => $ruta->scheduled_departure_time
                        ->copy()
                        ->addMinutes((int) $ruta->estimated_duration_minutes)
                        ->toISOString(),
                ], $infoCaminata);
            } else {
                // MODALIDAD 2: Desvío asistido por IA con telemetría de tráfico en vivo
                $evaluacion = $this->evaluateRouteDetourForPassenger($ruta, $pickupLat, $pickupLng);

                if ($evaluacion['is_viable']) {
                    $matches[] = [
                        'route_id' => $ruta->id,
                        'driver_id' => $ruta->driver_id,
                        'vehicle_id' => $ruta->vehicle_id,
                        'origin_name' => $ruta->origin_name,
                        'destination_campus_name' => $ruta->destination_campus_name,
                        'scheduled_departure_time' => $ruta->scheduled_departure_time->clone()->setTimezone('America/Bogota')->format('H:i A'),
                        'departure_timestamp' => $ruta->scheduled_departure_time->toISOString(),
                        'available_seats' => $ruta->available_seats,
                        'modality' => 'modalidad_2_desvio',
                        'modality_label' => 'Desvío Optimizado con IA',
                        'detour_minutes' => $evaluacion['detour_minutes'],
                        'detour_label' => '+'.round($evaluacion['detour_minutes']).' min',
                        'distance_to_pickup_meters' => round($distanciaMetros, 0),
                        'suggested_fare_cop' => $evaluacion['total_suggested_fare_cop'],
                        'is_viable' => true,
                        'traffic_status' => $evaluacion['traffic_info']['description'] ?? 'Tráfico normal',
                        'traffic_source' => $evaluacion['traffic_info']['source'] ?? 'hourly_model',
                        'detour_breakdown' => $evaluacion,
                        'estimated_arrival_time' => $evaluacion['estimated_arrival_time'],
                    ];
                }
            }
        }

        // Ordenar: primero Modalidad 1 (sin desvío), luego Modalidad 2 por menor desvío y menor tarifa
        usort($matches, function ($a, $b) {
            if ($a['detour_minutes'] === $b['detour_minutes']) {
                return $a['suggested_fare_cop'] <=> $b['suggested_fare_cop'];
            }

            return $a['detour_minutes'] <=> $b['detour_minutes'];
        });

        // Enriquecer con nombre/calificación real del conductor y datos reales del
        // vehículo (auth-service y vehicle-service) — antes el pasajero nunca veía
        // esta información en la búsqueda porque route-matching-service no la tiene.
        foreach ($matches as &$match) {
            $perfil = $this->driverProfileClient->getDriverProfile($match['driver_id']);
            $vehiculo = $this->driverProfileClient->getVehicleSummary($match['vehicle_id']);

            $match['driver_name'] = $perfil['name'];
            $match['driver_avatar_initials'] = $perfil['avatar_initials'];
            $match['driver_rating'] = $perfil['rating'];
            $match['vehicle_plate'] = $vehiculo['plate_number'];
            $match['vehicle_description'] = trim(($vehiculo['brand'] ?? '').' '.($vehiculo['model_line'] ?? '')) ?: null;
            $match['vehicle_color'] = $vehiculo['color'];
            $match['vehicle_type'] = $vehiculo['vehicle_type'];
        }
        unset($match);

        return $matches;
    }

    /**
     * Consultar a ai-route-service la distancia/tiempo a pie y el estado del tráfico
     * en vivo para un punto de recogida, sin afectar la clasificación de modalidad
     * (que ya se decidió por el radio geoespacial). Degrada silenciosamente a valores
     * vacíos si el servicio de IA no responde.
     */
    private function getSmartWalkingInfo(Route $route, float $pickupLat, float $pickupLng): array
    {
        $aiResult = $this->aiClient->evaluateMatch($route, $pickupLat, $pickupLng);

        if (! $aiResult) {
            return [
                'ai_powered' => false,
                'is_smart_pickup_applied' => false,
                'walking_distance_meters' => 0.0,
                'walking_time_minutes' => 0.0,
                'walking_instructions' => null,
                'traffic_status' => 'Sin datos de tráfico disponibles',
                'traffic_source' => 'unavailable',
            ];
        }

        return [
            'ai_powered' => true,
            'is_smart_pickup_applied' => (bool) ($aiResult['is_smart_pickup_applied'] ?? false),
            'walking_distance_meters' => (float) ($aiResult['walking_distance_meters'] ?? 0.0),
            'walking_time_minutes' => (float) ($aiResult['walking_time_minutes'] ?? 0.0),
            'walking_instructions' => $aiResult['walking_instructions'] ?? null,
            'recommended_pickup' => $aiResult['recommended_pickup'] ?? null,
            'traffic_status' => $aiResult['traffic_status'] ?? 'Tráfico normal',
            'traffic_source' => 'ai_route_service',
            'polyline_coordinates' => $aiResult['polyline_coordinates'] ?? null,
        ];
    }

    /**
     * Evaluar el impacto temporal y económico de insertar una parada en una ruta específica.
     */
    public function evaluateRouteDetourForPassenger(Route $route, float $pickupLat, float $pickupLng): array
    {
        // 1. Ingesta de Tráfico en Vivo y Verificación de Vías Cerradas (TomTom Traffic)
        $trafficInfo = $this->trafficService->getTrafficConditions(
            $pickupLat,
            $pickupLng,
            $route->scheduled_departure_time
        );

        // Si la vía está reportada como cerrada por obras/accidente, rechazar el desvío
        if (! empty($trafficInfo['has_road_closure'])) {
            return [
                'is_viable' => false,
                'rejection_reason' => 'El punto de recogida seleccionado se encuentra en un tramo vial reportado como cerrado por obras o accidente en tiempo real.',
                'detour_minutes' => 0.0,
                'traffic_info' => $trafficInfo,
            ];
        }

        // Motor real de IA (ALNS + XGBoost + TomTom) como decisor principal: calcula
        // un desvío más preciso que el heurístico local. Si no responde, se conserva
        // el cálculo PHP/PostGIS existente como fallback (mismo patrón que OSRM/TomTom).
        $aiResult = $this->aiClient->evaluateMatch($route, $pickupLat, $pickupLng);
        if ($aiResult && array_key_exists('detour_minutes', $aiResult)) {
            $detourTravelMinutes = max(0.0, (float) $aiResult['detour_minutes'] - self::BOARDING_WAIT_MINUTES);
            $resultado = $this->evaluateDetour($route, $pickupLat, $pickupLng, $detourTravelMinutes);
            $resultado['traffic_info'] = [
                'description' => $aiResult['traffic_status'] ?? 'Tráfico normal',
                'source' => 'ai_route_service',
                'congestion_factor' => $aiResult['traffic_multiplier_kappa'] ?? 1.0,
            ];
            $resultado['ai_powered'] = true;

            // Punto de Encuentro Inteligente con Radio Caminable (Smart Walking):
            // cuánto debe caminar el pasajero desde su ubicación hasta el punto de
            // abordaje real sobre el corredor del conductor.
            $resultado['is_smart_pickup_applied'] = (bool) ($aiResult['is_smart_pickup_applied'] ?? false);
            $resultado['walking_distance_meters'] = (float) ($aiResult['walking_distance_meters'] ?? 0.0);
            $resultado['walking_time_minutes'] = (float) ($aiResult['walking_time_minutes'] ?? 0.0);
            $resultado['walking_instructions'] = $aiResult['walking_instructions'] ?? null;
            $resultado['recommended_pickup'] = $aiResult['recommended_pickup'] ?? null;

            // Polilínea real del trayecto (con desvío insertado) calculada por el motor
            // de IA — más precisa que la línea recta local para dibujar en el mapa.
            if (! empty($aiResult['polyline_coordinates'])) {
                $resultado['polyline_coordinates'] = $aiResult['polyline_coordinates'];
            }

            return $resultado;
        }

        $coordenadasRuta = $this->spatialRepo->getRouteCoordinates($route->id);

        if (! $coordenadasRuta || count($coordenadasRuta) < 2) {
            $distanciaMetros = (float) ($route->distance_to_route_meters ?? 500.0);
            $minutosDesvio = max(1.5, ($distanciaMetros / 1000.0) / 0.45);
            $desvioConTrafico = $minutosDesvio * $trafficInfo['congestion_factor'];
            $res = $this->evaluateDetour($route, $pickupLat, $pickupLng, $desvioConTrafico);
            $res['traffic_info'] = $trafficInfo;

            return $res;
        }

        $origen = $coordenadasRuta[0];
        $destino = end($coordenadasRuta);

        // 2. Calcular tiempo con la inserción de la parada de recogida
        $rutaConDesvio = $this->routingService->calculateRoute(
            $origen,
            $destino,
            [[$pickupLat, $pickupLng]]
        );

        $duracionBase = (float) $route->estimated_duration_minutes;
        $duracionConDesvio = (float) $rutaConDesvio['duration_minutes'];

        $tiempoDesvioNeto = max(1.0, $duracionConDesvio - $duracionBase);

        // Aplicar el factor multiplicador de congestión en tiempo real
        $tiempoDesvioAjustado = $tiempoDesvioNeto * (float) $trafficInfo['congestion_factor'];

        $resultado = $this->evaluateDetour($route, $pickupLat, $pickupLng, $tiempoDesvioAjustado);
        $resultado['traffic_info'] = $trafficInfo;

        return $resultado;
    }

    /**
     * Evaluar restricciones duras de tiempo y calcular desglose de tarifas.
     */
    public function evaluateDetour(
        Route $route,
        float $pickupLat,
        float $pickupLng,
        float $detourTravelMinutes = 4.0
    ): array {
        $tiempoDesvioTotal = round($detourTravelMinutes + self::BOARDING_WAIT_MINUTES, 1);
        $nuevoDesvioAcumulado = round($route->accumulated_detour_minutes + $tiempoDesvioTotal, 1);

        // 1. Validar restricción dura de umbral máximo de retraso
        $maxPermitido = (float) ($route->max_detour_minutes ?: self::MAX_TOTAL_DETOUR_MINUTES);
        if ($nuevoDesvioAcumulado > $maxPermitido) {
            return [
                'is_viable' => false,
                'rejection_reason' => "El desvío (+{$tiempoDesvioTotal} min) excede el umbral máximo de {$maxPermitido} minutos acumulados permitido por el conductor.",
                'detour_minutes' => $tiempoDesvioTotal,
            ];
        }

        // 2. Validar que no supere la hora de llegada al campus
        $horaLlegadaEstimada = $route->scheduled_departure_time
            ->copy()
            ->addMinutes((int) round($route->estimated_duration_minutes + $nuevoDesvioAcumulado));

        if ($horaLlegadaEstimada->greaterThan($route->target_arrival_time)) {
            return [
                'is_viable' => false,
                'rejection_reason' => 'El desvío causaría que el conductor llegue después de su hora límite programada al campus universitario.',
                'detour_minutes' => $tiempoDesvioTotal,
            ];
        }

        // 3. Tarifa colaborativa sugerida
        $tarifaBase = (float) $route->base_contribution_cop;
        $recargoDesvio = round($detourTravelMinutes * self::COP_PER_DETOUR_MINUTE, 0);
        $tarifaTotalSugerida = $tarifaBase + $recargoDesvio;

        return [
            'is_viable' => true,
            'detour_minutes' => $tiempoDesvioTotal,
            'detour_travel_minutes' => round($detourTravelMinutes, 1),
            'boarding_wait_minutes' => self::BOARDING_WAIT_MINUTES,
            'new_accumulated_detour' => $nuevoDesvioAcumulado,
            'base_fare_cop' => $tarifaBase,
            'detour_extra_fee_cop' => $recargoDesvio,
            'total_suggested_fare_cop' => $tarifaTotalSugerida,
            'estimated_arrival_time' => $horaLlegadaEstimada->toISOString(),
        ];
    }
}
