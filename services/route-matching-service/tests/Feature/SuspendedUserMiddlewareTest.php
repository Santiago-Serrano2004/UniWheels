<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class SuspendedUserMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_un_usuario_suspendido_recibe_403_en_endpoint_protegido(): void
    {
        $userId = (string) Str::uuid();

        Redis::shouldReceive('exists')
            ->andReturnUsing(function (string $key) use ($userId) {
                if ($key === "uniwheels:suspended_user:{$userId}") {
                    return 1;
                }

                return 0;
            });

        $response = $this->withToken($this->jwtDePrueba($userId))
            ->getJson('/api/v1/routes');

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Tu cuenta está suspendida.',
            ]);
    }

    public function test_un_usuario_no_suspendido_puede_acceder_normalmente(): void
    {
        $userId = (string) Str::uuid();

        Redis::shouldReceive('exists')
            ->andReturnUsing(fn () => 0);

        $response = $this->withToken($this->jwtDePrueba($userId))
            ->getJson('/api/v1/routes');

        $response->assertStatus(200);
    }
}
