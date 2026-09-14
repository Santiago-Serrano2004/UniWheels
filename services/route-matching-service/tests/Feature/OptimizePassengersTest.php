<?php

namespace Tests\Feature;

use App\Models\Route;
use App\Services\PostGisSpatialRepository;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class OptimizePassengersTest extends TestCase
{
    use RefreshDatabase;

    protected function crearRutaBase(string $driverId): Route
    {
        $ruta = Route::create([
            'driver_id' => $driverId,
            'vehicle_id' => (string) Str::uuid(),
            'origin_name' => 'Cañaveral',
            'destination_campus_id' => 1,
            'destination_campus_name' => 'Campus El Jardín',
            'scheduled_departure_time' => Carbon::tomorrow()->setHour(6)->setMinute(45),
            'target_arrival_time' => Carbon::tomorrow()->setHour(7)->setMinute(30),
            'estimated_duration_minutes' => 20.0,
            'max_detour_minutes' => 15,
            'accumulated_detour_minutes' => 0.0,
            'available_seats' => 3,
            'base_contribution_cop' => 4500,
            'status' => 'publicada',
        ]);

        app(PostGisSpatialRepository::class)->saveRouteGeometry(
            $ruta->id,
            [[7.0678, -73.1066], [7.1193, -73.1042]],
            [7.0678, -73.1066],
            [7.1193, -73.1042]
        );

        return $ruta;
    }

    public function test_solo_el_conductor_dueno_puede_optimizar_pasajeros(): void
    {
        $conductor = (string) Str::uuid();
        $otro = (string) Str::uuid();
        $ruta = $this->crearRutaBase($conductor);

        $this->withToken($this->jwtDePrueba($otro))
            ->postJson("/api/v1/routes/{$ruta->id}/optimize-passengers", [
                'passengers' => [
                    ['id' => 'p1', 'name' => 'Ana', 'pickup_lat' => 7.08, 'pickup_lng' => -73.11],
                    ['id' => 'p2', 'name' => 'Luis', 'pickup_lat' => 7.09, 'pickup_lng' => -73.10],
                ],
            ])
            ->assertStatus(403);
    }

    public function test_usa_ai_route_service_para_ordenar_multiples_pasajeros(): void
    {
        Http::fake([
            '*/api/v1/optimize/multi-passenger-alns' => Http::response([
                'success' => true,
                'accepted_passengers' => ['p1', 'p2'],
                'rejected_passengers' => [],
                'ordered_stops' => [
                    ['stop_index' => 0, 'type' => 'pickup', 'user_id' => 'p2'],
                    ['stop_index' => 1, 'type' => 'pickup', 'user_id' => 'p1'],
                ],
                'total_distance_km' => 5.2,
                'total_duration_minutes' => 18.0,
                'total_detour_minutes' => 6.0,
                'co2_reduction_kg' => 1.2,
                'alns_cost_score' => 0.9,
                'route_polyline' => [],
                'fare_breakdown' => [],
            ], 200),
        ]);

        $conductor = (string) Str::uuid();
        $ruta = $this->crearRutaBase($conductor);

        $response = $this->withToken($this->jwtDePrueba($conductor))
            ->postJson("/api/v1/routes/{$ruta->id}/optimize-passengers", [
                'passengers' => [
                    ['id' => 'p1', 'name' => 'Ana', 'pickup_lat' => 7.08, 'pickup_lng' => -73.11],
                    ['id' => 'p2', 'name' => 'Luis', 'pickup_lat' => 7.09, 'pickup_lng' => -73.10],
                ],
            ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true, 'ai_powered' => true])
            ->assertJsonPath('data.ordered_stops.0.user_id', 'p2');
    }

    public function test_degrada_al_orden_original_si_ai_route_service_no_responde(): void
    {
        Http::fake([
            '*/api/v1/optimize/multi-passenger-alns' => Http::response(null, 500),
        ]);

        $conductor = (string) Str::uuid();
        $ruta = $this->crearRutaBase($conductor);

        $response = $this->withToken($this->jwtDePrueba($conductor))
            ->postJson("/api/v1/routes/{$ruta->id}/optimize-passengers", [
                'passengers' => [
                    ['id' => 'p1', 'name' => 'Ana', 'pickup_lat' => 7.08, 'pickup_lng' => -73.11],
                    ['id' => 'p2', 'name' => 'Luis', 'pickup_lat' => 7.09, 'pickup_lng' => -73.10],
                ],
            ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true, 'ai_powered' => false]);
    }
}
