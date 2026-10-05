<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * SIM-003: el prefijo de Redis es fijo (uniwheels-database-) e independiente de
 * APP_NAME, para que la suspensión escrita por auth-service la lean los demás servicios.
 */
class RedisPrefixTest extends TestCase
{
    use RefreshDatabase;

    public function test_el_prefijo_por_defecto_no_depende_de_app_name(): void
    {
        $previoEnv = $_ENV['REDIS_PREFIX'] ?? null;
        $previoServer = $_SERVER['REDIS_PREFIX'] ?? null;
        unset($_ENV['REDIS_PREFIX'], $_SERVER['REDIS_PREFIX']);
        $appName = $_ENV['APP_NAME'] ?? null;
        $_ENV['APP_NAME'] = $_SERVER['APP_NAME'] = 'Otro Nombre';

        try {
            $config = require config_path('database.php');
        } finally {
            if ($previoEnv !== null) {
                $_ENV['REDIS_PREFIX'] = $previoEnv;
            }
            if ($previoServer !== null) {
                $_SERVER['REDIS_PREFIX'] = $previoServer;
            }
            $_ENV['APP_NAME'] = $_SERVER['APP_NAME'] = $appName ?? 'Laravel';
        }

        $this->assertSame('uniwheels-database-', $config['redis']['options']['prefix']);
    }

    public function test_un_usuario_con_la_llave_de_suspension_con_ese_prefijo_recibe_403(): void
    {
        $this->assertSame('uniwheels-database-', config('database.redis.options.prefix'));

        $userId = (string) Str::uuid();
        Redis::setex("uniwheels:suspended_user:{$userId}", 60, '1');

        try {
            $this->withToken($this->jwtDePrueba($userId))
                ->getJson('/api/v1/passenger/active-trip')
                ->assertStatus(403)
                ->assertJson(['message' => 'Tu cuenta está suspendida.']);
        } finally {
            Redis::del("uniwheels:suspended_user:{$userId}");
        }
    }
}
