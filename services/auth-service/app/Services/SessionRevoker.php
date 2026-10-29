<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

/**
 * A5: invalida todos los JWT ya emitidos a un usuario (cambio de contraseña, borrado de cuenta).
 * Los 5 servicios leen uniwheels:tokens_valid_after:{id} y rechazan tokens con iat menor.
 */
class SessionRevoker
{
    public function revokeAll(string $userId): void
    {
        // Un token puede vivir ttl y renovarse hasta refresh_window después de vencer.
        $ttl = (int) config('jwt.refresh_window') + (int) config('jwt.ttl');

        try {
            Redis::setex("uniwheels:tokens_valid_after:{$userId}", $ttl, time());
        } catch (\Throwable $e) {
            Log::error('No se pudieron revocar las sesiones del usuario en Redis: '.$e->getMessage(), [
                'user_id' => $userId,
            ]);
        }
    }
}
