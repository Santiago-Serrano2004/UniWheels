<?php

namespace Tests\Feature;

use App\Models\Route;
use App\Services\PostGisSpatialRepository;
use Carbon\Carbon;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * SIM-001: route-matching es la dueña de routes.available_seats y lo descuenta de
 * forma atómica; trip-service solo llama a reserve-seat / release-seat.
 */
class RouteSeatTest extends TestCase
{
    use RefreshDatabase;

    private function tokenDeServicio(): string
    {
        $ahora = time();

        return JWT::encode([
            'iss' => 'uniwheels-trip-service',
            'sub' => 'trip-service',
            'type' => 'service',
            'jti' => (string) Str::uuid(),
            'iat' => $ahora,
            'exp' => $ahora + 60,
        ], config('jwt.secret'), config('jwt.algo'));
    }

    private function crearRuta(int $cupos, bool $conGeometria = false): Route
    {
        $ruta = Route::create([
            'driver_id' => (string) Str::uuid(),
            'vehicle_id' => (string) Str::uuid(),
            'origin_name' => 'Cañaveral',
            'destination_campus_id' => 1,
            'destination_campus_name' => 'Campus El Jardín',
            'scheduled_departure_time' => Carbon::tomorrow()->setHour(6)->setMinute(45),
            'target_arrival_time' => Carbon::tomorrow()->setHour(7)->setMinute(30),
            'estimated_duration_minutes' => 25.0,
            'max_detour_minutes' => 15,
            'accumulated_detour_minutes' => 0.0,
            'available_seats' => $cupos,
            'base_contribution_cop' => 4500,
            'status' => 'publicada',
        ]);

        if ($conGeometria) {
            app(PostGisSpatialRepository::class)->saveRouteGeometry(
                $ruta->id,
                [[7.0678, -73.1066], [7.0856, -73.1142], [7.1023, -73.1185], [7.1145, -73.1100], [7.1165, -73.1054]],
                [7.0678, -73.1066],
                [7.1165, -73.1054]
            );
        }

        return $ruta;
    }

    public function test_cuatro_reservas_sobre_tres_cupos_dan_tres_200_y_un_409(): void
    {
        $ruta = $this->crearRuta(3);
        $token = $this->tokenDeServicio();

        $codigos = [];
        for ($i = 0; $i < 4; $i++) {
            $codigos[] = $this->withToken($token)
                ->postJson("/api/v1/internal/routes/{$ruta->id}/reserve-seat")
                ->getStatusCode();
        }

        $this->assertSame([200, 200, 200, 409], $codigos);
        $this->assertSame(0, $ruta->fresh()->available_seats);

        $this->withToken($token)
            ->postJson("/api/v1/internal/routes/{$ruta->id}/reserve-seat")
            ->assertStatus(409)
            ->assertJsonPath('message', 'La ruta ya no tiene cupos disponibles.');
    }

    public function test_reservar_devuelve_los_cupos_restantes(): void
    {
        $ruta = $this->crearRuta(3);

        $this->withToken($this->tokenDeServicio())
            ->postJson("/api/v1/internal/routes/{$ruta->id}/reserve-seat")
            ->assertStatus(200)
            ->assertJsonPath('data.available_seats', 2);
    }

    public function test_liberar_devuelve_el_cupo_sin_pasar_la_capacidad_publicada(): void
    {
        $ruta = $this->crearRuta(2);
        $token = $this->tokenDeServicio();

        $this->withToken($token)->postJson("/api/v1/internal/routes/{$ruta->id}/reserve-seat")->assertStatus(200);
        $this->assertSame(1, $ruta->fresh()->available_seats);

        $this->withToken($token)->postJson("/api/v1/internal/routes/{$ruta->id}/release-seat")
            ->assertStatus(200)
            ->assertJsonPath('data.available_seats', 2);

        // Una liberación de más no excede total_seats.
        $this->withToken($token)->postJson("/api/v1/internal/routes/{$ruta->id}/release-seat")
            ->assertStatus(200)
            ->assertJsonPath('data.available_seats', 2);
        $this->assertSame(2, $ruta->fresh()->total_seats);
    }

    public function test_no_se_reserva_una_ruta_no_publicada(): void
    {
        $ruta = $this->crearRuta(3);
        $ruta->update(['status' => 'cancelada']);

        $this->withToken($this->tokenDeServicio())
            ->postJson("/api/v1/internal/routes/{$ruta->id}/reserve-seat")
            ->assertStatus(409);
    }

    public function test_los_endpoints_internos_exigen_token_de_servicio(): void
    {
        $ruta = $this->crearRuta(3);

        $this->postJson("/api/v1/internal/routes/{$ruta->id}/reserve-seat")->assertStatus(401);
        $this->withToken($this->jwtDePrueba((string) Str::uuid()))
            ->postJson("/api/v1/internal/routes/{$ruta->id}/reserve-seat")
            ->assertStatus(403);
        $this->withToken($this->tokenDeServicio())
            ->postJson('/api/v1/internal/routes/no-es-un-uuid/reserve-seat')
            ->assertStatus(404);
    }

    public function test_una_ruta_con_cero_cupos_no_aparece_en_search_match(): void
    {
        $ruta = $this->crearRuta(1, true);
        $token = $this->tokenDeServicio();
        $busqueda = ['pickup_lat' => 7.0856, 'pickup_lng' => -73.1142, 'destination_campus_id' => 1];

        $this->withToken($this->jwtDePrueba((string) Str::uuid()))
            ->postJson('/api/v1/routes/search-match', $busqueda)
            ->assertJsonPath('total_matches', 1);

        $this->withToken($token)->postJson("/api/v1/internal/routes/{$ruta->id}/reserve-seat")->assertStatus(200);

        $this->withToken($this->jwtDePrueba((string) Str::uuid()))
            ->postJson('/api/v1/routes/search-match', $busqueda)
            ->assertStatus(200)
            ->assertJsonPath('total_matches', 0);
    }
}
