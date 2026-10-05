<?php

namespace App\Services;

use App\Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use stdClass;

/**
 * Emisión y verificación de JWT compartido entre los microservicios UniWheels.
 *
 * auth-service es el único emisor; los demás servicios (incluido ai-route-service)
 * verifican el mismo token de forma local con el secreto compartido (JWT_SECRET),
 * sin llamadas de red. La revocación (logout / borrado de cuenta) se hace vía
 * blocklist en Redis, compartido por todos los servicios del stack.
 */
class JwtService
{
    public function issue(User $user, string $type = 'user'): string
    {
        $ahora = time();

        $payload = [
            'iss' => config('jwt.issuer'),
            'sub' => (string) $user->id,
            'email' => $user->email,
            'roles' => $user->getRoleNames()->values()->all(),
            'type' => $type,
            'jti' => (string) Str::uuid(),
            'iat' => $ahora,
            'exp' => $ahora + config('jwt.ttl'),
        ];

        return JWT::encode($payload, config('jwt.secret'), config('jwt.algo'));
    }

    /**
     * Token de corta duración (60 s) para llamadas servicio-a-servicio, igual al que
     * firman los demás servicios (type=service). Requiere el mismo JWT_SECRET.
     */
    public function issueServiceToken(string $serviceName = 'auth-service'): string
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
     * Verifica firma y expiración. Devuelve los claims decodificados o null si el
     * token es inválido, expiró, o su jti está en la blocklist de revocación.
     */
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
     * Revoca el token actual añadiendo su jti a la blocklist de Redis hasta que
     * expire de forma natural (TTL = tiempo restante de vida del propio token).
     */
    public function revoke(stdClass $claims): void
    {
        $ttlRestante = max(1, $claims->exp - time());
        Redis::setex("jwt:blocklist:{$claims->jti}", $ttlRestante, '1');
    }
}
