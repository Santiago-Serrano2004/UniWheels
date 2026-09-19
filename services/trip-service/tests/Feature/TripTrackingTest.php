<?php

namespace Tests\Feature;

use App\Models\Trip;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class TripTrackingTest extends TestCase
{
    use RefreshDatabase;

    protected function crearViajeEnCamino(string $driverId, string $passengerId): Trip
    {
        return Trip::create([
            'route_id' => (string) Str::uuid(),
            'driver_id' => $driverId,
            'passenger_id' => $passengerId,
            'driver_name' => 'Carlos Mendoza',
            'passenger_name' => 'Santiago Garcia',
            'vehicle_plate' => 'KLU-492',
            'vehicle_model' => 'Mazda 3',
            'pickup_address' => 'Parque San Pío',
            'dropoff_address' => 'Campus El Jardín',
            'boarding_pin' => '4829',
            'is_pin_verified' => false,
            'total_fare_cop' => 4500,
            'driver_amount_cop' => 3960,
            'platform_commission_cop' => 540,
            'commission_status' => 'pendiente_debito',
            'status' => Trip::STATUS_EN_CAMINO,
            'scheduled_pickup_time' => Carbon::tomorrow()->setHour(7)->setMinute(0),
        ]);
    }

    public function test_el_conductor_asignado_puede_reportar_su_posicion(): void
    {
        $driverId = (string) Str::uuid();
        $passengerId = (string) Str::uuid();
        $trip = $this->crearViajeEnCamino($driverId, $passengerId);

        $response = $this->withToken($this->jwtDePrueba($driverId))
            ->postJson("/api/v1/trips/{$trip->id}/tracking", [
                'latitude' => 7.1193,
                'longitude' => -73.1042,
                'speed_kmh' => 35.5,
                'heading_degrees' => 90,
                'accuracy_meters' => 12,
            ]);

        $response->assertStatus(201)->assertJson(['success' => true]);
        $this->assertDatabaseHas('trip_tracking_points', [
            'trip_id' => $trip->id,
            'latitude' => 7.1193,
            'longitude' => -73.1042,
        ]);
    }

    public function test_un_usuario_ajeno_no_puede_reportar_posicion(): void
    {
        $driverId = (string) Str::uuid();
        $passengerId = (string) Str::uuid();
        $trip = $this->crearViajeEnCamino($driverId, $passengerId);
        $intruso = (string) Str::uuid();

        $response = $this->withToken($this->jwtDePrueba($intruso))
            ->postJson("/api/v1/trips/{$trip->id}/tracking", [
                'latitude' => 7.1193,
                'longitude' => -73.1042,
            ]);

        $response->assertStatus(403);
    }

    public function test_el_pasajero_puede_leer_la_ultima_posicion_reportada(): void
    {
        $driverId = (string) Str::uuid();
        $passengerId = (string) Str::uuid();
        $trip = $this->crearViajeEnCamino($driverId, $passengerId);

        $trip->trackingPoints()->create([
            'latitude' => 7.10,
            'longitude' => -73.10,
            'recorded_at' => now()->subSeconds(10),
        ]);
        $trip->trackingPoints()->create([
            'latitude' => 7.1193,
            'longitude' => -73.1042,
            'recorded_at' => now(),
        ]);

        $response = $this->withToken($this->jwtDePrueba($passengerId))
            ->getJson("/api/v1/trips/{$trip->id}/tracking/latest");

        $response->assertStatus(200)
            ->assertJsonPath('data.latitude', 7.1193)
            ->assertJsonPath('data.longitude', -73.1042);
    }

    public function test_latest_sin_puntos_reportados_devuelve_null_sin_error(): void
    {
        $driverId = (string) Str::uuid();
        $passengerId = (string) Str::uuid();
        $trip = $this->crearViajeEnCamino($driverId, $passengerId);

        $response = $this->withToken($this->jwtDePrueba($passengerId))
            ->getJson("/api/v1/trips/{$trip->id}/tracking/latest");

        $response->assertStatus(200)->assertJsonPath('data', null);
    }

    public function test_no_se_puede_reportar_posicion_en_un_viaje_completado(): void
    {
        $driverId = (string) Str::uuid();
        $passengerId = (string) Str::uuid();
        $trip = $this->crearViajeEnCamino($driverId, $passengerId);
        $trip->update(['status' => Trip::STATUS_COMPLETADO]);

        $response = $this->withToken($this->jwtDePrueba($driverId))
            ->postJson("/api/v1/trips/{$trip->id}/tracking", [
                'latitude' => 7.1193,
                'longitude' => -73.1042,
            ]);

        $response->assertStatus(422);
    }
}
