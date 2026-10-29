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
     * Métricas agregadas por semana para Bienestar. Solo conteos: sin ids ni hashes.
     */
    public function weekly(WeeklyMetricsRequest $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->metrics->weekly($request->weeks()),
        ]);
    }
}
