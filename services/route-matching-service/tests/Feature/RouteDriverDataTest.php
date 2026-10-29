<?php

namespace Tests\Feature;

use App\Models\Route;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * SIM-016: el listado y el detalle de rutas muestran el conductor y el vehículo reales
 * (auth-service / vehicle-service) o null; nunca valores inventados.
 */
class RouteDriverDataTest extends TestCase
{
    use RefreshDatabase;

    private function crearRuta(): Route
    {
        return Route::create([
            'driver_id' => (string) Str::uuid(),
            'vehicle_id' => (string) Str::uuid(),
            'origin_name' => 'Cañaveral',
            'destination_campus_id' => 1,
            'destination_campus_name' => 'Campus El Jardín',
            'scheduled_departure_time' => Carbon::tomorrow()->setHour(7),
            'target_arrival_time' => Carbon::tomorrow()->setHour(8),
            'estimated_duration_minutes' => 25.0,
            'max_detour_minutes' => 15,
            'accumulated_detour_minutes' => 0.0,
            'available_seats' => 3,
            'base_contribution_cop' => 4500,
            'status' => 'publicada',
        ]);
    }

    public function test_el_listado_usa_los_datos_reales_del_conductor_y_el_vehiculo(): void
    {
        $this->crearRuta();
        Http::fake([
            '*/api/v1/users/*/public-profile' => Http::response(['success' => true, 'data' => [
                'name' => 'María Real', 'avatar_initials' => 'MR', 'rating' => 4.2,
            ]], 200),
            '*/api/v1/vehicles/*/public-summary' => Http::response(['success' => true, 'data' => [
                'plate_number' => 'ABC123', 'brand' => 'Kia', 'model_line' => 'Rio', 'color' => 'Negro', 'vehicle_type' => 'carro',
            ]], 200),
        ]);

        $this->withToken($this->jwtDePrueba((string) Str::uuid()))
            ->getJson('/api/v1/routes')
            ->assertOk()
            ->assertJsonPath('data.0.driver_name', 'María Real')
            ->assertJsonPath('data.0.plate', 'ABC123')
            ->assertJsonPath('data.0.vehicle', 'Kia Rio (Negro)')
            ->assertJsonPath('data.0.rating', 4.2);
    }

    public function test_si_los_servicios_no_responden_el_listado_devuelve_null_y_no_datos_inventados(): void
    {
        $this->crearRuta();
        Http::fake(['*' => Http::response([], 500)]);

        $respuesta = $this->withToken($this->jwtDePrueba((string) Str::uuid()))
            ->getJson('/api/v1/routes')
            ->assertOk()
            ->assertJsonPath('data.0.driver_name', null)
            ->assertJsonPath('data.0.plate', null)
            ->assertJsonPath('data.0.vehicle', null)
            ->assertJsonPath('data.0.rating', null);

        $this->assertStringNotContainsString('Carlos Mendoza', $respuesta->getContent());
        $this->assertStringNotContainsString('KLU-492', $respuesta->getContent());
    }

    public function test_el_detalle_de_la_ruta_trae_conductor_y_vehiculo_reales(): void
    {
        $ruta = $this->crearRuta();
        Http::fake([
            '*/api/v1/users/*/public-profile' => Http::response(['success' => true, 'data' => ['name' => 'María Real']], 200),
            '*/api/v1/vehicles/*/public-summary' => Http::response(['success' => true, 'data' => [
                'plate_number' => 'ABC123', 'brand' => 'Kia', 'model_line' => 'Rio', 'color' => null, 'vehicle_type' => 'carro',
            ]], 200),
        ]);

        $this->withToken($this->jwtDePrueba((string) Str::uuid()))
            ->getJson("/api/v1/routes/{$ruta->id}")
            ->assertOk()
            ->assertJsonPath('data.vehicle_id', $ruta->vehicle_id)
            ->assertJsonPath('data.driver_name', 'María Real')
            ->assertJsonPath('data.vehicle_plate', 'ABC123')
            ->assertJsonPath('data.vehicle_model', 'Kia Rio');
    }
}
