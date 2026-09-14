<?php

namespace Tests;

use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Str;

abstract class TestCase extends BaseTestCase
{
    /**
     * Genera un JWT válido (mismo formato/secreto que emite auth-service) para
     * autenticar peticiones en tests, dado que este servicio solo verifica tokens.
     */
    protected function jwtDePrueba(string $userId, array $roles = []): string
    {
        $ahora = time();

        return JWT::encode([
            'iss' => 'uniwheels-auth-service',
            'sub' => $userId,
            'email' => 'test@unab.edu.co',
            'roles' => $roles,
            'type' => 'user',
            'jti' => (string) Str::uuid(),
            'iat' => $ahora,
            'exp' => $ahora + 3600,
        ], config('jwt.secret'), config('jwt.algo'));
    }
}
