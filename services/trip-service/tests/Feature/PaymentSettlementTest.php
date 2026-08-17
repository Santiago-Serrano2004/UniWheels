<?php

namespace Tests\Feature;

use App\Models\Trip;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PaymentSettlementTest extends TestCase
{
    use RefreshDatabase;

    public function test_liquidacion_viaje_con_tarjeta_wompi_autodebito(): void
    {
        $driverId = (string) Str::uuid();
        $passengerId = (string) Str::uuid();

        $trip = Trip::create([
            'route_id' => (string) Str::uuid(),
            'driver_id' => $driverId,
            'passenger_id' => $passengerId,
            'driver_name' => 'Carlos Mendoza',
            'passenger_name' => 'Santiago Serrano',
            'vehicle_plate' => 'KLU-492',
            'vehicle_model' => 'Mazda 3',
            'pickup_address' => 'Cañaveral',
            'dropoff_address' => 'Campus El Jardín',
            'scheduled_pickup_time' => Carbon::now()->addHour(),
            'total_fare_cop' => 5800.00,
            'driver_amount_cop' => 5104.00,
            'platform_commission_cop' => 696.00, // 12% de comisión
            'payment_method' => 'card',
            'status' => 'recogido',
            'boarding_pin' => '4829',
            'is_pin_verified' => true,
        ]);

        $response = $this->postJson("/api/v1/trips/{$trip->id}/complete");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Viaje completado exitosamente en el campus universitario.',
            ])
            ->assertJsonPath('data.status', 'completado')
            ->assertJsonPath('data.total_fare_cop', 5800)
            ->assertJsonPath('data.driver_net_earnings_cop', 5104)
            ->assertJsonPath('data.platform_commission_cop', 696);

        $this->assertDatabaseHas('trips', [
            'id' => $trip->id,
            'status' => 'completado',
            'platform_commission_cop' => 696.00,
        ]);
    }

    public function test_liquidacion_viaje_transferencia_qr_nequi_con_descuento_comision_12_por_ciento(): void
    {
        $driverId = (string) Str::uuid();
        $passengerId = (string) Str::uuid();

        $trip = Trip::create([
            'route_id' => (string) Str::uuid(),
            'driver_id' => $driverId,
            'passenger_id' => $passengerId,
            'driver_name' => 'Carlos Mendoza',
            'passenger_name' => 'Valentina Gómez',
            'vehicle_plate' => 'KLU-492',
            'vehicle_model' => 'Mazda 3',
            'pickup_address' => 'Provenza',
            'dropoff_address' => 'Campus El Jardín',
            'scheduled_pickup_time' => Carbon::now()->addHour(),
            'total_fare_cop' => 5800.00,
            'driver_amount_cop' => 5104.00,
            'platform_commission_cop' => 696.00, // 12%
            'payment_method' => 'nequi_qr_driver',
            'status' => 'recogido',
            'boarding_pin' => '1234',
            'is_pin_verified' => true,
        ]);

        $response = $this->postJson("/api/v1/trips/{$trip->id}/complete");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'completado');

        $this->assertDatabaseHas('trips', [
            'id' => $trip->id,
            'payment_method' => 'nequi_qr_driver',
            'status' => 'completado',
        ]);
    }

    public function test_cancelacion_de_viaje_con_motivo_justificado(): void
    {
        $driverId = (string) Str::uuid();
        $passengerId = (string) Str::uuid();

        $trip = Trip::create([
            'route_id' => (string) Str::uuid(),
            'driver_id' => $driverId,
            'passenger_id' => $passengerId,
            'driver_name' => 'Carlos Mendoza',
            'passenger_name' => 'Santiago Serrano',
            'vehicle_plate' => 'KLU-492',
            'vehicle_model' => 'Mazda 3',
            'pickup_address' => 'Cañaveral',
            'dropoff_address' => 'Campus El Jardín',
            'scheduled_pickup_time' => Carbon::now()->addHour(),
            'total_fare_cop' => 5800.00,
            'driver_amount_cop' => 5104.00,
            'platform_commission_cop' => 696.00,
            'payment_method' => 'wallet',
            'status' => 'confirmado',
            'boarding_pin' => '4829',
            'is_pin_verified' => false,
        ]);

        $response = $this->postJson("/api/v1/trips/{$trip->id}/cancel", [
            'cancelled_by' => 'pasajero',
            'reason' => 'Cambio de horario de clase en la UNAB.',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Viaje cancelado por el pasajero.',
            ])
            ->assertJsonPath('data.status', 'cancelado_por_pasajero');

        $this->assertDatabaseHas('trips', [
            'id' => $trip->id,
            'status' => 'cancelado_por_pasajero',
        ]);
    }
}
