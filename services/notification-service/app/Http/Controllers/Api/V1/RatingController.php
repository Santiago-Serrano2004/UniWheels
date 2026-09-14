<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRatingRequest;
use App\Models\Rating;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RatingController extends Controller
{
    /**
     * Registrar una calificación 1-5 de un participante del viaje.
     *
     * NOTA (incompleto): aún no se valida contra trip-service que el rater
     * realmente haya participado en trip_id y que el viaje esté completado —
     * trip-service no expone hoy un endpoint de consulta genérica por id para
     * verificarlo. El constraint UNIQUE(trip_id, rater_user_id, rated_user_id)
     * sí evita duplicados, y rated_user_id nunca puede ser el propio rater.
     */
    public function store(StoreRatingRequest $request): JsonResponse
    {
        $datos = $request->validated();
        $raterUserId = $request->attributes->get('user_id');

        if ($datos['rated_user_id'] === $raterUserId) {
            return response()->json([
                'success' => false,
                'message' => 'No puedes calificarte a ti mismo.',
            ], 422);
        }

        try {
            $rating = Rating::create([
                'trip_id' => $datos['trip_id'],
                'rater_user_id' => $raterUserId,
                'rated_user_id' => $datos['rated_user_id'],
                'role_rated' => $datos['role_rated'],
                'score' => $datos['score'],
                'optional_comment' => $datos['optional_comment'] ?? null,
            ]);
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ya has calificado a este usuario para este viaje.',
            ], 409);
        }

        return response()->json([
            'success' => true,
            'message' => 'Calificación registrada exitosamente.',
            'data' => [
                'id' => $rating->id,
                'trip_id' => $rating->trip_id,
                'rated_user_id' => $rating->rated_user_id,
                'score' => $rating->score,
            ],
        ], 201);
    }

    /**
     * Listar las calificaciones recibidas por el usuario autenticado.
     */
    public function received(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('user_id');

        $ratings = Rating::where('rated_user_id', $userId)
            ->latest()
            ->limit(50)
            ->get(['id', 'trip_id', 'role_rated', 'score', 'optional_comment', 'created_at']);

        return response()->json([
            'success' => true,
            'data' => $ratings,
        ]);
    }
}
