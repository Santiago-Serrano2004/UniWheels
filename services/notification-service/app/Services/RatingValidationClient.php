<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Llamadas de las calificaciones a otros servicios (SIM-020): consultar a trip-service
 * quiénes participaron en un viaje y reportar la calificación a auth-service.
 */
class RatingValidationClient
{
    public const TRIP_UNAVAILABLE = 'unavailable';

    public function __construct(private JwtVerifier $jwtVerifier) {}

    /**
     * @return array{id: string, driver_id: string, passenger_id: string, status: string}|string|null
     *                                                                                                null si el viaje no existe; TRIP_UNAVAILABLE si trip-service no respondió
     */
    public function getTrip(string $tripId): array|string|null
    {
        try {
            $respuesta = Http::withToken($this->jwtVerifier->issueServiceToken('notification-service'))
                ->timeout(3)
                ->get(config('services.trip_service.url')."/api/v1/internal/trips/{$tripId}");

            if ($respuesta->successful() && $respuesta->json('success')) {
                return $respuesta->json('data');
            }

            if ($respuesta->status() === 404) {
                return null;
            }

            Log::warning('trip-service respondió un error al validar al calificador.', [
                'trip_id' => $tripId,
                'status' => $respuesta->status(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('No se pudo consultar trip-service para validar la calificación.', [
                'trip_id' => $tripId,
                'exception_class' => get_class($e),
            ]);
        }

        return self::TRIP_UNAVAILABLE;
    }

    /**
     * Suma la calificación a user_reputation_stats. Nunca lanza: si auth-service falla, la
     * calificación ya guardada se mantiene.
     *
     * TODO: reintentos / conciliación contra la tabla ratings.
     */
    public function reportRating(string $ratedUserId, string $roleRated, int $score): bool
    {
        try {
            $respuesta = Http::withToken($this->jwtVerifier->issueServiceToken('notification-service'))
                ->timeout(3)
                ->post(config('services.auth_service.url')."/api/v1/internal/users/{$ratedUserId}/reputation", [
                    'type' => 'rating',
                    'role' => $roleRated,
                    'score' => $score,
                ]);

            if ($respuesta->successful()) {
                return true;
            }

            Log::warning('auth-service rechazó la calificación para la reputación.', [
                'rated_user_id' => $ratedUserId,
                'status' => $respuesta->status(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('No se pudo reportar la calificación a auth-service.', [
                'rated_user_id' => $ratedUserId,
                'exception_class' => get_class($e),
            ]);
        }

        return false;
    }
}
