<?php

namespace Tests\Feature;

use App\Models\Route;
use App\Services\PostGisSpatialRepository;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * SIM-012: no se aceptan rutas con salida pasada y la búsqueda no devuelve
 * rutas pasadas ni llenas.
 */
class PastRoutesTest extends TestCase
{
    use RefreshDatabase;

    private function payload(Carbon $salida): array
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
            'scheduled_departure_time' => $salida->format('Y-m-d\TH:i:sP'),
            'target_arrival_time' => $salida->copy()->addMinutes(45)->format('Y-m-d\TH:i:sP'),
            'available_seats' => 3,
            'base_contribution_cop' => 0,
            'coordinates' => [
                [7.0678, -73.1066], [7.0856, -73.1142], [7.1023, -73.1185], [7.1145, -73.1100], [7.1165, -73.1054],
            ],
        ];
    }

    private function publicar(Carbon $salida)
    {
        $conductor = (string) Str::uuid();
        Http::fake([
            '*/api/v1/vehicles/*/public-summary' => Http::response(['success' => true, 'data' => [
                'vehicle_type' => 'carro', 'status' => 'aprobado', 'owner_id' => $conductor, 'available_seats' => 4,
            ]], 200),
            '*/route/v1/driving/*' => Http::response([], 500),
        ]);

        return $this->withToken($this->jwtDePrueba($conductor))->postJson('/api/v1/routes', $this->payload($salida));
    }

    public function test_publicar_con_salida_en_el_pasado_devuelve_422(): void
    {
        $this->publicar(Carbon::now()->subDays(2))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['scheduled_departure_time'])
            ->assertJsonFragment(['La hora de salida debe ser futura.']);
    }

    public function test_la_comparacion_usa_el_instante_correcto_con_offset(): void
    {
        // Futuro dentro de una hora, escrito con offset -05:00: se acepta.
        $this->publicar(Carbon::now()->addHour()->setTimezone('-05:00'))->assertStatus(201);

        // Pasado hace una hora, escrito con offset +05:00: el reloj parece futuro, el instante no.
        $this->publicar(Carbon::now()->subHour()->setTimezone('+05:00'))->assertStatus(422);
    }

    private function crearRuta(Carbon $salida, int $cupos): Route
    {
        $ruta = Route::create([
            'driver_id' => (string) Str::uuid(),
            'vehicle_id' => (string) Str::uuid(),
            'origin_name' => 'Cañaveral',
            'destination_campus_id' => 1,
            'destination_campus_name' => 'Campus El Jardín',
            'scheduled_departure_time' => $salida,
            'target_arrival_time' => $salida->copy()->addMinutes(45),
            'estimated_duration_minutes' => 20.0,
            'max_detour_minutes' => 15,
            'accumulated_detour_minutes' => 0.0,
            'available_seats' => $cupos,
            'base_contribution_cop' => 4500,
            'status' => 'publicada',
        ]);

        app(PostGisSpatialRepository::class)->saveRouteGeometry(
            $ruta->id,
            [[7.0678, -73.1066], [7.0856, -73.1142], [7.1193, -73.1042]],
            [7.0678, -73.1066],
            [7.1193, -73.1042]
        );

        return $ruta;
    }

    public function test_la_busqueda_no_devuelve_rutas_pasadas_ni_llenas(): void
    {
        Http::fake(['*' => Http::response([], 500)]);

        $futura = $this->crearRuta(Carbon::now()->addHours(2), 3);
        $this->crearRuta(Carbon::now()->subDays(2), 3); // pasada
        $this->crearRuta(Carbon::now()->addHours(3), 0); // llena

        $ids = collect(
            $this->withToken($this->jwtDePrueba((string) Str::uuid()))
                ->postJson('/api/v1/routes/search-match', [
                    'pickup_lat' => 7.0856,
                    'pickup_lng' => -73.1142,
                    'destination_campus_id' => 1,
                ])
                ->assertStatus(200)
                ->json('data')
        )->pluck('route_id')->all();

        $this->assertSame([$futura->id], $ids);
    }
}
