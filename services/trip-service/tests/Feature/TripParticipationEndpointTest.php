<?php

namespace Tests\Feature;

use App\Models\Trip;
use Carbon\Carbon;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class TripParticipationEndpointTest extends TestCase
{
    use RefreshDatabase;

    private function tokenDeServicio(): string
    {
        $ahora = time();

        return JWT::encode([
            'iss' => 'uniwheels-notification-service',
            'sub' => 'notification-service',
            'type' => 'service',
            'jti' => (string) Str::uuid(),
            'iat' => $ahora,
            'exp' => $ahora + 60,
        ], config('jwt.secret'), config('jwt.algo'));
    }

    public function test_devuelve_participantes_y_estado_solo_a_servicios(): void
    {
        $driverId = (string) Str::uuid();
        $passengerId = (string) Str::uuid();
        $trip = Trip::create([
            'route_id' => (string) Str::uuid(),
            'driver_id' => $driverId,
            'passenger_id' => $passengerId,
            'pickup_address' => 'Parque San Pío',
            'dropoff_address' => 'Campus El Jardín',
            'boarding_pin' => '1234',
            'total_fare_cop' => 4500,
            'status' => Trip::STATUS_COMPLETADO,
            'scheduled_pickup_time' => Carbon::tomorrow()->setHour(7),
        ]);

        $this->getJson("/api/v1/internal/trips/{$trip->id}")->assertStatus(401);
        $this->withToken($this->jwtDePrueba($driverId))
            ->getJson("/api/v1/internal/trips/{$trip->id}")
            ->assertStatus(403);

        $this->withToken($this->tokenDeServicio())
            ->getJson("/api/v1/internal/trips/{$trip->id}")
            ->assertOk()
            ->assertJsonPath('data.driver_id', $driverId)
            ->assertJsonPath('data.passenger_id', $passengerId)
            ->assertJsonPath('data.status', 'completado');

        $this->withToken($this->tokenDeServicio())
            ->getJson('/api/v1/internal/trips/'.Str::uuid())
            ->assertStatus(404);
    }
}
