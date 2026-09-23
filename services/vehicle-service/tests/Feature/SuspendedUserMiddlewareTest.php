<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

test('un usuario suspendido recibe 403 en endpoint protegido de vehicle-service', function () {
    $userId = (string) Str::uuid();

    Redis::shouldReceive('exists')
        ->andReturnUsing(function (string $key) use ($userId) {
            if ($key === "uniwheels:suspended_user:{$userId}") {
                return 1;
            }

            return 0;
        });

    $this->withToken(jwtDePrueba($userId))
        ->getJson('/api/v1/vehicles')
        ->assertStatus(403)
        ->assertJson([
            'message' => 'Tu cuenta está suspendida.',
        ]);
});

test('un usuario no suspendido puede acceder normalmente', function () {
    $userId = (string) Str::uuid();

    Redis::shouldReceive('exists')
        ->andReturnUsing(fn () => 0);

    $this->withToken(jwtDePrueba($userId))
        ->getJson('/api/v1/vehicles')
        ->assertStatus(200);
});
