<?php

namespace App\Services;

use App\Models\Route;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Servicio de Emparejamiento Geoespacial e Inteligencia de Desvío (Fase 04)
 * 
 * Orquesta la poda espacial PostGIS, el ruteo topológico OSRM y la evaluación
 * de restricciones duras para clasificar las coincidencias en Modalidad 1
 * (Match en ruta, 0 min) y Modalidad 2 (Desvío optimizado con IA).
 */
class SpatialMatchingService
{
    const DIRECT_MATCH_RADIUS_METERS = 300.0; // Umbral para Modalidad 1 (en ruta)
    const MAX_SEARCH_RADIUS_METERS = 1200.0; // Radio máximo para evaluar desvío
    const BOARDING_WAIT_MINUTES = 2.0; // Tiempo estimado de abordaje
    const COP_PER_DETOUR_MINUTE = 300.0; // Recargo por minuto de desvío
    const MAX_TOTAL_DETOUR_MINUTES = 15.0; // Restricción dura máxima por trayecto

    public function __construct(
        protected PostGisSpatialRepository $spatialRepo,
        protected OsrmRoutingService $routingService
    ) {}

    /**
     * Buscar y clasificar coincidencias de rutas para un pasajero.
     *
     * @param float $pickupLat Latitud del punto de abordaje
     * @param float $pickupLng Longitud del punto de abordaje
     * @param int $destinationCampusId ID de la sede universitaria de destino
     * @param string|null $preferredTime Hora preferida de salida (opcional)
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
            if (!$this->spatialRepo->isPointInForwardDirection($ruta->id, $pickupLat, $pickupLng)) {
                continue;
            }

            $distanciaMetros = (float) $ruta->distance_to_route_meters;

            if ($distanciaMetros <= self::DIRECT_MATCH_RADIUS_METERS) {
                // MODALIDAD 1: Match en Ruta (Sin desvío)
                $matches[] = [
                    'route_id' => $ruta->id,
                    'driver_id' => $ruta->driver_id,
                    'vehicle_id' => $ruta->vehicle_id,
                    'origin_name' => $ruta->origin_name,
                    'destination_campus_name' => $ruta->destination_campus_name,
                    'scheduled_departure_time' => $ruta->scheduled_departure_time->format('H:i A'),
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
                ];
            } else {
                // MODALIDAD 2: Desvío asistido por IA
                $evaluacion = $this->evaluateRouteDetourForPassenger($ruta, $pickupLat, $pickupLng);

                if ($evaluacion['is_viable']) {
                    $matches[] = [
                        'route_id' => $ruta->id,
                        'driver_id' => $ruta->driver_id,
                        'vehicle_id' => $ruta->vehicle_id,
                        'origin_name' => $ruta->origin_name,
                        'destination_campus_name' => $ruta->destination_campus_name,
                        'scheduled_departure_time' => $ruta->scheduled_departure_time->format('H:i A'),
                        'departure_timestamp' => $ruta->scheduled_departure_time->toISOString(),
                        'available_seats' => $ruta->available_seats,
                        'modality' => 'modalidad_2_desvio',
                        'modality_label' => 'Desvío Optimizado con IA',
                        'detour_minutes' => $evaluacion['detour_minutes'],
                        'detour_label' => '+' . round($evaluacion['detour_minutes']) . ' min',
                        'distance_to_pickup_meters' => round($distanciaMetros, 0),
                        'suggested_fare_cop' => $evaluacion['total_suggested_fare_cop'],
                        'is_viable' => true,
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

        return $matches;
    }

    /**
     * Evaluar el impacto temporal y económico de insertar una parada en una ruta específica.
     */
    public function evaluateRouteDetourForPassenger(Route $route, float $pickupLat, float $pickupLng): array
    {
        $coordenadasRuta = $this->spatialRepo->getRouteCoordinates($route->id);

        if (!$coordenadasRuta || count($coordenadasRuta) < 2) {
            // Si no hay polilínea previa, estimar desvío por distancia
            $distanciaMetros = (float) ($route->distance_to_route_meters ?? 500.0);
            $minutosDesvio = max(1.5, ($distanciaMetros / 1000.0) / 0.45); // ~27 km/h
            return $this->evaluateDetour($route, $pickupLat, $pickupLng, $minutosDesvio);
        }

        $origen = $coordenadasRuta[0];
        $destino = end($coordenadasRuta);

        // 1. Calcular tiempo con la inserción de la parada de recogida
        $rutaConDesvio = $this->routingService->calculateRoute(
            $origen,
            $destino,
            [[$pickupLat, $pickupLng]]
        );

        $duracionBase = (float) $route->estimated_duration_minutes;
        $duracionConDesvio = (float) $rutaConDesvio['duration_minutes'];

        $tiempoDesvioNeto = max(1.0, $duracionConDesvio - $duracionBase);

        // Aplicar factor de tráfico según hora de salida
        $factorTrafico = $this->getTrafficMultiplier($route->scheduled_departure_time);
        $tiempoDesvioAjustado = $tiempoDesvioNeto * $factorTrafico;

        return $this->evaluateDetour($route, $pickupLat, $pickupLng, $tiempoDesvioAjustado);
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

    /**
     * Factor de congestión horaria para Bucaramanga y AMB.
     */
    protected function getTrafficMultiplier(Carbon $departureTime): float
    {
        $hora = (int) $departureTime->format('H');
        $minuto = (int) $departureTime->format('i');
        $tiempoDecimal = $hora + ($minuto / 60.0);

        // Hora pico mañana: 06:45 AM - 08:15 AM
        if ($tiempoDecimal >= 6.75 && $tiempoDecimal <= 8.25) {
            return 1.25;
        }

        // Hora pico mediodía: 11:45 AM - 01:15 PM
        if ($tiempoDecimal >= 11.75 && $tiempoDecimal <= 13.25) {
            return 1.20;
        }

        // Hora pico tarde/noche: 05:30 PM - 07:15 PM
        if ($tiempoDecimal >= 17.5 && $tiempoDecimal <= 19.25) {
            return 1.30;
        }

        // Horario valle estándar
        return 1.05;
    }
}
