<?php

namespace Tests\Feature;

use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class SessionRevocationTest extends TestCase
{
    use RefreshDatabase;

    private function tokenEmitidoHace(string $userId, int $segundos): string
    {
        $iat = time() - $segundos;

        return JWT::encode([
            'iss' => 'uniwheels-auth-service',
            'sub' => $userId,
            'roles' => [],
            'type' => 'user',
            'jti' => (string) Str::uuid(),
            'iat' => $iat,
            'exp' => $iat + 3600,
        ], config('jwt.secret'), config('jwt.algo'));
    }

    public function test_un_token_anterior_a_tokens_valid_after_da_401(): void
    {
        $userId = (string) Str::uuid();

        Redis::shouldReceive('exists')->andReturn(0);
        Redis::shouldReceive('get')
            ->with("uniwheels:tokens_valid_after:{$userId}")
            ->andReturn((string) time());

        $this->withToken($this->tokenEmitidoHace($userId, 60))
            ->getJson('/api/v1/passenger/active-trip')
            ->assertStatus(401)
            ->assertJson(['message' => 'Tu sesión ya no es válida. Inicia sesión de nuevo.']);

        $this->withToken($this->tokenEmitidoHace($userId, 0))
            ->getJson('/api/v1/passenger/active-trip')
            ->assertStatus(200);
    }
}
