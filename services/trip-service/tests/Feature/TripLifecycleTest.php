<?php

namespace Tests\Feature;

use App\Models\Trip;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class TripLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_un_pasajero_puede_reservar_un_viaje_y_obtener_pin_de_4_digitos(): void
    {
        $payload = [
            'route_id' => (string) Str::uuid(),
            'driver_id' => (string) Str::uuid(),
            'passenger_id' => (string) Str::uuid(),
            'driver_name' => 'Carlos Mendoza',
            'passenger_name' => 'Santiago Garcia',
            'vehicle_plate' => 'KLU-492',
            'vehicle_model' => 'Mazda 3 (Rojo)',
            'pickup_address' => 'Parque San Pío',
            'dropoff_address' => 'Campus El Jardín',
            'total_fare_cop' => 5800,
            'scheduled_pickup_time' => Carbon::tomorrow()->setHour(7)->setMinute(5)->toISOString(),
            'boarding_pin' => '4829',
        ];

        $response = $this->postJson('/api/v1/trips', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Viaje reservado exitosamente. Se ha generado tu PIN de abordaje seguro.',
            ])
            ->assertJsonPath('data.boarding_pin', '4829')
            ->assertJsonPath('data.status', 'confirmado')
            ->assertJsonPath('data.total_fare_cop', 5800);

        $this->assertDatabaseHas('trips', [
            'boarding_pin' => '4829',
            'pickup_address' => 'Parque San Pío',
            'total_fare_cop' => 5800.00,
            'status' => 'confirmado',
        ]);
    }

    public function test_el_conductor_puede_iniciar_el_recorrido_y_llegar_al_punto_de_encuentro(): void
    {
        $trip = $this->crearViajeBase();

        // 1. Iniciar conducción
        $respStart = $this->postJson("/api/v1/trips/{$trip->id}/start");
        $respStart->assertStatus(200)
            ->assertJsonPath('data.status', 'en_camino');

        // 2. Llegar al punto
        $respArrive = $this->postJson("/api/v1/trips/{$trip->id}/arrive");
        $respArrive->assertStatus(200)
            ->assertJsonPath('data.status', 'en_punto_encuentro');
    }

    public function test_valida_el_pin_de_abordaje_y_transiciona_a_recogido(): void
    {
        $trip = $this->crearViajeBase('4829');

        $response = $this->postJson("/api/v1/trips/{$trip->id}/verify-pin", [
            'pin' => '4829',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'PIN verificado exitosamente. Pasajero a bordo del vehículo.',
            ])
            ->assertJsonPath('data.is_pin_verified', true)
            ->assertJsonPath('data.status', 'recogido');

        $this->assertDatabaseHas('trips', [
            'id' => $trip->id,
            'is_pin_verified' => true,
            'status' => 'recogido',
        ]);
    }

    public function test_rechaza_un_pin_incorrecto_y_mantiene_el_estado(): void
    {
        $trip = $this->crearViajeBase('4829');

        $response = $this->postJson("/api/v1/trips/{$trip->id}/verify-pin", [
            'pin' => '9999', // PIN incorrecto
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);

        $this->assertDatabaseHas('trips', [
            'id' => $trip->id,
            'is_pin_verified' => false,
            'status' => 'confirmado',
        ]);
    }

    public function test_no_permite_completar_el_viaje_si_no_ha_validado_el_pin(): void
    {
        $trip = $this->crearViajeBase('4829'); // Estado 'confirmado', sin validar PIN

        $response = $this->postJson("/api/v1/trips/{$trip->id}/complete");

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'No puedes completar un viaje que no ha verificado el PIN de abordaje.',
            ]);
    }

    public function test_completa_el_viaje_y_liquida_la_comision_del_12_por_ciento(): void
    {
        $trip = $this->crearViajeBase('4829', 5000.0);
        $trip->verifyBoardingPin('4829'); // Transicionar a recogido

        $response = $this->postJson("/api/v1/trips/{$trip->id}/complete");

        // 12% de 5000 = 600 COP de comisión, ganancia conductor = 4400 COP
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonPath('data.status', 'completado')
            ->assertJsonPath('data.total_fare_cop', 5000)
            ->assertJsonPath('data.platform_commission_cop', 600)
            ->assertJsonPath('data.driver_net_earnings_cop', 4400);

        $this->assertDatabaseHas('trips', [
            'id' => $trip->id,
            'status' => 'completado',
            'platform_commission_cop' => 600.00,
            'driver_amount_cop' => 4400.00,
            'commission_status' => 'debitada_exitosamente',
        ]);
    }

    public function test_cancelacion_por_conductor_aplica_penalizacion_de_3000_cop(): void
    {
        $trip = $this->crearViajeBase();

        $response = $this->postJson("/api/v1/trips/{$trip->id}/cancel", [
            'cancelled_by' => 'conductor',
            'reason' => 'Se pinchó una llanta en la autopista.',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonPath('data.status', 'cancelado_por_conductor')
            ->assertJsonPath('data.penalized', true)
            ->assertJsonPath('data.penalty_fee_cop', 3000);
    }

    public function test_cancelacion_por_pasajero_no_aplica_penalizacion(): void
    {
        $trip = $this->crearViajeBase();

        $response = $this->postJson("/api/v1/trips/{$trip->id}/cancel", [
            'cancelled_by' => 'pasajero',
            'reason' => 'Se canceló mi clase de 7am.',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonPath('data.status', 'cancelado_por_pasajero');
    }

    public function test_consulta_el_viaje_activo_del_pasajero(): void
    {
        $passengerId = (string) Str::uuid();
        $trip = $this->crearViajeBase('4829', 4500.0, $passengerId);

        $response = $this->getJson("/api/v1/passenger/{$passengerId}/active-trip");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'has_active_trip' => true,
            ])
            ->assertJsonPath('data.boarding_pin', '4829')
            ->assertJsonPath('data.pickup_address', 'Parque San Pío');
    }

    protected function crearViajeBase(string $pin = '4829', float $fare = 4500.0, ?string $passengerId = null): Trip
    {
        return Trip::create([
            'route_id' => (string) Str::uuid(),
            'driver_id' => (string) Str::uuid(),
            'passenger_id' => $passengerId ?? (string) Str::uuid(),
            'driver_name' => 'Carlos Mendoza',
            'passenger_name' => 'Santiago Garcia',
            'vehicle_plate' => 'KLU-492',
            'vehicle_model' => 'Mazda 3',
            'pickup_address' => 'Parque San Pío',
            'dropoff_address' => 'Campus El Jardín',
            'boarding_pin' => $pin,
            'is_pin_verified' => false,
            'total_fare_cop' => $fare,
            'driver_amount_cop' => round($fare * 0.88, 2),
            'platform_commission_cop' => round($fare * 0.12, 2),
            'commission_status' => 'pendiente_debito',
            'status' => Trip::STATUS_CONFIRMADO,
            'scheduled_pickup_time' => Carbon::tomorrow()->setHour(7)->setMinute(0),
        ]);
    }
}
