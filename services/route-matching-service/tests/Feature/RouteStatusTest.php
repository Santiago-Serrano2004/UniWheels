<?php

namespace Tests\Feature;

use App\Models\Route;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * El conductor cierra o cancela su ruta: deja de estar disponible para reservas.
 */
class RouteStatusTest extends TestCase
{
    use RefreshDatabase;

    private function crearRuta(string $conductor, string $estado = 'publicada'): Route
    {
        return Route::create([
            'driver_id' => $conductor,
            'vehicle_id' => (string) Str::uuid(),
            'origin_name' => 'Cañaveral',
            'destination_campus_id' => 1,
            'destination_campus_name' => 'Campus El Jardín',
            'scheduled_departure_time' => Carbon::tomorrow()->setHour(6),
            'target_arrival_time' => Carbon::tomorrow()->setHour(7),
            'estimated_duration_minutes' => 25.0,
            'max_detour_minutes' => 15,
            'accumulated_detour_minutes' => 0.0,
            'available_seats' => 3,
            'base_contribution_cop' => 4500,
            'status' => $estado,
        ]);
    }

    private function cambiar(string $conductor, Route $ruta, string $estado)
    {
        return $this->withToken($this->jwtDePrueba($conductor))
            ->postJson("/api/v1/routes/{$ruta->id}/status", ['status' => $estado]);
    }

    public function test_el_conductor_inicia_y_finaliza_su_ruta(): void
    {
        $conductor = (string) Str::uuid();
        $ruta = $this->crearRuta($conductor);

        $this->cambiar($conductor, $ruta, 'en_curso')->assertOk()->assertJsonPath('data.status', 'en_curso');
        $this->cambiar($conductor, $ruta, 'finalizada')->assertOk();

        $this->assertSame('finalizada', $ruta->fresh()->status);
    }

    public function test_puede_finalizar_directo_desde_publicada(): void
    {
        $conductor = (string) Str::uuid();
        $ruta = $this->crearRuta($conductor);

        $this->cambiar($conductor, $ruta, 'finalizada')->assertOk();
    }

    public function test_una_ruta_finalizada_no_se_puede_reabrir_ni_cancelar(): void
    {
        $conductor = (string) Str::uuid();
        $ruta = $this->crearRuta($conductor, 'finalizada');

        $this->cambiar($conductor, $ruta, 'cancelada')->assertStatus(409);
        $this->cambiar($conductor, $ruta, 'en_curso')->assertStatus(409);
    }

    public function test_otro_conductor_recibe_404(): void
    {
        $ruta = $this->crearRuta((string) Str::uuid());

        $this->cambiar((string) Str::uuid(), $ruta, 'cancelada')->assertNotFound();
        $this->assertSame('publicada', $ruta->fresh()->status);
    }

    public function test_estado_invalido_devuelve_422(): void
    {
        $conductor = (string) Str::uuid();
        $ruta = $this->crearRuta($conductor);

        $this->cambiar($conductor, $ruta, 'publicada')->assertStatus(422);
    }

    public function test_repetir_el_mismo_estado_es_idempotente(): void
    {
        $conductor = (string) Str::uuid();
        $ruta = $this->crearRuta($conductor, 'cancelada');

        $this->cambiar($conductor, $ruta, 'cancelada')->assertOk();
    }
}
