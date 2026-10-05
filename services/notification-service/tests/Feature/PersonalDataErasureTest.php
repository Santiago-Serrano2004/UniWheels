<?php

namespace Tests\Feature;

use App\Models\DevicePushToken;
use App\Models\Notification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PersonalDataErasureTest extends TestCase
{
    use RefreshDatabase;

    private function crearDatos(string $userId, string $token): void
    {
        Notification::create([
            'user_id' => $userId,
            'title' => 'Hola',
            'body' => 'Mensaje',
            'type' => 'viaje_confirmado',
        ]);
        DevicePushToken::create([
            'user_id' => $userId,
            'token' => $token,
            'platform' => 'expo',
        ]);
    }

    public function test_el_endpoint_interno_exige_token_de_servicio(): void
    {
        $userId = (string) Str::uuid();

        $this->deleteJson("/api/v1/internal/users/{$userId}/personal-data")->assertStatus(401);
        $this->withToken($this->jwtDePrueba($userId))
            ->deleteJson("/api/v1/internal/users/{$userId}/personal-data")
            ->assertStatus(403);
    }

    public function test_borra_notificaciones_y_tokens_push_del_usuario_sin_tocar_los_de_otros(): void
    {
        $userId = (string) Str::uuid();
        $otroId = (string) Str::uuid();
        $this->crearDatos($userId, 'ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]');
        $this->crearDatos($otroId, 'ExponentPushToken[bbbbbbbbbbbbbbbbbbbbbb]');

        $this->withToken($this->jwtServicioDePrueba('auth-service'))
            ->deleteJson("/api/v1/internal/users/{$userId}/personal-data")
            ->assertOk();

        $this->assertSame(0, Notification::where('user_id', $userId)->count());
        $this->assertSame(0, DevicePushToken::where('user_id', $userId)->count());
        $this->assertSame(1, Notification::where('user_id', $otroId)->count());
        $this->assertSame(1, DevicePushToken::where('user_id', $otroId)->count());
    }
}
