<?php

namespace App\Services;

use App\Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\Log;
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
     * Como verify(), pero acepta un token vencido hace menos de la ventana de renovación
     * (config jwt.refresh_window, 7 días) siempre que la firma sea válida, sea un token de
     * usuario y no esté en la blocklist. Solo para renovar la sesión (POST /auth/refresh).
     */
    public function verifyForRefresh(string $token): ?stdClass
    {
        $leewayPrevio = JWT::$leeway;
        JWT::$leeway = (int) config('jwt.refresh_window');

        try {
            $claims = JWT::decode($token, new Key(config('jwt.secret'), config('jwt.algo')));
        } catch (\Throwable) {
            return null;
        } finally {
            JWT::$leeway = $leewayPrevio;
        }

        if (($claims->type ?? null) !== 'user' || ! isset($claims->jti, $claims->sub)) {
            return null;
        }

        if (Redis::exists("jwt:blocklist:{$claims->jti}")) {
            return null;
        }

        return $claims;
    }

    /**
     * Revoca el token añadiendo su jti a la blocklist de Redis hasta que ya no se pueda
     * usar ni renovar: TTL = vida restante del token + ventana de renovación (SIM-021),
     * para que un token revocado y vencido no se pueda refrescar.
     */
    public function revoke(stdClass $claims): void
    {
        $ttlRestante = max(1, $claims->exp - time() + (int) config('jwt.refresh_window'));
        Redis::setex("jwt:blocklist:{$claims->jti}", $ttlRestante, '1');
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
