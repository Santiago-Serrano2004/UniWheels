<?php

namespace Tests\Feature;

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * SIM-005: una hora con offset -05:00 se guarda en UTC y se muestra en hora de Bogotá
 * en formato de 12 horas.
 */
class TimezoneTest extends TestCase
{
    use RefreshDatabase;

    public function test_publicar_con_offset_guarda_utc_y_la_busqueda_muestra_hora_de_bogota(): void
    {
        $this->assertSame('UTC', config('app.timezone'));

        $conductor = (string) Str::uuid();
        Http::fake([
            '*/api/v1/vehicles/*/public-summary' => Http::response(['success' => true, 'data' => [
                'vehicle_type' => 'carro', 'status' => 'aprobado', 'owner_id' => $conductor, 'available_seats' => 4,
            ]], 200),
            '*/route/v1/driving/*' => Http::response([], 500),
        ]);

        $salida = Carbon::tomorrow('America/Bogota')->setTime(7, 0);
        $llegada = Carbon::tomorrow('America/Bogota')->setTime(7, 45);

        $respuesta = $this->withToken($this->jwtDePrueba($conductor))->postJson('/api/v1/routes', [
            'vehicle_id' => (string) Str::uuid(),
            'origin_name' => 'Cañaveral',
            'origin_lat' => 7.0678,
            'origin_lng' => -73.1066,
            'destination_campus_id' => 1,
            'destination_campus_name' => 'Campus El Jardín',
            'destination_lat' => 7.1165,
            'destination_lng' => -73.1054,
            'scheduled_departure_time' => $salida->format('Y-m-d\TH:i:sP'), // ...T07:00:00-05:00
            'target_arrival_time' => $llegada->format('Y-m-d\TH:i:sP'),
            'available_seats' => 3,
            'base_contribution_cop' => 0,
            'coordinates' => [
                [7.0678, -73.1066], [7.0856, -73.1142], [7.1023, -73.1185], [7.1145, -73.1100], [7.1165, -73.1054],
            ],
        ]);

        $respuesta->assertStatus(201);

        $esperadoUtc = $salida->copy()->utc();
        $this->assertSame('12:00:00', $esperadoUtc->format('H:i:s'));
        $this->assertSame(
            $esperadoUtc->format('Y-m-d H:i:s'),
            substr((string) DB::table('routes')->value('scheduled_departure_time'), 0, 19)
        );
        $this->assertSame($esperadoUtc->format('Y-m-d\TH:i:s').'.000000Z', $respuesta->json('data.scheduled_departure_time'));

        $this->withToken($this->jwtDePrueba((string) Str::uuid()))
            ->postJson('/api/v1/routes/search-match', [
                'pickup_lat' => 7.0856,
                'pickup_lng' => -73.1142,
                'destination_campus_id' => 1,
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.0.scheduled_departure_time', '07:00 AM');
    }
}
