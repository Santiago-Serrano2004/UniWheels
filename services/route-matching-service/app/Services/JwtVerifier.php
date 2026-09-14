<?php

namespace App\Services;

use Firebase\JWT\ExpiredException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\SignatureInvalidException;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use stdClass;
use UnexpectedValueException;

class JwtVerifier
{
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
}
