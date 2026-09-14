<?php

namespace Tests\Feature;

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class RouteSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_rutas_de_matching_rechazan_peticiones_sin_token(): void
    {
        $this->postJson('/api/v1/routes', [])->assertStatus(401);
        $this->postJson('/api/v1/routes/search-match', [])->assertStatus(401);
        $this->getJson('/api/v1/routes')->assertStatus(401);
    }

    public function test_no_se_puede_publicar_una_ruta_suplantando_a_otro_conductor(): void
    {
        $conductorReal = (string) Str::uuid();
        $conductorSuplantado = (string) Str::uuid();

        $payload = [
            'driver_id' => $conductorSuplantado, // intento de suplantación, debe ser ignorado
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
            'base_contribution_cop' => 4500,
        ];

        $response = $this->withToken($this->jwtDePrueba($conductorReal))
            ->postJson('/api/v1/routes', $payload);

        $response->assertStatus(201);

        $this->assertDatabaseHas('routes', [
            'origin_name' => 'Cañaveral',
            'driver_id' => $conductorReal,
        ]);
        $this->assertDatabaseMissing('routes', [
            'driver_id' => $conductorSuplantado,
        ]);
    }
}
