<?php

namespace App\Http\Controllers\Api\V1\Internal;

use App\Http\Controllers\Controller;
use App\Http\Requests\WeeklyMetricsRequest;
use App\Services\PilotMetrics;
use Illuminate\Http\JsonResponse;

class PilotMetricsController extends Controller
{
    public function __construct(private PilotMetrics $metrics) {}

    /**
     * Hashes (HMAC-SHA256) de usuarios activos por semana, para que trip-service calcule
     * la unión de activos únicos sin recibir ids reales. Solo servicio-a-servicio.
     */
    public function activeUsers(WeeklyMetricsRequest $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->metrics->activeUserHashes($request->weeks()),
        ]);
    }
}
