<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\WeeklyMetricsRequest;
use App\Services\PilotMetrics;
use Illuminate\Http\JsonResponse;

class PilotMetricsController extends Controller
{
    public function __construct(private PilotMetrics $metrics) {}

    /**
     * Métricas agregadas por semana para Bienestar. Sin ids ni nombres de usuarios.
     */
    public function weekly(WeeklyMetricsRequest $request): JsonResponse
    {
        $resultado = $this->metrics->weekly($request->weeks());

        return response()->json([
            'success' => true,
            'partial' => $resultado['partial'],
            'data' => $resultado['data'],
        ]);
    }
}
