<?php

namespace App\Services;

use App\Models\User;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\SignatureInvalidException;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use stdClass;
use UnexpectedValueException;

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
     * Verifica firma y expiración. Devuelve los claims decodificados o null si el
     * token es inválido, expiró, o su jti está en la blocklist de revocación.
     */
    public function verify(string $token): ?stdClass
    {
        try {
            $claims = JWT::decode($token, new Key(config('jwt.secret'), config('jwt.algo')));
        } catch (ExpiredException|SignatureInvalidException|UnexpectedValueException) {
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
