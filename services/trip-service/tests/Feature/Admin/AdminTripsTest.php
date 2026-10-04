<?php

namespace Tests\Feature\Admin;

use App\Models\Trip;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminTripsTest extends TestCase
{
    use RefreshDatabase;

    protected function crearViaje(array $attributes = []): Trip
    {
        return Trip::create(array_merge([
            'route_id' => (string) Str::uuid(),
            'driver_id' => (string) Str::uuid(),
            'passenger_id' => (string) Str::uuid(),
            'driver_name' => 'Conductor Prueba',
            'passenger_name' => 'Pasajero Prueba',
            'vehicle_plate' => 'KLU492',
            'vehicle_model' => 'Mazda 3',
            'pickup_address' => 'UNAB Central',
            'dropoff_address' => 'Cabecera',
            'boarding_pin' => '1234',
            'is_pin_verified' => true,
            'total_fare_cop' => 10000,
            'status' => Trip::STATUS_COMPLETADO,
            'scheduled_pickup_time' => Carbon::now()->subHours(2),
            'actual_pickup_time' => Carbon::now()->subHours(2),
            'actual_dropoff_time' => Carbon::now()->subHours(1),
        ], $attributes));
    }

    public function test_rutas_de_viajes_requieren_rol_administrador(): void
    {
        $userId = (string) Str::uuid();

        $this->getJson('/api/v1/admin/trips')->assertStatus(401);

        $tokenUsuario = $this->jwtDePrueba($userId, ['estudiante']);

        $this->withToken($tokenUsuario)
            ->getJson('/api/v1/admin/trips')
            ->assertStatus(403);
    }

    public function test_un_administrador_puede_listar_viajes_con_filtros(): void
    {
        $adminId = (string) Str::uuid();
        $tokenAdmin = $this->jwtDePrueba($adminId, ['administrador']);

        $v1 = $this->crearViaje([
            'status' => Trip::STATUS_COMPLETADO,
            'created_at' => Carbon::now()->subDays(2),
        ]);

        $v2 = $this->crearViaje([
            'status' => Trip::STATUS_CANCELADO_CONDUCTOR,
            'created_at' => Carbon::now()->subDays(10),
        ]);

        $response = $this->withToken($tokenAdmin)
            ->getJson('/api/v1/admin/trips?status=completado');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $v1->id)
            ->assertJsonPath('data.0.status', 'completado');
    }
}
