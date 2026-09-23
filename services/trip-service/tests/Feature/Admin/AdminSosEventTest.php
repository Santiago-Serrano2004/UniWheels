<?php

namespace Tests\Feature\Admin;

use App\Models\Trip;
use App\Models\TripSosEvent;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminSosEventTest extends TestCase
{
    use RefreshDatabase;

    protected function crearViajeEnCamino(string $driverId, string $passengerId, array $attributes = []): Trip
    {
        return Trip::create(array_merge([
            'route_id' => (string) Str::uuid(),
            'driver_id' => $driverId,
            'passenger_id' => $passengerId,
            'driver_name' => 'Conductor Prueba',
            'passenger_name' => 'Pasajero Prueba',
            'vehicle_plate' => 'SOS123',
            'vehicle_model' => 'Chevrolet Spark',
            'pickup_address' => 'UNAB Campus Central',
            'dropoff_address' => 'Cabecera',
            'boarding_pin' => '1234',
            'is_pin_verified' => false,
            'total_fare_cop' => 8000,
            'driver_amount_cop' => 7040,
            'platform_commission_cop' => 960,
            'commission_status' => 'pendiente_debito',
            'status' => Trip::STATUS_EN_CAMINO,
            'payment_method' => Trip::PAYMENT_METHOD_EFECTIVO,
            'scheduled_pickup_time' => Carbon::tomorrow()->setHour(7)->setMinute(0),
        ], $attributes));
    }

    public function test_rutas_de_admin_sos_requieren_rol_administrador(): void
    {
        $userId = (string) Str::uuid();

        // Sin token -> 401
        $this->getJson('/api/v1/admin/sos-events')->assertStatus(401);

        // Con rol pasajero -> 403
        $this->withToken($this->jwtDePrueba($userId, ['estudiante']))
            ->getJson('/api/v1/admin/sos-events')
            ->assertStatus(403);
    }

    public function test_un_administrador_puede_listar_eventos_sos_filtrados_por_estado(): void
    {
        $adminId = (string) Str::uuid();
        $driverId = (string) Str::uuid();
        $passengerId = (string) Str::uuid();

        $trip = $this->crearViajeEnCamino($driverId, $passengerId);

        // Evento 1: Pendiente
        $eventoPendiente = TripSosEvent::create([
            'trip_id' => $trip->id,
            'triggered_by_user_id' => $passengerId,
            'latitude' => 7.119349,
            'longitude' => -73.122741,
            'emergency_type' => 'panico_usuario',
            'triggered_at' => now()->subMinutes(10),
        ]);

        // Evento 2: Atendido
        $eventoAtendido = TripSosEvent::create([
            'trip_id' => $trip->id,
            'triggered_by_user_id' => $driverId,
            'latitude' => 7.119500,
            'longitude' => -73.122900,
            'emergency_type' => 'panico_usuario',
            'triggered_at' => now()->subMinutes(30),
            'attended_at' => now()->subMinutes(5),
            'attended_by_user_id' => $adminId,
            'attention_notes' => 'Llamada efectuada con éxito. Falsa alarma.',
        ]);

        $tokenAdmin = $this->jwtDePrueba($adminId, ['administrador']);

        // Consultar pendientes
        $respPending = $this->withToken($tokenAdmin)
            ->getJson('/api/v1/admin/sos-events?status=pending');

        $respPending->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $eventoPendiente->id)
            ->assertJsonPath('data.0.is_attended', false)
            ->assertJsonPath('data.0.trip.vehicle_plate', 'SOS123')
            ->assertJsonPath('data.0.trip.driver_name', 'Conductor Prueba');

        // Consultar atendidos
        $respAttended = $this->withToken($tokenAdmin)
            ->getJson('/api/v1/admin/sos-events?status=attended');

        $respAttended->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $eventoAtendido->id)
            ->assertJsonPath('data.0.is_attended', true)
            ->assertJsonPath('data.0.attention_notes', 'Llamada efectuada con éxito. Falsa alarma.');
    }

    public function test_un_administrador_puede_atender_una_alerta_sos_con_notas(): void
    {
        $adminId = (string) Str::uuid();
        $driverId = (string) Str::uuid();
        $passengerId = (string) Str::uuid();

        $trip = $this->crearViajeEnCamino($driverId, $passengerId);

        $evento = TripSosEvent::create([
            'trip_id' => $trip->id,
            'triggered_by_user_id' => $passengerId,
            'latitude' => 7.119349,
            'longitude' => -73.122741,
            'emergency_type' => 'panico_usuario',
            'triggered_at' => now(),
        ]);

        $tokenAdmin = $this->jwtDePrueba($adminId, ['administrador']);

        $response = $this->withToken($tokenAdmin)
            ->patchJson("/api/v1/admin/sos-events/{$evento->id}/attend", [
                'notes' => 'Se contactó a cuadrante de policía local y a seguridad universitaria.',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $evento->id,
                    'is_attended' => true,
                    'attended_by_user_id' => $adminId,
                    'attention_notes' => 'Se contactó a cuadrante de policía local y a seguridad universitaria.',
                ],
            ]);

        $eventoActualizado = $evento->fresh();
        $this->assertNotNull($eventoActualizado->attended_at);
        $this->assertEquals($adminId, $eventoActualizado->attended_by_user_id);
        $this->assertEquals('Se contactó a cuadrante de policía local y a seguridad universitaria.', $eventoActualizado->attention_notes);
    }
}
