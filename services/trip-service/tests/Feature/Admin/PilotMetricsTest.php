<?php

namespace Tests\Feature\Admin;

use App\Models\Trip;
use App\Models\TripCancellation;
use App\Services\PilotMetrics;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class PilotMetricsTest extends TestCase
{
    use RefreshDatabase;

    private function lunesActual(): CarbonImmutable
    {
        return CarbonImmutable::now('America/Bogota')->startOfWeek();
    }

    private function viajeCompletado(string $pasajero, CarbonImmutable $llegada, ?string $conductor = null): Trip
    {
        return Trip::create([
            'route_id' => (string) Str::uuid(),
            'driver_id' => $conductor ?? (string) Str::uuid(),
            'passenger_id' => $pasajero,
            'pickup_address' => 'UNAB Central',
            'dropoff_address' => 'Cabecera',
            'boarding_pin' => '1234',
            'is_pin_verified' => true,
            'total_fare_cop' => 5000,
            'status' => Trip::STATUS_COMPLETADO,
            'scheduled_pickup_time' => $llegada->subHour()->utc(),
            'actual_pickup_time' => $llegada->subMinutes(40)->utc(),
            'actual_dropoff_time' => $llegada->utc(),
        ]);
    }

    private function admin(): string
    {
        return $this->jwtDePrueba((string) Str::uuid(), ['administrador']);
    }

    private function semana(array $respuesta, CarbonImmutable $lunes): array
    {
        return collect($respuesta['data'])->firstWhere('week_start', $lunes->toDateString());
    }

    public function test_repeticion_a_14_dias_con_cohorte_sembrada(): void
    {
        Http::fake(['*' => Http::response(['success' => true, 'data' => []], 200)]);

        $primera = $this->lunesActual()->subWeeks(5)->addDays(1)->setTime(12, 0);
        [$repite, $tarde, $sinRepetir] = [(string) Str::uuid(), (string) Str::uuid(), (string) Str::uuid()];

        foreach ([$repite, $tarde, $sinRepetir] as $pasajero) {
            $this->viajeCompletado($pasajero, $primera);
        }
        $this->viajeCompletado($repite, $primera->addDays(5));
        $this->viajeCompletado($tarde, $primera->addDays(20));

        $respuesta = $this->withToken($this->admin())->getJson('/api/v1/admin/metrics/weekly?weeks=12')
            ->assertOk()->json();

        $semana = $this->semana($respuesta, $primera->startOfWeek());
        $this->assertSame(3, $semana['repeat_14d_cohort']);
        $this->assertSame(0.3333, $semana['repeat_14d_rate']);
        $this->assertFalse($semana['repeat_14d_immature']);
    }

    public function test_cuenta_viajes_cancelaciones_y_activos_por_semana(): void
    {
        Http::fake(['*' => Http::response(['success' => true, 'data' => []], 200)]);

        $lunes = $this->lunesActual();
        $conductor = (string) Str::uuid();
        $pasajero = (string) Str::uuid();

        $this->viajeCompletado($pasajero, $lunes->addHours(10), $conductor);
        $this->viajeCompletado($pasajero, $lunes->addHours(11), $conductor);
        $viaje = $this->viajeCompletado((string) Str::uuid(), $lunes->subWeek()->addDays(2));

        foreach ([true, false] as $penalizada) {
            TripCancellation::create([
                'trip_id' => $viaje->id,
                'cancelled_by_user_id' => $pasajero,
                'canceller_role' => 'pasajero',
                'reason_category' => 'otro',
                'minutes_before_departure' => 1,
                'had_penalty' => $penalizada,
                'created_at' => $lunes->addHours(9)->utc(),
            ]);
        }

        $respuesta = $this->withToken($this->admin())->getJson('/api/v1/admin/metrics/weekly')
            ->assertOk()->json();

        $this->assertCount(12, $respuesta['data']);
        $actual = $this->semana($respuesta, $lunes);
        $this->assertSame(2, $actual['completed_trips']);
        $this->assertSame(1, $actual['late_cancellations']);
        $this->assertSame(1, $actual['active_passengers']);
        $this->assertSame(1, $actual['active_drivers']);
        $this->assertSame(1, $this->semana($respuesta, $lunes->subWeek())['completed_trips']);
    }

    public function test_une_los_usuarios_activos_con_los_hashes_de_route_matching(): void
    {
        $lunes = $this->lunesActual();
        $pasajero = (string) Str::uuid();
        $conductor = (string) Str::uuid();
        $this->viajeCompletado($pasajero, $lunes->addHours(10), $conductor);

        $metricas = app(PilotMetrics::class);
        // Remoto: el mismo pasajero (ya contado en trip) y un buscador que nunca viajó.
        Http::fake(['*/internal/metrics/weekly-active-users*' => Http::response(['success' => true, 'data' => [
            $lunes->toDateString() => [$metricas->hash($pasajero), $metricas->hash((string) Str::uuid())],
        ]], 200)]);

        $respuesta = $this->withToken($this->admin())->getJson('/api/v1/admin/metrics/weekly')
            ->assertOk()->assertJsonPath('partial', false)->json();

        // pasajero + conductor (trip) ∪ pasajero + buscador (route-matching) = 3 únicos.
        $this->assertSame(3, $this->semana($respuesta, $lunes)['weekly_active_users']);
        $this->assertStringNotContainsString($pasajero, json_encode($respuesta));
    }

    public function test_partial_cuando_falla_route_matching(): void
    {
        $lunes = $this->lunesActual();
        $this->viajeCompletado((string) Str::uuid(), $lunes->addHours(10));
        Http::fake(['*/internal/metrics/weekly-active-users*' => Http::response([], 500)]);

        $respuesta = $this->withToken($this->admin())->getJson('/api/v1/admin/metrics/weekly')
            ->assertOk()->assertJsonPath('partial', true)->json();

        // Solo los activos de trip: pasajero + conductor.
        $this->assertSame(2, $this->semana($respuesta, $lunes)['weekly_active_users']);
    }

    public function test_un_usuario_que_no_es_admin_recibe_403(): void
    {
        $this->withToken($this->jwtDePrueba((string) Str::uuid(), ['pasajero']))
            ->getJson('/api/v1/admin/metrics/weekly')
            ->assertStatus(403);
    }
}
