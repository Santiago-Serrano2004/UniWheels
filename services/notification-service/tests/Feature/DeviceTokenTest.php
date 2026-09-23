<?php

namespace Tests\Feature;

use App\Models\DevicePushToken;
use App\Models\Notification;
use App\Services\ExpoPushService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class DeviceTokenTest extends TestCase
{
    use RefreshDatabase;

    public function test_se_puede_registrar_un_token_push_de_dispositivo_para_el_usuario_autenticado(): void
    {
        $userId = (string) Str::uuid();

        $payload = [
            'token' => 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
            'platform' => 'android',
            'device_name' => 'Pixel 7',
            'app_version' => '1.0.0',
        ];

        $response = $this->withToken($this->jwtDePrueba($userId))
            ->postJson('/api/v1/push/device-tokens', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Token de dispositivo registrado exitosamente.',
            ])
            ->assertJsonPath('data.user_id', $userId)
            ->assertJsonPath('data.token', 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]')
            ->assertJsonPath('data.platform', 'android')
            ->assertJsonPath('data.is_active', true);

        $this->assertDatabaseHas('device_push_tokens', [
            'user_id' => $userId,
            'token' => 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
            'platform' => 'android',
            'device_name' => 'Pixel 7',
            'app_version' => '1.0.0',
            'is_active' => true,
        ]);
    }

    public function test_registrar_el_mismo_token_actualiza_usuario_y_reactiva_el_token(): void
    {
        $usuarioAnterior = (string) Str::uuid();
        $usuarioNuevo = (string) Str::uuid();
        $token = 'ExponentPushToken[reused-device-token-123]';

        DevicePushToken::create([
            'user_id' => $usuarioAnterior,
            'token' => $token,
            'platform' => 'ios',
            'device_name' => 'iPhone 15',
            'app_version' => '1.0.0',
            'is_active' => false,
        ]);

        $response = $this->withToken($this->jwtDePrueba($usuarioNuevo))
            ->postJson('/api/v1/push/device-tokens', [
                'token' => $token,
                'platform' => 'ios',
                'device_name' => 'iPhone 15 Pro',
                'app_version' => '1.1.0',
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('device_push_tokens', [
            'user_id' => $usuarioNuevo,
            'token' => $token,
            'device_name' => 'iPhone 15 Pro',
            'is_active' => true,
        ]);

        $this->assertEquals(1, DevicePushToken::where('token', $token)->count());
    }

    public function test_se_puede_desactivar_un_token_push_al_desregistrar(): void
    {
        $userId = (string) Str::uuid();
        $token = 'ExponentPushToken[active-token-to-remove]';

        DevicePushToken::create([
            'user_id' => $userId,
            'token' => $token,
            'platform' => 'android',
            'is_active' => true,
        ]);

        $response = $this->withToken($this->jwtDePrueba($userId))
            ->postJson('/api/v1/push/device-tokens/remove', [
                'token' => $token,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Token de dispositivo desactivado exitosamente.',
            ]);

        $this->assertDatabaseHas('device_push_tokens', [
            'user_id' => $userId,
            'token' => $token,
            'is_active' => false,
        ]);
    }

    public function test_no_se_puede_registrar_token_sin_autenticacion(): void
    {
        $response = $this->postJson('/api/v1/push/device-tokens', [
            'token' => 'ExponentPushToken[no-auth]',
        ]);

        $response->assertStatus(401);
    }

    public function test_valida_campos_obligatorios_al_registrar_token(): void
    {
        $userId = (string) Str::uuid();

        $response = $this->withToken($this->jwtDePrueba($userId))
            ->postJson('/api/v1/push/device-tokens', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['token']);
    }

    public function test_expo_push_service_envia_peticion_correcta_y_marca_inactivo_ante_device_not_registered(): void
    {
        Http::fake([
            'https://exp.host/--/api/v2/push/send' => Http::response([
                'data' => [
                    [
                        'status' => 'ok',
                        'id' => 'ticket-1',
                    ],
                    [
                        'status' => 'error',
                        'message' => 'DeviceNotRegistered',
                        'details' => ['error' => 'DeviceNotRegistered'],
                    ],
                ],
            ], 200),
        ]);

        $userId = (string) Str::uuid();

        $validToken = DevicePushToken::create([
            'user_id' => $userId,
            'token' => 'ExponentPushToken[valid-token]',
            'platform' => 'android',
            'is_active' => true,
        ]);

        $invalidToken = DevicePushToken::create([
            'user_id' => $userId,
            'token' => 'ExponentPushToken[invalid-token]',
            'platform' => 'android',
            'is_active' => true,
        ]);

        $expoService = app(ExpoPushService::class);
        $expoService->sendToUser($userId, 'Tu viaje inició', 'El conductor está en camino', ['trip_id' => '123']);

        Http::assertSent(function ($request) {
            return $request->url() === 'https://exp.host/--/api/v2/push/send' &&
                count($request->data()) === 2 &&
                $request->data()[0]['to'] === 'ExponentPushToken[valid-token]' &&
                $request->data()[0]['title'] === 'Tu viaje inició';
        });

        $this->assertTrue($validToken->fresh()->is_active);
        $this->assertNotNull($validToken->fresh()->last_used_at);
        $this->assertFalse($invalidToken->fresh()->is_active);
    }

    public function test_send_notificacion_invoca_expo_push_al_despachar_desde_servicio(): void
    {
        Http::fake([
            'https://exp.host/--/api/v2/push/send' => Http::response(['data' => [['status' => 'ok']]], 200),
        ]);

        $userId = (string) Str::uuid();

        DevicePushToken::create([
            'user_id' => $userId,
            'token' => 'ExponentPushToken[device-abc]',
            'platform' => 'expo',
            'is_active' => true,
        ]);

        $payload = [
            'user_id' => $userId,
            'title' => 'Conductor llegó',
            'body' => 'Tu conductor ha llegado al punto de encuentro.',
            'type' => Notification::TYPE_CONDUCTOR_EN_CAMINO,
            'payload_json' => ['trip_id' => (string) Str::uuid()],
        ];

        $response = $this->withToken($this->jwtServicioDePrueba())
            ->postJson('/api/v1/notifications/send', $payload);

        $response->assertStatus(201);

        Http::assertSent(function ($request) {
            return $request->url() === 'https://exp.host/--/api/v2/push/send' &&
                $request->data()[0]['to'] === 'ExponentPushToken[device-abc]' &&
                $request->data()[0]['title'] === 'Conductor llegó';
        });
    }
}
