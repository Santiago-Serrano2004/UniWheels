<?php

namespace Tests\Feature;

use Firebase\JWT\JWT;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * SIM-007: un id que no es UUID responde 404, nunca 500.
 */
class NonUuidIdTest extends TestCase
{
    public function test_un_id_que_no_es_uuid_responde_404(): void
    {
        $ahora = time();
        $token = JWT::encode([
            'iss' => 'uniwheels-auth-service',
            'sub' => (string) Str::uuid(),
            'roles' => ['administrador'],
            'type' => 'user',
            'jti' => (string) Str::uuid(),
            'iat' => $ahora,
            'exp' => $ahora + 3600,
        ], config('jwt.secret'), config('jwt.algo'));

        $this->withToken($token)
            ->getJson('/api/v1/admin/users/no-es-un-uuid')
            ->assertStatus(404);
    }
}
