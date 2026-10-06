<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cliente HTTP hacia auth-service para sumar un viaje completado a las estadísticas de
 * reputación de un usuario (SIM-020). Nunca lanza: si auth-service no responde, completar
 * el viaje igual debe terminar bien.
 *
 * TODO: reintentos / conciliación de los viajes completados que no se contaron.
 */
class AuthReputationClient
{
    public function __construct(private JwtVerifier $jwtVerifier) {}

    /**
     * @param  string  $role  'conductor' o 'pasajero'
     */
    public function recordCompletedTrip(string $userId, string $role): bool
    {
        try {
            $respuesta = Http::withToken($this->jwtVerifier->issueServiceToken('trip-service'))
                ->timeout(3)
                ->post(config('services.auth_service.url')."/api/v1/internal/users/{$userId}/reputation", [
                    'type' => 'trip_completed',
                    'role' => $role,
                ]);

            if ($respuesta->successful()) {
                return true;
            }

            Log::warning('auth-service rechazó el registro del viaje completado en la reputación.', [
                'user_id' => $userId,
                'status' => $respuesta->status(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('No se pudo registrar el viaje completado en la reputación (auth-service).', [
                'user_id' => $userId,
                'exception_class' => get_class($e),
            ]);
        }

        return false;
    }
}
