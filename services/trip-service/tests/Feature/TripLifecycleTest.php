<?php

namespace Tests\Feature;

use App\Models\Trip;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class TripLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected function fakeRouteMatching(string $driverId, float $baseFareCop = 4500.0, ?string $routeId = null): string
    {
        $routeId = $routeId ?? (string) Str::uuid();

        Http::fake([
            '*/api/v1/routes/*' => Http::response([
                'success' => true,
                'data' => [
                    'id' => $routeId,
                    'driver_id' => $driverId,
                    'base_contribution_cop' => $baseFareCop,
                ],
            ], 200),
        ]);

        return $routeId;
    }

    public function test_un_pasajero_puede_reservar_un_viaje_y_obtener_pin_de_4_digitos(): void
    {
        $passengerId = (string) Str::uuid();
        $driverId = (string) Str::uuid();
        $routeId = $this->fakeRouteMatching($driverId, 4500.0);

        $payload = [
            'route_id' => $routeId,
            'driver_name' => 'Carlos Mendoza',
            'passenger_name' => 'Santiago Garcia',
            'vehicle_plate' => 'KLU-492',
            'vehicle_model' => 'Mazda 3 (Rojo)',
            'pickup_address' => 'Parque San Pío',
            'dropoff_address' => 'Campus El Jardín',
            'total_fare_cop' => 5800,
            'scheduled_pickup_time' => Carbon::tomorrow()->setHour(7)->setMinute(5)->toISOString(),
        ];

        $response = $this->withToken($this->jwtDePrueba($passengerId))->postJson('/api/v1/trips', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Viaje reservado exitosamente. Se ha generado tu PIN de abordaje seguro.',
            ])
            ->assertJsonPath('data.status', 'confirmado')
            ->assertJsonPath('data.total_fare_cop', 5800);

        $this->assertDatabaseHas('trips', [
            'pickup_address' => 'Parque San Pío',
            'total_fare_cop' => 5800.00,
            'status' => 'confirmado',
            'passenger_id' => $passengerId,
            'driver_id' => $driverId,
        ]);
    }

    public function test_rechaza_una_tarifa_fuera_del_rango_valido_de_la_ruta(): void
    {
        $passengerId = (string) Str::uuid();
        $driverId = (string) Str::uuid();
        $routeId = $this->fakeRouteMatching($driverId, 4500.0);

        $payload = [
            'route_id' => $routeId,
            'pickup_address' => 'Parque San Pío',
            'dropoff_address' => 'Campus El Jardín',
            'total_fare_cop' => 50000, // muy por encima del máximo tolerable (base + 4500)
            'scheduled_pickup_time' => Carbon::tomorrow()->setHour(7)->setMinute(5)->toISOString(),
        ];

        $this->withToken($this->jwtDePrueba($passengerId))
            ->postJson('/api/v1/trips', $payload)
            ->assertStatus(422);
    }

    public function test_el_conductor_puede_iniciar_el_recorrido_y_llegar_al_punto_de_encuentro(): void
    {
        $trip = $this->crearViajeBase();

        $respStart = $this->withToken($this->jwtDePrueba($trip->driver_id))
            ->postJson("/api/v1/trips/{$trip->id}/start");
        $respStart->assertStatus(200)
            ->assertJsonPath('data.status', 'en_camino');

        $respArrive = $this->withToken($this->jwtDePrueba($trip->driver_id))
            ->postJson("/api/v1/trips/{$trip->id}/arrive");
        $respArrive->assertStatus(200)
            ->assertJsonPath('data.status', 'en_punto_encuentro');
    }

    public function test_valida_el_pin_de_abordaje_y_transiciona_a_recogido(): void
    {
        $trip = $this->crearViajeBase('4829');

        $response = $this->withToken($this->jwtDePrueba($trip->driver_id))
            ->postJson("/api/v1/trips/{$trip->id}/verify-pin", ['pin' => '4829']);

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

        $response = $this->withToken($this->jwtDePrueba($trip->driver_id))
            ->postJson("/api/v1/trips/{$trip->id}/verify-pin", ['pin' => '9999']);

        $response->assertStatus(422)
            ->assertJson(['success' => false]);

        $this->assertDatabaseHas('trips', [
            'id' => $trip->id,
            'is_pin_verified' => false,
            'status' => 'confirmado',
        ]);
    }

    public function test_no_se_puede_verificar_el_pin_de_un_viaje_ya_cancelado(): void
    {
        $trip = $this->crearViajeBase('4829');
        $trip->update(['status' => Trip::STATUS_CANCELADO_PASAJERO]);

        $response = $this->withToken($this->jwtDePrueba($trip->driver_id))
            ->postJson("/api/v1/trips/{$trip->id}/verify-pin", ['pin' => '4829']);

        $response->assertStatus(422);
        $this->assertDatabaseHas('trips', [
            'id' => $trip->id,
            'status' => 'cancelado_por_pasajero',
        ]);
    }

    public function test_no_permite_completar_el_viaje_si_no_ha_validado_el_pin(): void
    {
        $trip = $this->crearViajeBase('4829');

        $response = $this->withToken($this->jwtDePrueba($trip->driver_id))
            ->postJson("/api/v1/trips/{$trip->id}/complete");

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'No puedes completar un viaje que no ha verificado el PIN de abordaje.',
            ]);
    }

    public function test_completa_un_viaje_y_registra_la_hora_de_llegada(): void
    {
        $trip = $this->crearViajeBase('4829', 5000.0);
        $trip->verifyBoardingPin('4829');

        $response = $this->withToken($this->jwtDePrueba($trip->driver_id))
            ->postJson("/api/v1/trips/{$trip->id}/complete");

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.status', 'completado')
            ->assertJsonPath('data.total_fare_cop', 5000);

        $this->assertDatabaseHas('trips', [
            'id' => $trip->id,
            'status' => 'completado',
        ]);
        $this->assertNotNull($trip->fresh()->actual_dropoff_time);
    }

    public function test_cancelacion_por_conductor_con_menos_de_15_min_aplica_penalizacion(): void
    {
        $trip = $this->crearViajeBase('4829', 4500.0, null, null, Carbon::now()->addMinutes(5));

        $response = $this->withToken($this->jwtDePrueba($trip->driver_id))
            ->postJson("/api/v1/trips/{$trip->id}/cancel", [
                'cancelled_by' => 'conductor',
                'reason' => 'Se pinchó una llanta en la autopista.',
            ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.status', 'cancelado_por_conductor')
            ->assertJsonPath('data.late_cancellation', true)
            ->assertJsonPath('data.warning', 'Se registró una cancelación tardía. Al acumular 3 en 30 días tu cuenta se suspende por 30 días.');

        $this->assertDatabaseHas('trip_cancellations', [
            'trip_id' => $trip->id,
            'canceller_role' => 'conductor',
            'had_penalty' => true,
        ]);
    }

    public function test_cancelacion_por_conductor_con_mas_de_15_min_no_aplica_penalizacion(): void
    {
        $trip = $this->crearViajeBase('4829', 4500.0, null, null, Carbon::now()->addMinutes(45));

        $response = $this->withToken($this->jwtDePrueba($trip->driver_id))
            ->postJson("/api/v1/trips/{$trip->id}/cancel", [
                'cancelled_by' => 'conductor',
                'reason' => 'Cambio de planes con antelación.',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.late_cancellation', false);
    }

    public function test_cancelacion_por_pasajero_con_mas_de_2_min_no_aplica_penalizacion(): void
    {
        $trip = $this->crearViajeBase('4829', 4500.0, null, null, Carbon::now()->addMinutes(10));

        $response = $this->withToken($this->jwtDePrueba($trip->passenger_id))
            ->postJson("/api/v1/trips/{$trip->id}/cancel", [
                'cancelled_by' => 'pasajero',
                'reason' => 'Se canceló mi clase de 7am.',
            ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.status', 'cancelado_por_pasajero')
            ->assertJsonPath('data.late_cancellation', false);
    }

    public function test_cancelacion_por_pasajero_con_menos_de_2_min_aplica_penalizacion(): void
    {
        $trip = $this->crearViajeBase('4829', 4500.0, null, null, Carbon::now()->addMinute());

        $response = $this->withToken($this->jwtDePrueba($trip->passenger_id))
            ->postJson("/api/v1/trips/{$trip->id}/cancel", [
                'cancelled_by' => 'pasajero',
                'reason' => 'Ya no puedo esperar.',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.late_cancellation', true);
    }

    public function test_consulta_el_viaje_activo_del_pasajero(): void
    {
        $passengerId = (string) Str::uuid();
        $trip = $this->crearViajeBase('4829', 4500.0, $passengerId);

        $response = $this->withToken($this->jwtDePrueba($passengerId))
            ->getJson('/api/v1/passenger/active-trip');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'has_active_trip' => true,
            ])
            ->assertJsonPath('data.boarding_pin', '4829')
            ->assertJsonPath('data.pickup_address', 'Parque San Pío');
    }

    public function test_rutas_de_viajes_rechazan_peticiones_sin_token(): void
    {
        $this->postJson('/api/v1/trips', [])->assertStatus(401);
        $this->getJson('/api/v1/passenger/active-trip')->assertStatus(401);
    }

    public function test_un_pasajero_no_puede_consultar_el_historial_de_otro_pasajero_por_query_param(): void
    {
        $passengerReal = (string) Str::uuid();
        $otroPassenger = (string) Str::uuid();
        $this->crearViajeBase('4829', 4500.0, $otroPassenger);

        // Intenta forzar el passenger_id de otro usuario vía query string — debe ser ignorado.
        $response = $this->withToken($this->jwtDePrueba($passengerReal))
            ->getJson('/api/v1/passenger/history?passenger_id='.$otroPassenger);

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    protected function crearViajeBase(
        string $pin = '4829',
        float $fare = 4500.0,
        ?string $passengerId = null,
        ?string $driverId = null,
        ?Carbon $scheduledPickupTime = null
    ): Trip {
        return Trip::create([
            'route_id' => (string) Str::uuid(),
            'driver_id' => $driverId ?? (string) Str::uuid(),
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
            'status' => Trip::STATUS_CONFIRMADO,
            'scheduled_pickup_time' => $scheduledPickupTime ?? Carbon::tomorrow()->setHour(7)->setMinute(0),
        ]);
    }
}
