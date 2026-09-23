<?php

namespace Tests\Feature;

use App\Models\Trip;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class TripSosEventTest extends TestCase
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

    public function test_el_conductor_puede_disparar_sos_y_queda_registrado(): void
    {
        $driverId = (string) Str::uuid();
        $passengerId = (string) Str::uuid();
        $trip = $this->crearViajeEnCamino($driverId, $passengerId);

        $response = $this->withToken($this->jwtDePrueba($driverId))
            ->postJson("/api/v1/trips/{$trip->id}/sos", [
                'latitude' => 7.1193,
                'longitude' => -73.1042,
            ]);

        $response->assertStatus(201)->assertJson(['success' => true]);
        $this->assertDatabaseHas('trip_sos_events', [
            'trip_id' => $trip->id,
            'triggered_by_user_id' => $driverId,
            'latitude' => 7.1193,
            'longitude' => -73.1042,
            'emergency_type' => 'panico_usuario',
        ]);
    }

    public function test_el_pasajero_puede_disparar_sos(): void
    {
        $driverId = (string) Str::uuid();
        $passengerId = (string) Str::uuid();
        $trip = $this->crearViajeEnCamino($driverId, $passengerId);

        $response = $this->withToken($this->jwtDePrueba($passengerId))
            ->postJson("/api/v1/trips/{$trip->id}/sos", [
                'latitude' => 7.10,
                'longitude' => -73.10,
                'emergency_type' => 'panico_usuario',
            ]);

        $response->assertStatus(201)->assertJson(['success' => true]);
        $this->assertDatabaseHas('trip_sos_events', [
            'trip_id' => $trip->id,
            'triggered_by_user_id' => $passengerId,
        ]);
    }

    public function test_un_usuario_ajeno_no_puede_disparar_sos_en_un_viaje_que_no_es_suyo(): void
    {
        $driverId = (string) Str::uuid();
        $passengerId = (string) Str::uuid();
        $trip = $this->crearViajeEnCamino($driverId, $passengerId);
        $intruso = (string) Str::uuid();

        $response = $this->withToken($this->jwtDePrueba($intruso))
            ->postJson("/api/v1/trips/{$trip->id}/sos", [
                'latitude' => 7.1193,
                'longitude' => -73.1042,
            ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('trip_sos_events', ['trip_id' => $trip->id]);
    }

    public function test_sos_funciona_incluso_en_un_viaje_ya_completado(): void
    {
        $driverId = (string) Str::uuid();
        $passengerId = (string) Str::uuid();
        $trip = $this->crearViajeEnCamino($driverId, $passengerId);
        $trip->update(['status' => Trip::STATUS_COMPLETADO]);

        $response = $this->withToken($this->jwtDePrueba($passengerId))
            ->postJson("/api/v1/trips/{$trip->id}/sos", [
                'latitude' => 7.1193,
                'longitude' => -73.1042,
            ]);

        $response->assertStatus(201)->assertJson(['success' => true]);
    }
}
