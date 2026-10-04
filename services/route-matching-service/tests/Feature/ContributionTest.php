<?php

namespace Tests\Feature;

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class ContributionTest extends TestCase
{
    use RefreshDatabase;

    // OSRM simulado a 8.400 m → carro: 2000 + 8,4 × 400 = 5360 → $ 5.400.
    private function fakeServicios(?string $tipoVehiculo = 'carro', bool $vehicleServiceCaido = false): void
    {
        Http::fake([
            '*/api/v1/vehicles/*/public-summary' => $vehicleServiceCaido
                ? Http::response([], 500)
                : Http::response(['success' => true, 'data' => ['vehicle_type' => $tipoVehiculo]], 200),
            '*/route/v1/driving/*' => Http::response([
                'code' => 'Ok',
                'routes' => [[
                    'distance' => 8400,
                    'duration' => 900,
                    'geometry' => ['coordinates' => [[-73.1066, 7.0678], [-73.1054, 7.1165]]],
                ]],
            ], 200),
        ]);
    }

    private function query(string $vehicleId): string
    {
        return http_build_query([
            'vehicle_id' => $vehicleId,
            'origin_lat' => 7.0678,
            'origin_lng' => -73.1066,
            'destination_lat' => 7.1165,
            'destination_lng' => -73.1054,
        ]);
    }

    private function payload(int $aporte): array
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
            'available_seats' => 3,
            'base_contribution_cop' => $aporte,
        ];
    }

    public function test_la_sugerencia_devuelve_distancia_tipo_y_tope(): void
    {
        $this->fakeServicios('carro');

        $this->withToken($this->jwtDePrueba((string) Str::uuid()))
            ->getJson('/api/v1/routes/contribution-suggestion?'.$this->query((string) Str::uuid()))
            ->assertStatus(200)
            ->assertJson(['success' => true, 'data' => [
                'distance_km' => 8.4,
                'vehicle_type' => 'carro',
                'suggested_contribution_cop' => 5400,
                'max_contribution_cop' => 5400,
            ]]);
    }

    public function test_la_sugerencia_responde_503_si_vehicle_service_esta_caido(): void
    {
        $this->fakeServicios(vehicleServiceCaido: true);

        $this->withToken($this->jwtDePrueba((string) Str::uuid()))
            ->getJson('/api/v1/routes/contribution-suggestion?'.$this->query((string) Str::uuid()))
            ->assertStatus(503)
            ->assertJsonPath('message', 'No fue posible validar el vehículo. Intenta nuevamente.');
    }

    public function test_publicar_con_aporte_mayor_al_sugerido_devuelve_422(): void
    {
        $this->fakeServicios('carro');

        $this->withToken($this->jwtDePrueba((string) Str::uuid()))
            ->postJson('/api/v1/routes', $this->payload(5500))
            ->assertStatus(422)
            ->assertJsonPath('errors.base_contribution_cop.0', 'El aporte máximo para esta ruta es de $ 5.400 COP.')
            ->assertJsonPath('data.max_contribution_cop', 5400);

        $this->assertDatabaseCount('routes', 0);
    }

    public function test_publicar_con_aporte_cero_devuelve_201(): void
    {
        $this->fakeServicios('carro');

        $this->withToken($this->jwtDePrueba((string) Str::uuid()))
            ->postJson('/api/v1/routes', $this->payload(0))
            ->assertStatus(201)
            ->assertJsonPath('data.base_contribution_cop', 0);
    }

    public function test_publicar_con_aporte_igual_al_sugerido_guarda_distancia_y_sugerido(): void
    {
        $this->fakeServicios('carro');

        $this->withToken($this->jwtDePrueba((string) Str::uuid()))
            ->postJson('/api/v1/routes', $this->payload(5400))
            ->assertStatus(201)
            ->assertJsonPath('data.suggested_contribution_cop', 5400)
            ->assertJsonPath('data.distance_km', 8.4);

        $this->assertDatabaseHas('routes', [
            'base_contribution_cop' => 5400,
            'distance_km' => 8.4,
            'suggested_contribution_cop' => 5400,
        ]);
    }

    public function test_publicar_responde_503_si_no_se_puede_validar_el_vehiculo(): void
    {
        $this->fakeServicios(vehicleServiceCaido: true);

        $this->withToken($this->jwtDePrueba((string) Str::uuid()))
            ->postJson('/api/v1/routes', $this->payload(1000))
            ->assertStatus(503);

        $this->assertDatabaseCount('routes', 0);
    }
}
