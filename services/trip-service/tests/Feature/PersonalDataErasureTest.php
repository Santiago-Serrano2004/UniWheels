<?php

namespace Tests\Feature;

use App\Models\Trip;
use App\Models\TripTrackingPoint;
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

    private function crearViaje(string $driverId, string $passengerId): Trip
    {
        return Trip::create([
            'route_id' => (string) Str::uuid(),
            'driver_id' => $driverId,
            'passenger_id' => $passengerId,
            'driver_name' => 'Carlos Real',
            'passenger_name' => 'Ana Real',
            'vehicle_plate' => 'ABC123',
            'vehicle_model' => 'Kia Rio',
            'pickup_address' => 'Calle 1 # 2-3',
            'dropoff_address' => 'Carrera 4 # 5-6',
            'boarding_pin' => '1234',
            'total_fare_cop' => 4500,
            'status' => Trip::STATUS_COMPLETADO,
            'scheduled_pickup_time' => Carbon::tomorrow()->setHour(7),
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

    public function test_anonimiza_nombres_direcciones_y_borra_puntos_conservando_ids_y_estados(): void
    {
        $pasajeroId = (string) Str::uuid();
        $conductorId = (string) Str::uuid();
        $viaje = $this->crearViaje($conductorId, $pasajeroId);
        TripTrackingPoint::create([
            'trip_id' => $viaje->id,
            'latitude' => 7.1,
            'longitude' => -73.1,
            'recorded_at' => now(),
        ]);
        $ajeno = $this->crearViaje((string) Str::uuid(), (string) Str::uuid());

        $this->withToken($this->tokenDeServicio())
            ->deleteJson("/api/v1/internal/users/{$pasajeroId}/personal-data")
            ->assertOk();

        $viaje->refresh();
        $this->assertSame('Usuario eliminado', $viaje->passenger_name);
        $this->assertSame('Dirección eliminada', $viaje->pickup_address);
        $this->assertSame('Dirección eliminada', $viaje->dropoff_address);
        $this->assertSame('Carlos Real', $viaje->driver_name);
        $this->assertSame(Trip::STATUS_COMPLETADO, $viaje->status);
        $this->assertSame($pasajeroId, $viaje->passenger_id);
        $this->assertSame(0, TripTrackingPoint::where('trip_id', $viaje->id)->count());
        $this->assertSame('Ana Real', $ajeno->fresh()->passenger_name);
    }

    public function test_anonimiza_los_datos_del_conductor_en_sus_viajes(): void
    {
        $conductorId = (string) Str::uuid();
        $viaje = $this->crearViaje($conductorId, (string) Str::uuid());

        $this->withToken($this->tokenDeServicio())
            ->deleteJson("/api/v1/internal/users/{$conductorId}/personal-data")
            ->assertOk();

        $viaje->refresh();
        $this->assertSame('Usuario eliminado', $viaje->driver_name);
        $this->assertNull($viaje->vehicle_plate);
        $this->assertNull($viaje->vehicle_model);
        $this->assertSame('Ana Real', $viaje->passenger_name);
    }
}
