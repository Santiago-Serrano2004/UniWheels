<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\TripCompletedSummary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrainingDataController extends Controller
{
    /**
     * Exportar pares (distancia real, duración real) de viajes completados para
     * el reentrenamiento del modelo XGBoost de ETA en ai-route-service — ver
     * scripts/retrain_eta_model.py. Solo invocable servicio-a-servicio.
     */
    public function completedTrips(Request $request): JsonResponse
    {
        $porPagina = min(500, max(1, (int) $request->query('per_page', 200)));

        $pagina = TripCompletedSummary::with('trip:id,scheduled_pickup_time')
            ->orderBy('completed_at')
            ->paginate($porPagina);

        return response()->json([
            'success' => true,
            'data' => $pagina->getCollection()->map(fn (TripCompletedSummary $resumen) => [
                'trip_id' => $resumen->trip_id,
                'distance_km' => $resumen->total_distance_km,
                'actual_duration_minutes' => $resumen->actual_duration_minutes,
                'scheduled_pickup_time' => $resumen->trip?->scheduled_pickup_time?->toISOString(),
            ])->values(),
            'meta' => [
                'current_page' => $pagina->currentPage(),
                'last_page' => $pagina->lastPage(),
                'total' => $pagina->total(),
            ],
        ]);
    }
}
