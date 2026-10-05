<?php

namespace Tests\Feature;

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * SIM-002 / SIM-018: solo se publica con un vehículo propio y aprobado, y los cupos
 * de la ruta no superan los del vehículo.
 */
class VehicleOwnershipTest extends TestCase
{
    use RefreshDatabase;

    private function fakeVehiculo(string $ownerId, string $status = 'aprobado', string $tipo = 'carro', int $cupos = 4): void
    {
        Http::fake([
            '*/api/v1/vehicles/*/public-summary' => Http::response(['success' => true, 'data' => [
                'vehicle_type' => $tipo,
                'status' => $status,
                'owner_id' => $ownerId,
                'available_seats' => $cupos,
            ]], 200),
            '*/route/v1/driving/*' => Http::response([], 500),
        ]);
    }

    private function payload(int $cupos = 3): array
    {
        return [
            'vehicle_id' => (string) Str::uuid(),
            'origin_name' => 'Cañaveral',
            'origin_lat' => 7.0678,
            'origin_lng' => -73.1066,
            'destination_campus_id' => 1,
            'destination_campus_name' => 'Campus El Jardín',
            'destination_lat' => 7.1165,
            'destination_lng' => -73.1054,
            'scheduled_departure_time' => Carbon::tomorrow()->setHour(6)->setMinute(45)->toISOString(),
            'target_arrival_time' => Carbon::tomorrow()->setHour(7)->setMinute(30)->toISOString(),
            'available_seats' => $cupos,
            'base_contribution_cop' => 0,
        ];
    }

    public function test_no_se_publica_con_el_vehiculo_de_otro_conductor(): void
    {
        $this->fakeVehiculo((string) Str::uuid());

        $this->withToken($this->jwtDePrueba((string) Str::uuid()))
            ->postJson('/api/v1/routes', $this->payload())
            ->assertStatus(422)
            ->assertJsonPath('message', 'Necesitas un vehículo propio aprobado para publicar rutas.');

        $this->assertDatabaseCount('routes', 0);
    }

    public function test_no_se_publica_con_un_vehiculo_pendiente_de_aprobacion(): void
    {
        $conductor = (string) Str::uuid();
        $this->fakeVehiculo($conductor, 'pendiente_revision');

        $this->withToken($this->jwtDePrueba($conductor))
            ->postJson('/api/v1/routes', $this->payload())
            ->assertStatus(422)
            ->assertJsonPath('message', 'Necesitas un vehículo propio aprobado para publicar rutas.');

        $this->assertDatabaseCount('routes', 0);
    }

    public function test_los_cupos_no_pueden_superar_los_del_vehiculo(): void
    {
        $conductor = (string) Str::uuid();
        $this->fakeVehiculo($conductor, 'aprobado', 'carro', 4);

        $this->withToken($this->jwtDePrueba($conductor))
            ->postJson('/api/v1/routes', $this->payload(6))
            ->assertStatus(422)
            ->assertJsonPath('data.max_available_seats', 4);
    }

    public function test_una_moto_siempre_admite_un_solo_cupo(): void
    {
        $conductor = (string) Str::uuid();
        $this->fakeVehiculo($conductor, 'aprobado', 'moto', 3);

        $this->withToken($this->jwtDePrueba($conductor))
            ->postJson('/api/v1/routes', $this->payload(3))
            ->assertStatus(422)
            ->assertJsonPath('data.max_available_seats', 1);

        $this->withToken($this->jwtDePrueba($conductor))
            ->postJson('/api/v1/routes', $this->payload(1))
            ->assertStatus(201);
    }

    public function test_la_sugerencia_de_aporte_valida_dueno_y_aprobacion(): void
    {
        $query = http_build_query([
            'vehicle_id' => (string) Str::uuid(),
            'origin_lat' => 7.0678,
            'origin_lng' => -73.1066,
            'destination_lat' => 7.1165,
            'destination_lng' => -73.1054,
        ]);

        $this->fakeVehiculo((string) Str::uuid());
        $this->withToken($this->jwtDePrueba((string) Str::uuid()))
            ->getJson('/api/v1/routes/contribution-suggestion?'.$query)
            ->assertStatus(422);

        $conductor = (string) Str::uuid();
        $this->fakeVehiculo($conductor, 'pendiente_revision');
        $this->withToken($this->jwtDePrueba($conductor))
            ->getJson('/api/v1/routes/contribution-suggestion?'.$query)
            ->assertStatus(422);

        $this->fakeVehiculo($conductor);
        $this->withToken($this->jwtDePrueba($conductor))
            ->getJson('/api/v1/routes/contribution-suggestion?'.$query)
            ->assertStatus(200);
    }
}
