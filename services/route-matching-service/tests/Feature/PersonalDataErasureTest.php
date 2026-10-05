<?php

namespace Tests\Feature;

use App\Models\Route;
use Carbon\Carbon;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PersonalDataErasureTest extends TestCase
{
    use RefreshDatabase;

    private function tokenDeServicio(): string
    {
        $ahora = time();

        return JWT::encode([
            'iss' => 'uniwheels-auth-service',
            'sub' => 'auth-service',
            'type' => 'service',
            'jti' => (string) Str::uuid(),
            'iat' => $ahora,
            'exp' => $ahora + 60,
        ], config('jwt.secret'), config('jwt.algo'));
    }

    private function crearRuta(string $driverId, Carbon $salida, string $status = 'publicada'): Route
    {
        return Route::create([
            'driver_id' => $driverId,
            'vehicle_id' => (string) Str::uuid(),
            'origin_name' => 'Cañaveral',
            'destination_campus_id' => 1,
            'destination_campus_name' => 'Campus El Jardín',
            'scheduled_departure_time' => $salida,
            'target_arrival_time' => $salida->copy()->addMinutes(45),
            'estimated_duration_minutes' => 25.0,
            'max_detour_minutes' => 15,
            'accumulated_detour_minutes' => 0.0,
            'available_seats' => 3,
            'base_contribution_cop' => 4500,
            'status' => $status,
        ]);
    }

    public function test_el_endpoint_interno_exige_token_de_servicio(): void
    {
        $userId = (string) Str::uuid();

        $this->deleteJson("/api/v1/internal/users/{$userId}/personal-data")->assertStatus(401);
        $this->withToken($this->jwtDePrueba($userId))
            ->deleteJson("/api/v1/internal/users/{$userId}/personal-data")
            ->assertStatus(403);
    }

    public function test_cancela_las_rutas_futuras_del_usuario_y_no_toca_las_demas(): void
    {
        $driverId = (string) Str::uuid();
        $futura = $this->crearRuta($driverId, Carbon::tomorrow()->setHour(7));
        $pasada = $this->crearRuta($driverId, Carbon::yesterday()->setHour(7), 'finalizada');
        $ajena = $this->crearRuta((string) Str::uuid(), Carbon::tomorrow()->setHour(7));

        $this->withToken($this->tokenDeServicio())
            ->deleteJson("/api/v1/internal/users/{$driverId}/personal-data")
            ->assertOk();

        $this->assertSame('cancelada', $futura->fresh()->status);
        $this->assertSame('finalizada', $pasada->fresh()->status);
        $this->assertSame('publicada', $ajena->fresh()->status);
    }
}
