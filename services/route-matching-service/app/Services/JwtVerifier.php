<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use stdClass;

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
     * Emite un token de corta duración (60s) para llamadas servicio-a-servicio
     * (p. ej. hacia ai-route-service). Cualquier servicio que posea el mismo
     * JWT_SECRET puede firmar uno — misma lógica que trip-service.
     */
    public function issueServiceToken(string $serviceName): string
    {
        $ahora = time();

        return JWT::encode([
            'iss' => 'uniwheels-'.$serviceName,
            'sub' => $serviceName,
            'type' => 'service',
            'jti' => (string) Str::uuid(),
            'iat' => $ahora,
            'exp' => $ahora + 60,
        ], config('jwt.secret'), config('jwt.algo'));
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
