<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRatingRequest;
use App\Models\Rating;
use App\Services\RatingValidationClient;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RatingController extends Controller
{
    public function __construct(private RatingValidationClient $validationClient) {}

    /**
     * Registrar una calificación 1-5 de un participante de un viaje completado (SIM-020).
     * Se verifica con trip-service que el calificador y el calificado participaron en el
     * viaje (uno conductor y el otro pasajero) y que está completado; si no, 403.
     * El constraint UNIQUE(trip_id, rater_user_id, rated_user_id) da el 409 por duplicado.
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

        $viaje = $this->validationClient->getTrip($datos['trip_id']);

        if ($viaje === RatingValidationClient::TRIP_UNAVAILABLE) {
            return response()->json([
                'success' => false,
                'message' => 'No fue posible validar el viaje. Intenta nuevamente.',
            ], 503);
        }

        $rolDelCalificado = $viaje === null ? null : match ((string) $datos['rated_user_id']) {
            (string) $viaje['driver_id'] => 'conductor',
            (string) $viaje['passenger_id'] => 'pasajero',
            default => null,
        };
        $esParticipante = $viaje !== null
            && in_array($raterUserId, [(string) $viaje['driver_id'], (string) $viaje['passenger_id']], true);

        if (! $esParticipante || $rolDelCalificado === null || $viaje['status'] !== 'completado') {
            return response()->json([
                'success' => false,
                'message' => 'Solo puedes calificar a quien participó contigo en un viaje completado.',
            ], 403);
        }

        try {
            $rating = Rating::create([
                'trip_id' => $datos['trip_id'],
                'rater_user_id' => $raterUserId,
                'rated_user_id' => $datos['rated_user_id'],
                'role_rated' => $rolDelCalificado,
                'score' => $datos['score'],
                'optional_comment' => $datos['optional_comment'] ?? null,
            ]);
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ya has calificado a este usuario para este viaje.',
            ], 409);
        }

        $this->validationClient->reportRating($rating->rated_user_id, $rolDelCalificado, (int) $rating->score);

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
