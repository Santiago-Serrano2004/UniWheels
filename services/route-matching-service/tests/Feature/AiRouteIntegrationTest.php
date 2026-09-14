<?php

namespace Tests\Feature;

use App\Models\Route;
use App\Services\PostGisSpatialRepository;
use App\Services\SpatialMatchingService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class AiRouteIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected PostGisSpatialRepository $spatialRepo;

    protected SpatialMatchingService $matchingService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->spatialRepo = app(PostGisSpatialRepository::class);
        $this->matchingService = app(SpatialMatchingService::class);
    }

    protected function crearRutaBase(): Route
    {
        $ruta = Route::create([
            'driver_id' => (string) Str::uuid(),
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

        $this->spatialRepo->saveRouteGeometry(
            $ruta->id,
            [[7.0678, -73.1066], [7.0856, -73.1142], [7.1193, -73.1042]],
            [7.0678, -73.1066],
            [7.1193, -73.1042]
        );

        return $ruta;
    }

    public function test_usa_la_evaluacion_de_ai_route_service_cuando_esta_disponible(): void
    {
        Http::fake([
            '*/api/v1/optimize/match' => Http::response([
                'is_viable' => true,
                'detour_minutes' => 8.5,
                'traffic_status' => 'Tráfico moderado (IA)',
                'traffic_multiplier_kappa' => 1.3,
            ], 200),
        ]);

        $ruta = $this->crearRutaBase();
        $evaluacion = $this->matchingService->evaluateRouteDetourForPassenger($ruta, 7.0856, -73.1142);

        $this->assertTrue($evaluacion['is_viable']);
        $this->assertTrue($evaluacion['ai_powered']);
        $this->assertEquals('ai_route_service', $evaluacion['traffic_info']['source']);
        // detour_minutes = 8.5 (IA) - 2.0 (espera abordaje) = 6.5 min de viaje + 2.0 = 8.5 total
        $this->assertEquals(8.5, $evaluacion['detour_minutes']);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), '/api/v1/optimize/match')
                && $request->hasHeader('Authorization');
        });
    }

    public function test_cae_al_calculo_php_local_si_ai_route_service_no_responde(): void
    {
        Http::fake([
            '*/api/v1/optimize/match' => Http::response(null, 500),
        ]);

        $ruta = $this->crearRutaBase();
        $evaluacion = $this->matchingService->evaluateRouteDetourForPassenger($ruta, 7.0856, -73.1142);

        $this->assertArrayNotHasKey('ai_powered', $evaluacion);
        $this->assertNotEquals('ai_route_service', $evaluacion['traffic_info']['source'] ?? null);
    }

    public function test_cae_al_calculo_php_local_si_ai_route_service_esta_caido(): void
    {
        Http::fake([
            '*/api/v1/optimize/match' => function () {
                throw new ConnectionException('Connection refused');
            },
        ]);

        $ruta = $this->crearRutaBase();
        $evaluacion = $this->matchingService->evaluateRouteDetourForPassenger($ruta, 7.0856, -73.1142);

        // No debe propagar la excepción: debe degradar limpiamente al cálculo local.
        $this->assertArrayHasKey('is_viable', $evaluacion);
        $this->assertArrayNotHasKey('ai_powered', $evaluacion);
    }
}
