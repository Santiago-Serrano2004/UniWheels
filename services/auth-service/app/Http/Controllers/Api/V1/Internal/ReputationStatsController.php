<?php

namespace App\Http\Controllers\Api\V1\Internal;

use App\Http\Controllers\Controller;
use App\Http\Requests\RecordReputationEventRequest;
use App\Models\User;
use App\Models\UserReputationStats;
use Illuminate\Http\JsonResponse;

class ReputationStatsController extends Controller
{
    /**
     * SIM-020: registra un evento de reputación del usuario, enviado por otro servicio:
     * - rating: suma la calificación y el conteo del rol calificado (notification-service);
     * - trip_completed: suma un viaje completado en ese rol (trip-service).
     * Solo invocable servicio-a-servicio (jwt.service).
     */
    public function record(RecordReputationEventRequest $request, string $id): JsonResponse
    {
        $usuario = User::find($id);

        if (! $usuario) {
            return response()->json(['success' => false, 'message' => 'Usuario no encontrado.'], 404);
        }

        $sufijo = $request->input('role') === 'conductor' ? 'driver' : 'passenger';

        $stats = UserReputationStats::firstOrCreate(['user_id' => $usuario->id]);

        // Incrementos atómicos en SQL: dos eventos simultáneos no se pisan.
        if ($request->input('type') === 'rating') {
            $stats->increment("rating_count_as_{$sufijo}");
            $stats->increment("rating_sum_as_{$sufijo}", (int) $request->input('score'));
        } else {
            $stats->increment("total_trips_as_{$sufijo}");
        }

        $stats->refresh();

        return response()->json([
            'success' => true,
            'data' => [
                'rating_average_driver' => $stats->average_rating_as_driver,
                'rating_average_passenger' => $stats->average_rating_as_passenger,
                'total_trips_as_driver' => $stats->total_trips_as_driver,
                'total_trips_as_passenger' => $stats->total_trips_as_passenger,
            ],
        ]);
    }
}
