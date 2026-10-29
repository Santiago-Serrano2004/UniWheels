<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cliente HTTP hacia auth-service para pedir la suspensión automática de un
 * usuario por cancelaciones tardías. Nunca lanza: si auth-service no responde,
 * la cancelación del viaje igual debe completarse.
 */
class AuthSuspensionClient
{
    public function __construct(private JwtVerifier $jwtVerifier) {}

    /**
     * @return array{suspended: bool, suspended_until?: string|null}|null null si la llamada falló
     */
    public function suspendForLateCancellations(string $userId, int $count, int $days): ?array
    {
        try {
            $token = $this->jwtVerifier->issueServiceToken('trip-service');
            $baseUrl = config('services.auth_service.url');

            $respuesta = Http::withToken($token)
                ->timeout(3)
                ->post("{$baseUrl}/api/v1/internal/users/{$userId}/late-cancellation-suspension", [
                    'late_cancellations_count' => $count,
                    'days' => $days,
                ]);

            if ($respuesta->successful() && $respuesta->json('success')) {
                return $respuesta->json('data');
            }

            Log::warning('auth-service rechazó la suspensión por cancelaciones tardías.', [
                'user_id' => $userId,
                'status' => $respuesta->status(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('No se pudo solicitar la suspensión a auth-service.', [
                'user_id' => $userId,
                'exception_class' => get_class($e),
            ]);
        }

        return null;
    }
}
