<?php

namespace Tests\Feature;

use App\Models\Trip;
use App\Models\TripCancellation;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class LateCancellationSuspensionTest extends TestCase
{
    use RefreshDatabase;

    private function crearViajeDelPasajero(string $passengerId, Carbon $salida): Trip
    {
        return Trip::create([
            'route_id' => (string) Str::uuid(),
            'driver_id' => (string) Str::uuid(),
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
            'status' => Trip::STATUS_CONFIRMADO,
            'scheduled_pickup_time' => $salida,
        ]);
    }

    /** Registra cancelaciones tardías previas del usuario, creadas hace $diasAtras días. */
    private function registrarCancelacionesTardias(string $userId, int $cantidad, int $diasAtras = 1): void
    {
        for ($i = 0; $i < $cantidad; $i++) {
            $viaje = $this->crearViajeDelPasajero($userId, Carbon::now()->subDays($diasAtras));

            $cancelacion = TripCancellation::create([
                'trip_id' => $viaje->id,
                'cancelled_by_user_id' => $userId,
                'canceller_role' => 'pasajero',
                'reason_category' => 'otro',
                'detailed_reason' => 'Cancelación previa',
                'minutes_before_departure' => 0,
                'had_penalty' => true,
            ]);

            TripCancellation::whereKey($cancelacion->id)->update(['created_at' => Carbon::now()->subDays($diasAtras)]);
        }
    }

    private function cancelarTardiamente(string $passengerId): TestResponse
    {
        $viaje = $this->crearViajeDelPasajero($passengerId, Carbon::now()->addMinute());

        return $this->withToken($this->jwtDePrueba($passengerId))
            ->postJson("/api/v1/trips/{$viaje->id}/cancel", [
                'cancelled_by' => 'pasajero',
                'reason' => 'Ya no puedo esperar.',
            ]);
    }

    public function test_la_tercera_cancelacion_tardia_en_30_dias_suspende_la_cuenta(): void
    {
        $passengerId = (string) Str::uuid();
        $hasta = Carbon::now()->addDays(30);
        Http::fake([
            '*/api/v1/internal/users/*/late-cancellation-suspension' => Http::response([
                'success' => true,
                'data' => ['suspended' => true, 'suspended_until' => $hasta->toISOString()],
            ], 200),
        ]);
        $this->registrarCancelacionesTardias($passengerId, 2);

        $this->cancelarTardiamente($passengerId)
            ->assertStatus(200)
            ->assertJsonPath('data.late_cancellation', true)
            ->assertJsonPath('data.late_cancellations_30d', 3)
            ->assertJsonPath('data.suspended', true)
            ->assertJsonPath('data.suspended_until', $hasta->toISOString())
            ->assertJsonPath('data.warning', 'Acumulaste 3 cancelaciones tardías en 30 días. Tu cuenta quedó suspendida hasta el '.$hasta->copy()->setTimezone('America/Bogota')->format('d/m/Y').'.');

        Http::assertSent(fn (Request $request) => str_contains($request->url(), "/api/v1/internal/users/{$passengerId}/late-cancellation-suspension")
            && $request['late_cancellations_count'] === 3
            && $request['days'] === 30
            && $request->hasHeader('Authorization'));
    }

    public function test_con_dos_cancelaciones_tardias_no_se_llama_a_auth(): void
    {
        $passengerId = (string) Str::uuid();
        Http::fake();
        $this->registrarCancelacionesTardias($passengerId, 1);

        $this->cancelarTardiamente($passengerId)
            ->assertStatus(200)
            ->assertJsonPath('data.late_cancellations_30d', 2)
            ->assertJsonPath('data.suspended', false)
            ->assertJsonPath('data.suspended_until', null)
            ->assertJsonPath('data.warning', 'Se registró una cancelación tardía (2 de 3 en 30 días). Al llegar a 3 tu cuenta se suspende por 30 días.');

        Http::assertNothingSent();
    }

    public function test_las_cancelaciones_de_hace_mas_de_30_dias_no_cuentan(): void
    {
        $passengerId = (string) Str::uuid();
        Http::fake();
        $this->registrarCancelacionesTardias($passengerId, 2, 31);

        $this->cancelarTardiamente($passengerId)
            ->assertStatus(200)
            ->assertJsonPath('data.late_cancellations_30d', 1)
            ->assertJsonPath('data.suspended', false);

        Http::assertNothingSent();
    }

    public function test_una_cancelacion_no_tardia_no_evalua_la_politica(): void
    {
        $passengerId = (string) Str::uuid();
        Http::fake();
        $this->registrarCancelacionesTardias($passengerId, 5);
        $viaje = $this->crearViajeDelPasajero($passengerId, Carbon::now()->addMinutes(30));

        $this->withToken($this->jwtDePrueba($passengerId))
            ->postJson("/api/v1/trips/{$viaje->id}/cancel", [
                'cancelled_by' => 'pasajero',
                'reason' => 'Cambio de planes con antelación.',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.late_cancellation', false)
            ->assertJsonPath('data.warning', null)
            ->assertJsonMissingPath('data.suspended');

        Http::assertNothingSent();
    }

    public function test_si_auth_falla_la_cancelacion_igual_responde_200_sin_suspender(): void
    {
        $passengerId = (string) Str::uuid();
        Http::fake([
            '*/api/v1/internal/users/*/late-cancellation-suspension' => Http::response([], 500),
        ]);
        $this->registrarCancelacionesTardias($passengerId, 2);

        $this->cancelarTardiamente($passengerId)
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'cancelado_por_pasajero')
            ->assertJsonPath('data.late_cancellations_30d', 3)
            ->assertJsonPath('data.suspended', false);
    }

    public function test_si_auth_esta_caido_la_cancelacion_igual_responde_200(): void
    {
        $passengerId = (string) Str::uuid();
        Http::fake([
            '*/api/v1/internal/users/*/late-cancellation-suspension' => function () {
                throw new ConnectionException('Connection refused');
            },
        ]);
        $this->registrarCancelacionesTardias($passengerId, 2);

        $this->cancelarTardiamente($passengerId)
            ->assertStatus(200)
            ->assertJsonPath('data.suspended', false);
    }

    public function test_la_rama_del_conductor_tambien_evalua_la_politica(): void
    {
        $driverId = (string) Str::uuid();
        Http::fake([
            '*/api/v1/internal/users/*/late-cancellation-suspension' => Http::response([
                'success' => true,
                'data' => ['suspended' => true, 'suspended_until' => Carbon::now()->addDays(30)->toISOString()],
            ], 200),
        ]);
        $this->registrarCancelacionesTardias($driverId, 2);

        $viaje = $this->crearViajeDelPasajero((string) Str::uuid(), Carbon::now()->addMinutes(5));
        $viaje->update(['driver_id' => $driverId]);

        $this->withToken($this->jwtDePrueba($driverId))
            ->postJson("/api/v1/trips/{$viaje->id}/cancel", [
                'cancelled_by' => 'conductor',
                'reason' => 'Se pinchó una llanta en la autopista.',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.late_cancellation', true)
            ->assertJsonPath('data.suspended', true);
    }
}
