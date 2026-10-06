<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Pide a los demás microservicios que borren o anonimicen los datos personales de
 * un usuario (Ley 1581). Nunca lanza: si un servicio falla, la eliminación local de la
 * cuenta igual se completa y se deja un warning con el user_id.
 *
 * TODO: reintentos (cola con backoff) para los servicios que no respondieron.
 */
class PersonalDataEraser
{
    public function __construct(private JwtService $jwtService) {}

    /**
     * @return array<string, bool> servicio => si confirmó el borrado
     */
    public function eraseEverywhere(string $userId): array
    {
        $resultado = [];

        foreach (config('services.personal_data_erasure') as $servicio => $baseUrl) {
            $resultado[$servicio] = $this->eraseIn($servicio, $baseUrl, $userId);
        }

        return $resultado;
    }

    private function eraseIn(string $servicio, string $baseUrl, string $userId): bool
    {
        try {
            $respuesta = Http::withToken($this->jwtService->issueServiceToken())
                ->acceptJson()
                ->timeout(5)
                ->delete(rtrim($baseUrl, '/')."/api/v1/internal/users/{$userId}/personal-data");

            if ($respuesta->successful()) {
                return true;
            }

            Log::warning('Un servicio no pudo borrar los datos personales del usuario.', [
                'user_id' => $userId,
                'service' => $servicio,
                'status' => $respuesta->status(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('No se pudo contactar al servicio para borrar los datos personales del usuario.', [
                'user_id' => $userId,
                'service' => $servicio,
                'exception_class' => get_class($e),
            ]);
        }

        return false;
    }
}
