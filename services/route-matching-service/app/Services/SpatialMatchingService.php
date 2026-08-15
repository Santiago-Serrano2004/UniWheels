<?php

namespace App\Services;

use App\Models\Route;
use Illuminate\Support\Facades\DB;

class SpatialMatchingService
{
    const BOARDING_WAIT_MINUTES = 2.0; // Tiempo de espera de abordaje por pasajero
    const COP_PER_DETOUR_MINUTE = 300.0; // Recargo por minuto de desvío real
    const MAX_TOTAL_DETOUR_MINUTES = 15.0; // Restricción dura máxima por viaje

    /**
     * Evaluar si una solicitud de desvío (Modalidad 2) es factible y calcular su costo exacto.
     */
    public function evaluateDetour(
        Route $route,
        float $pickupLat,
        float $pickupLng,
        float $detourTravelMinutes = 4.0
    ): array {
        $tiempoDesvioTotal = $detourTravelMinutes + self::BOARDING_WAIT_MINUTES;
        $nuevoDesvioAcumulado = $route->accumulated_detour_minutes + $tiempoDesvioTotal;

        // 1. Validar restricción dura de 15 minutos totales de retraso acumulado
        if ($nuevoDesvioAcumulado > self::MAX_TOTAL_DETOUR_MINUTES) {
            return [
                'is_viable' => false,
                'rejection_reason' => 'El desvío excede el umbral máximo de 15 minutos acumulados de retraso para este viaje.',
                'detour_minutes' => $tiempoDesvioTotal,
            ];
        }

        // 2. Validar que la hora estimada de llegada no supere la hora objetivo del conductor
        $horaLlegadaEstimada = $route->scheduled_departure_time
            ->copy()
            ->addMinutes((int) ($route->estimated_duration_minutes + $nuevoDesvioAcumulado));

        if ($horaLlegadaEstimada->greaterThan($route->target_arrival_time)) {
            return [
                'is_viable' => false,
                'rejection_reason' => 'El desvío causaría que el conductor llegue después de su hora límite programada al campus.',
                'detour_minutes' => $tiempoDesvioTotal,
            ];
        }

        // 3. Cálculo de la tarifa colaborativa sugerida con markup
        $tarifaBase = (float) $route->base_contribution_cop;
        $recargoDesvio = $detourTravelMinutes * self::COP_PER_DETOUR_MINUTE;
        $tarifaTotalSugerida = $tarifaBase + $recargoDesvio;

        return [
            'is_viable' => true,
            'detour_minutes' => $tiempoDesvioTotal,
            'detour_travel_minutes' => $detourTravelMinutes,
            'boarding_wait_minutes' => self::BOARDING_WAIT_MINUTES,
            'new_accumulated_detour' => $nuevoDesvioAcumulado,
            'base_fare_cop' => $tarifaBase,
            'detour_extra_fee_cop' => $recargoDesvio,
            'total_suggested_fare_cop' => $tarifaTotalSugerida,
            'estimated_arrival_time' => $horaLlegadaEstimada->toISOString(),
        ];
    }
}
