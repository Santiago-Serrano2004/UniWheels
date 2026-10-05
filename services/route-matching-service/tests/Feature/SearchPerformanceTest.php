<?php

namespace Tests\Feature;

use App\Models\Route;
use App\Services\PostGisSpatialRepository;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * SIM-011: la búsqueda limita las candidatas, evalúa la IA en paralelo con timeout y
 * cachea la evaluación de desvío 60 s.
 */
class SearchPerformanceTest extends TestCase
{
    use RefreshDatabase;

    // ~700 m fuera del corredor: modalidad 2 (requiere IA).
    private const FUERA_DE_RUTA = ['pickup_lat' => 7.1208, 'pickup_lng' => -73.1100, 'destination_campus_id' => 1];

    // Sobre el corredor: modalidad 1 (sin IA).
    private const EN_RUTA = ['pickup_lat' => 7.0856, 'pickup_lng' => -73.1142, 'destination_campus_id' => 1];

    private function crearRutas(int $cantidad): void
    {
        for ($i = 0; $i < $cantidad; $i++) {
            $salida = Carbon::now()->addHours(2);
            $ruta = Route::create([
                'driver_id' => (string) Str::uuid(),
                'vehicle_id' => (string) Str::uuid(),
                'origin_name' => 'Cañaveral',
                'destination_campus_id' => 1,
                'destination_campus_name' => 'Campus El Jardín',
                'scheduled_departure_time' => $salida,
                'target_arrival_time' => $salida->copy()->addMinutes(60),
                'estimated_duration_minutes' => 20.0,
                'max_detour_minutes' => 15,
                'accumulated_detour_minutes' => 0.0,
                'available_seats' => 3,
                'base_contribution_cop' => 4500,
                'status' => 'publicada',
            ]);

            app(PostGisSpatialRepository::class)->saveRouteGeometry(
                $ruta->id,
                [[7.0678, -73.1066], [7.0856, -73.1142], [7.1193, -73.1042]],
                [7.0678, -73.1066],
                [7.1193, -73.1042]
            );
        }
    }

    private function buscar(array $busqueda)
    {
        return $this->withToken($this->jwtDePrueba((string) Str::uuid()))
            ->postJson('/api/v1/routes/search-match', $busqueda);
    }

    private function llamadasAIA(): int
    {
        return Http::recorded(fn (Request $request) => str_contains($request->url(), '/optimize/match'))->count();
    }

    public function test_con_30_candidatas_hace_como_maximo_20_llamadas_a_la_ia(): void
    {
        Http::fake(['*/optimize/match' => Http::response(['detour_minutes' => 6.0, 'traffic_status' => 'Fluido'], 200)]);
        $this->crearRutas(30);

        $this->buscar(self::FUERA_DE_RUTA)->assertStatus(200)->assertJsonCount(20, 'data');

        $this->assertSame(20, $this->llamadasAIA());
    }

    public function test_el_limite_de_candidatas_sale_de_la_config(): void
    {
        config(['uniwheels.match.max_candidates' => 5]);
        Http::fake(['*/optimize/match' => Http::response(['detour_minutes' => 6.0], 200)]);
        $this->crearRutas(8);

        $this->buscar(self::FUERA_DE_RUTA)->assertStatus(200)->assertJsonCount(5, 'data');
    }

    public function test_modalidad_1_no_llama_a_la_ia(): void
    {
        Http::fake(['*/optimize/match' => Http::response(['detour_minutes' => 6.0], 200)]);
        $this->crearRutas(3);

        $this->buscar(self::EN_RUTA)
            ->assertStatus(200)
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.modality', 'modalidad_1_directa');

        $this->assertSame(0, $this->llamadasAIA());
    }

    public function test_una_ia_fallida_o_lenta_no_rompe_la_busqueda(): void
    {
        Http::fake(['*/optimize/match' => Http::sequence()
            ->push(['detour_minutes' => 6.0], 200)
            ->push([], 500)
            ->pushFailedConnection('timeout'),
        ]);
        $this->crearRutas(3);

        // La candidata que responde se conserva; las que fallan o vencen se descartan.
        $this->buscar(self::FUERA_DE_RUTA)->assertStatus(200)->assertJsonCount(1, 'data');
    }

    public function test_si_la_ia_lanza_excepcion_la_busqueda_devuelve_vacio(): void
    {
        Http::fake(['*/optimize/match' => fn () => throw new ConnectionException('timeout')]);
        $this->crearRutas(2);

        $this->buscar(self::FUERA_DE_RUTA)->assertStatus(200)->assertJsonCount(0, 'data');
    }

    public function test_la_segunda_busqueda_identica_usa_la_cache(): void
    {
        Http::fake(['*/optimize/match' => Http::response(['detour_minutes' => 6.0], 200)]);
        $this->crearRutas(3);

        $primera = $this->buscar(self::FUERA_DE_RUTA)->assertStatus(200)->assertJsonCount(3, 'data');
        $this->assertSame(3, $this->llamadasAIA());

        $segunda = $this->buscar(self::FUERA_DE_RUTA)->assertStatus(200)->assertJsonCount(3, 'data');
        $this->assertSame(3, $this->llamadasAIA(), 'la segunda búsqueda no debe llamar a la IA');

        $this->assertEqualsCanonicalizing(
            collect($primera->json('data'))->pluck('route_id')->all(),
            collect($segunda->json('data'))->pluck('route_id')->all()
        );
    }
}
