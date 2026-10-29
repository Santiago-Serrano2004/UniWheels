<?php

namespace Tests\Feature;

use App\Models\Route;
use App\Models\SearchLog;
use App\Services\PilotMetrics;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Métricas del piloto: registro de búsquedas (search_logs) y endpoints agregados.
 */
class PilotMetricsTest extends TestCase
{
    use RefreshDatabase;

    private const BUSQUEDA = ['pickup_lat' => 7.0856, 'pickup_lng' => -73.1142, 'destination_campus_id' => 1];

    private function lunesActual(): CarbonImmutable
    {
        return CarbonImmutable::now('America/Bogota')->startOfWeek();
    }

    private function sembrarLog(string $pasajero, int $resultados, CarbonImmutable $cuando): void
    {
        SearchLog::create([
            'passenger_id' => $pasajero,
            'results_count' => $resultados,
            'modality_1_count' => $resultados,
            'modality_2_count' => 0,
            'created_at' => $cuando->utc(),
        ]);
    }

    private function sembrarRuta(string $conductor, CarbonImmutable $cuando): void
    {
        $salida = Carbon::now()->addDay();
        $ruta = Route::create([
            'driver_id' => $conductor,
            'vehicle_id' => (string) Str::uuid(),
            'origin_name' => 'Cañaveral',
            'destination_campus_id' => 1,
            'destination_campus_name' => 'Campus El Jardín',
            'scheduled_departure_time' => $salida,
            'target_arrival_time' => $salida->copy()->addMinutes(45),
            'estimated_duration_minutes' => 25.0,
            'max_detour_minutes' => 15,
            'accumulated_detour_minutes' => 0.0,
            'available_seats' => 3,
            'base_contribution_cop' => 4500,
            'status' => 'publicada',
        ]);
        Route::whereKey($ruta->id)->update(['created_at' => $cuando->utc()]);
    }

    private function tokenDeServicio(): string
    {
        $ahora = time();

        return JWT::encode([
            'iss' => 'uniwheels-auth-service',
            'sub' => 'trip-service',
            'type' => 'service',
            'jti' => (string) Str::uuid(),
            'iat' => $ahora,
            'exp' => $ahora + 60,
        ], config('jwt.secret'), config('jwt.algo'));
    }

    public function test_una_busqueda_registra_un_log(): void
    {
        Http::fake();
        $pasajero = (string) Str::uuid();

        $this->withToken($this->jwtDePrueba($pasajero))
            ->postJson('/api/v1/routes/search-match', self::BUSQUEDA)
            ->assertOk();

        $this->assertSame(1, SearchLog::count());
        $log = SearchLog::first();
        $this->assertSame($pasajero, $log->passenger_id);
        $this->assertSame(0, $log->results_count);
    }

    public function test_un_error_al_registrar_el_log_no_rompe_la_busqueda(): void
    {
        Http::fake();
        SearchLog::creating(function () {
            throw new \RuntimeException('fallo simulado');
        });

        $this->withToken($this->jwtDePrueba((string) Str::uuid()))
            ->postJson('/api/v1/routes/search-match', self::BUSQUEDA)
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSame(0, SearchLog::count());
    }

    public function test_el_endpoint_agrega_dos_semanas_de_datos_sembrados(): void
    {
        $lunes = $this->lunesActual();
        $anterior = $lunes->subWeek();
        [$a, $b, $c] = [(string) Str::uuid(), (string) Str::uuid(), (string) Str::uuid()];

        // Semana anterior: 2 búsquedas (1 con resultado). Una cae el domingo 23:30 en Colombia,
        // que en UTC ya es lunes: debe contar en la semana anterior.
        $this->sembrarLog($a, 2, $anterior->addDays(2)->setTime(12, 0));
        $this->sembrarLog($b, 0, $lunes->subMinutes(30));

        // Semana actual: 3 búsquedas (2 con resultado), 1 conductor que publica; el conductor
        // $c también buscó, así que cuenta una sola vez como activo.
        $this->sembrarLog($a, 1, $lunes->setTime(0, 30));
        $this->sembrarLog($a, 3, $lunes->addHours(10));
        $this->sembrarLog($c, 0, $lunes->addHours(11));
        $this->sembrarRuta($c, $lunes->addHours(12));

        $admin = $this->jwtDePrueba((string) Str::uuid(), ['administrador']);
        $semanas = $this->withToken($admin)->getJson('/api/v1/admin/metrics/weekly?weeks=12')
            ->assertOk()
            ->json('data');

        $this->assertCount(12, $semanas);
        $porSemana = collect($semanas)->keyBy('week_start');

        $this->assertSame([
            'week_start' => $anterior->toDateString(),
            'searches' => 2,
            'searches_with_results' => 1,
            'hit_rate' => 0.5,
            'publishing_drivers' => 0,
            'active_users' => 2,
        ], $porSemana[$anterior->toDateString()]);

        $this->assertSame([
            'week_start' => $lunes->toDateString(),
            'searches' => 3,
            'searches_with_results' => 2,
            'hit_rate' => 0.6667,
            'publishing_drivers' => 1,
            'active_users' => 2,
        ], $porSemana[$lunes->toDateString()]);

        // Una semana sin datos no inventa tasa.
        $vacia = $semanas[0];
        $this->assertSame(0, $vacia['searches']);
        $this->assertNull($vacia['hit_rate']);
    }

    public function test_el_endpoint_admin_no_expone_ids_de_usuario(): void
    {
        $pasajero = (string) Str::uuid();
        $this->sembrarLog($pasajero, 1, $this->lunesActual()->addHours(9));

        $cuerpo = $this->withToken($this->jwtDePrueba((string) Str::uuid(), ['administrador']))
            ->getJson('/api/v1/admin/metrics/weekly')
            ->assertOk()
            ->getContent();

        $this->assertStringNotContainsString($pasajero, $cuerpo);
        $this->assertStringNotContainsString('hash', $cuerpo);
    }

    public function test_un_usuario_que_no_es_admin_recibe_403(): void
    {
        $this->withToken($this->jwtDePrueba((string) Str::uuid(), ['pasajero']))
            ->getJson('/api/v1/admin/metrics/weekly')
            ->assertStatus(403);
    }

    public function test_el_endpoint_interno_devuelve_hashes_y_exige_token_de_servicio(): void
    {
        $pasajero = (string) Str::uuid();
        $lunes = $this->lunesActual();
        $this->sembrarLog($pasajero, 1, $lunes->addHours(9));

        $this->withToken($this->jwtDePrueba((string) Str::uuid(), ['administrador']))
            ->getJson('/api/v1/internal/metrics/weekly-active-users')
            ->assertStatus(403);

        $respuesta = $this->withToken($this->tokenDeServicio())
            ->getJson('/api/v1/internal/metrics/weekly-active-users?weeks=12')
            ->assertOk();

        $hash = hash_hmac('sha256', $pasajero, PilotMetrics::hashKey());
        $this->assertSame([$hash], $respuesta->json('data.'.$lunes->toDateString()));
        $this->assertStringNotContainsString($pasajero, $respuesta->getContent());
    }

    public function test_weeks_fuera_de_rango_es_422(): void
    {
        $this->withToken($this->jwtDePrueba((string) Str::uuid(), ['administrador']))
            ->getJson('/api/v1/admin/metrics/weekly?weeks=500')
            ->assertStatus(422);
    }
}
