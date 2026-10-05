<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use stdClass;

/**
 * Verificación local (sin llamadas de red) del JWT compartido, emitido por
 * auth-service. Comparte el mismo JWT_SECRET y la misma blocklist de Redis
 * usada para revocación (logout / borrado de cuenta).
 */
class JwtVerifier
{
    public function verify(string $token): ?stdClass
    {
        try {
            $claims = JWT::decode($token, new Key(config('jwt.secret'), config('jwt.algo')));
        } catch (\Throwable) {
            // Cualquier fallo al decodificar (firma, expiración, JSON/estructura mal formados) = 401.
            return null;
        }

        if (isset($claims->jti) && Redis::exists("jwt:blocklist:{$claims->jti}")) {
            return null;
        }

        return $claims;
    }

    /**
     * A5: true si el usuario cambió su contraseña o eliminó su cuenta después de emitirse
     * este token. auth-service escribe uniwheels:tokens_valid_after:{id} (mismo prefijo que
     * la suspensión). Si Redis falla no se bloquea al usuario (igual que la suspensión).
     */
    public function sessionRevoked(stdClass $claims): bool
    {
        if (! isset($claims->sub, $claims->iat)) {
            return false;
        }

        try {
            $validDesde = Redis::get("uniwheels:tokens_valid_after:{$claims->sub}");
        } catch (\Throwable $e) {
            Log::warning('No se pudo verificar la revocación de sesiones en Redis: '.$e->getMessage());

            return false;
        }

        return $validDesde !== null && $validDesde !== false && (int) $claims->iat < (int) $validDesde;
    }
}
