<?php

namespace Tests\Feature;

use App\Models\Trip;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PurgeOldTrackingPointsCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function crearViaje(string $status): Trip
    {
        return Trip::create([
            'route_id' => (string) Str::uuid(),
            'driver_id' => (string) Str::uuid(),
            'passenger_id' => (string) Str::uuid(),
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
            'status' => $status,
            'scheduled_pickup_time' => Carbon::tomorrow()->setHour(7)->setMinute(0),
        ]);
    }

    public function test_borra_puntos_viejos_de_viajes_finalizados(): void
    {
        $viajeCompletado = $this->crearViaje(Trip::STATUS_COMPLETADO);
        $viajeCompletado->trackingPoints()->create([
            'latitude' => 7.1,
            'longitude' => -73.1,
            'recorded_at' => now()->subDays(10),
        ]);

        $this->artisan('uniwheels:purge-tracking-points')->assertSuccessful();

        $this->assertDatabaseCount('trip_tracking_points', 0);
    }

    public function test_no_borra_puntos_recientes(): void
    {
        $viajeCompletado = $this->crearViaje(Trip::STATUS_COMPLETADO);
        $viajeCompletado->trackingPoints()->create([
            'latitude' => 7.1,
            'longitude' => -73.1,
            'recorded_at' => now()->subDays(2),
        ]);

        $this->artisan('uniwheels:purge-tracking-points')->assertSuccessful();

        $this->assertDatabaseCount('trip_tracking_points', 1);
    }

    public function test_no_borra_puntos_de_viajes_todavia_en_curso(): void
    {
        $viajeEnCamino = $this->crearViaje(Trip::STATUS_EN_CAMINO);
        $viajeEnCamino->trackingPoints()->create([
            'latitude' => 7.1,
            'longitude' => -73.1,
            'recorded_at' => now()->subDays(30),
        ]);

        $this->artisan('uniwheels:purge-tracking-points')->assertSuccessful();

        $this->assertDatabaseCount('trip_tracking_points', 1);
    }
}
