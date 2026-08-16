<?php

namespace Tests\Feature;

use App\Models\Notification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_se_puede_despachar_una_notificacion_asincrona(): void
    {
        $userId = (string) Str::uuid();

        $payload = [
            'user_id' => $userId,
            'title' => '¡Nuevo pasajero asignado!',
            'body' => 'Santiago Garcia ha reservado un cupo para abordar en Parque San Pío.',
            'type' => Notification::TYPE_VIAJE_RESERVADO,
            'payload_json' => [
                'trip_id' => (string) Str::uuid(),
                'pickup' => 'Parque San Pío',
            ],
        ];

        $response = $this->postJson('/api/v1/notifications/send', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Notificación despachada y registrada exitosamente.',
            ])
            ->assertJsonPath('data.title', '¡Nuevo pasajero asignado!')
            ->assertJsonPath('data.is_read', false);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $userId,
            'title' => '¡Nuevo pasajero asignado!',
            'is_read' => false,
        ]);
    }

    public function test_se_pueden_listar_las_notificaciones_del_usuario(): void
    {
        $userId = (string) Str::uuid();

        Notification::create([
            'user_id' => $userId,
            'title' => 'Conductor en camino',
            'body' => 'Carlos Mendoza inició el recorrido hacia tu punto de recogida.',
            'type' => Notification::TYPE_CONDUCTOR_EN_CAMINO,
            'is_read' => false,
        ]);

        Notification::create([
            'user_id' => $userId,
            'title' => 'PIN Verificado',
            'body' => 'PIN 4829 verificado exitosamente. ¡Buen viaje!',
            'type' => Notification::TYPE_ABORDAJE_PIN,
            'is_read' => true,
            'read_at' => now(),
        ]);

        $response = $this->getJson("/api/v1/users/{$userId}/notifications");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'unread_count' => 1,
            ])
            ->assertJsonCount(2, 'data');
    }

    public function test_obtiene_el_conteo_exacto_de_no_leidas(): void
    {
        $userId = (string) Str::uuid();

        Notification::create([
            'user_id' => $userId,
            'title' => 'Alerta 1',
            'body' => 'Mensaje 1',
            'type' => Notification::TYPE_SEGURIDAD,
            'is_read' => false,
        ]);

        Notification::create([
            'user_id' => $userId,
            'title' => 'Alerta 2',
            'body' => 'Mensaje 2',
            'type' => Notification::TYPE_SEGURIDAD,
            'is_read' => false,
        ]);

        $response = $this->getJson("/api/v1/users/{$userId}/notifications/unread-count");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'unread_count' => 2,
            ]);
    }

    public function test_marca_una_notificacion_como_leida(): void
    {
        $notif = Notification::create([
            'user_id' => (string) Str::uuid(),
            'title' => 'Viaje Finalizado',
            'body' => 'Has llegado al Campus El Jardín. Por favor califica tu experiencia.',
            'type' => Notification::TYPE_VIAJE_FINALIZADO,
            'is_read' => false,
        ]);

        $response = $this->postJson("/api/v1/notifications/{$notif->id}/read");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Notificación marcada como leída.',
            ])
            ->assertJsonPath('data.is_read', true);

        $this->assertDatabaseHas('notifications', [
            'id' => $notif->id,
            'is_read' => true,
        ]);
    }

    public function test_marca_todas_las_notificaciones_como_leidas(): void
    {
        $userId = (string) Str::uuid();

        Notification::create([
            'user_id' => $userId,
            'title' => 'Alerta 1',
            'body' => 'Cuerpo 1',
            'type' => Notification::TYPE_SEGURIDAD,
            'is_read' => false,
        ]);

        Notification::create([
            'user_id' => $userId,
            'title' => 'Alerta 2',
            'body' => 'Cuerpo 2',
            'type' => Notification::TYPE_SEGURIDAD,
            'is_read' => false,
        ]);

        $response = $this->postJson("/api/v1/users/{$userId}/notifications/mark-all-read");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Todas las notificaciones han sido marcadas como leídas.',
            ]);

        $this->assertEquals(0, Notification::forUser($userId)->unread()->count());
    }

    public function test_valida_campos_obligatorios_al_despachar(): void
    {
        $response = $this->postJson('/api/v1/notifications/send', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['user_id', 'title', 'body', 'type']);
    }
}
