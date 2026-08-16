<?php

namespace Tests\Feature;

use App\Models\Route;
use App\Services\OsrmRoutingService;
use App\Services\PostGisSpatialRepository;
use App\Services\SpatialMatchingService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Suite de Pruebas Exhaustivas para el Motor de IA y Optimización Geoespacial
 * 
 * Evalúa operaciones espaciales PostGIS, podas GiST, ruteo topológico OSRM,
 * algoritmos de desvío de Modalidad 1 y 2, factores de tráfico en horas pico,
 * restricciones duras de puntualidad universitaria y desglose de tarifas.
 */
class SpatialMatchingTest extends TestCase
{
    use RefreshDatabase;

    protected PostGisSpatialRepository $spatialRepo;
    protected SpatialMatchingService $matchingService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->spatialRepo = app(PostGisSpatialRepository::class);
        $this->matchingService = app(SpatialMatchingService::class);
    }

    /**
     * 1. Publicación de ruta con indexación nativa PostGIS
     */
    public function test_un_conductor_puede_publicar_una_ruta_con_geometria_postgis(): void
    {
        $driverId = (string) Str::uuid();
        $vehicleId = (string) Str::uuid();

        $payload = [
            'driver_id' => $driverId,
            'vehicle_id' => $vehicleId,
            'origin_name' => 'C.C. Cañaveral (Floridablanca)',
            'origin_lat' => 7.0678,
            'origin_lng' => -73.1066,
            'destination_campus_id' => 1,
            'destination_campus_name' => 'Campus El Jardín',
            'destination_lat' => 7.1165,
            'destination_lng' => -73.1054,
            'scheduled_departure_time' => Carbon::tomorrow()->setHour(6)->setMinute(45)->toISOString(),
            'target_arrival_time' => Carbon::tomorrow()->setHour(7)->setMinute(30)->toISOString(),
            'available_seats' => 3,
            'base_contribution_cop' => 4500,
            'max_detour_minutes' => 12,
            'coordinates' => [
                [7.0678, -73.1066], // Cañaveral
                [7.0856, -73.1142], // Provenza
                [7.1023, -73.1185], // Puerta del Sol
                [7.1145, -73.1100], // Carrera 33
                [7.1165, -73.1054], // Campus El Jardín
            ],
        ];

        $response = $this->postJson('/api/v1/routes', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Ruta publicada exitosamente con indexación espacial PostGIS.',
            ])
            ->assertJsonPath('data.origin_name', 'C.C. Cañaveral (Floridablanca)')
            ->assertJsonPath('data.available_seats', 3);

        $this->assertDatabaseHas('routes', [
            'origin_name' => 'C.C. Cañaveral (Floridablanca)',
            'driver_id' => $driverId,
        ]);
    }

    /**
     * 2. Modalidad 1: Match en ruta directo (distancia <= 300m, 0 min desvío)
     */
    public function test_un_pasajero_en_el_corredor_vial_empareja_en_modalidad_1(): void
    {
        $ruta = $this->crearRutaBase('Cañaveral', 6, 45, 7, 30, 25.0, 4500);

        // Pasajero busca en Provenza (sobre la misma vía, distancia < 100m)
        $payloadBusqueda = [
            'pickup_lat' => 7.0856,
            'pickup_lng' => -73.1142,
            'destination_campus_id' => 1,
        ];

        $response = $this->postJson('/api/v1/routes/search-match', $payloadBusqueda);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonPath('data.0.modality', 'modalidad_1_directa')
            ->assertJsonPath('data.0.suggested_fare_cop', 4500);
    }

    /**
     * 3. Modalidad 2: Desvío asistido por IA (distancia > 300m y factible)
     */
    public function test_un_pasajero_fuera_de_ruta_empareja_en_modalidad_2_con_ia(): void
    {
        $ruta = $this->crearRutaBase('Cañaveral', 6, 45, 7, 30, 20.0, 4500);

        // Pasajero en Parque San Pío (desviado ~450 metros de Carrera 33)
        $payloadBusqueda = [
            'pickup_lat' => 7.1186,
            'pickup_lng' => -73.1102,
            'destination_campus_id' => 1,
        ];

        $response = $this->postJson('/api/v1/routes/search-match', $payloadBusqueda);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonPath('data.0.modality', 'modalidad_2_desvio')
            ->assertJsonPath('data.0.is_viable', true);
    }

    /**
     * 4. Poda de sentido de circulación: Rechaza si el pasajero está detrás del inicio
     */
    public function test_rechaza_emparejamiento_si_el_pasajero_esta_en_sentido_contrario(): void
    {
        $driverId = (string) Str::uuid();
        $vehicleId = (string) Str::uuid();

        $ruta = Route::create([
            'driver_id' => $driverId,
            'vehicle_id' => $vehicleId,
            'origin_name' => 'Puerta del Sol',
            'destination_campus_id' => 1,
            'destination_campus_name' => 'Campus El Jardín',
            'scheduled_departure_time' => Carbon::tomorrow()->setHour(7)->setMinute(0),
            'target_arrival_time' => Carbon::tomorrow()->setHour(7)->setMinute(45),
            'estimated_duration_minutes' => 18.0,
            'max_detour_minutes' => 10,
            'accumulated_detour_minutes' => 0.0,
            'available_seats' => 2,
            'base_contribution_cop' => 4000,
            'status' => 'publicada',
        ]);

        $this->spatialRepo->saveRouteGeometry(
            $ruta->id,
            [
                [7.1023, -73.1185], // Puerta del Sol
                [7.1145, -73.1100], // Carrera 33
                [7.1165, -73.1054], // Campus El Jardín
            ],
            [7.1023, -73.1185],
            [7.1165, -73.1054]
        );

        // Pasajero en Piedecuesta (muy lejos y detrás del punto de inicio)
        $payloadBusqueda = [
            'pickup_lat' => 6.9875,
            'pickup_lng' => -73.0498,
            'destination_campus_id' => 1,
        ];

        $response = $this->postJson('/api/v1/routes/search-match', $payloadBusqueda);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'total_matches' => 0,
                'data' => [],
            ]);
    }

    /**
     * 5. Restricción Dura: Rechaza desvío si excede el umbral máximo de retraso (p. ej. > 15 min)
     */
    public function test_rechaza_desvio_si_el_retraso_acumulado_supera_el_umbral_maximo(): void
    {
        $ruta = $this->crearRutaBase('Cañaveral', 6, 45, 7, 30, 20.0, 4500, 15, 12.5); // Ya tiene 12.5 min de desvío acumulado

        // Solicitar un desvío que requiere 5 minutos adicionales de viaje (+ 2 min abordaje = 7 min) -> 12.5 + 7 = 19.5 > 15
        $evaluacion = $this->matchingService->evaluateDetour(
            $ruta,
            7.1186,
            -73.1102,
            5.0 // 5 min de viaje
        );

        $this->assertFalse($evaluacion['is_viable']);
        $this->assertStringContainsString('excede el umbral máximo', $evaluacion['rejection_reason']);
    }

    /**
     * 6. Restricción Dura: Rechaza desvío si causaría que el conductor llegue tarde a clase
     */
    public function test_rechaza_desvio_si_el_conductor_llegaria_tarde_a_su_hora_limite(): void
    {
        // Salida 6:45 AM, duración 25 min (Llegada base 7:10 AM), Hora límite muy ajustada: 7:15 AM (solo 5 min de holgura)
        $ruta = $this->crearRutaBase('Cañaveral', 6, 45, 7, 15, 25.0, 4500, 15, 0.0);

        // Desvío de 6 minutos de viaje (+ 2 min abordaje = 8 min) -> Llegaría a las 7:18 AM (> 7:15 AM)
        $evaluacion = $this->matchingService->evaluateDetour(
            $ruta,
            7.1186,
            -73.1102,
            6.0
        );

        $this->assertFalse($evaluacion['is_viable']);
        $this->assertStringContainsString('llegue después de su hora límite', $evaluacion['rejection_reason']);
    }

    /**
     * 7. Simulación de Múltiples Pasajeros Secuenciales (Acumulación progresiva de desvíos)
     */
    public function test_acumulacion_secuencial_de_desvios_con_multiples_pasajeros(): void
    {
        $ruta = $this->crearRutaBase('Cañaveral', 6, 30, 7, 30, 25.0, 4500, 15, 0.0);

        // Pasajero 1: Requiere 3 min de viaje (+ 2 min abordaje = 5 min). Acumulado: 5 min
        $evalP1 = $this->matchingService->evaluateDetour($ruta, 7.0856, -73.1142, 3.0);
        $this->assertTrue($evalP1['is_viable']);
        $this->assertEquals(5.0, $evalP1['detour_minutes']);
        $this->assertEquals(5.0, $evalP1['new_accumulated_detour']);

        // Se acepta P1 y se actualiza la ruta
        $ruta->accumulated_detour_minutes = 5.0;
        $ruta->save();

        // Pasajero 2: Requiere 4 min de viaje (+ 2 min abordaje = 6 min). Acumulado: 5 + 6 = 11 min <= 15 min
        $evalP2 = $this->matchingService->evaluateDetour($ruta, 7.1023, -73.1185, 4.0);
        $this->assertTrue($evalP2['is_viable']);
        $this->assertEquals(11.0, $evalP2['new_accumulated_detour']);

        // Se acepta P2
        $ruta->accumulated_detour_minutes = 11.0;
        $ruta->save();

        // Pasajero 3: Requiere 5 min de viaje (+ 2 min abordaje = 7 min). Acumulado: 11 + 7 = 18 min > 15 min -> RECHAZADO
        $evalP3 = $this->matchingService->evaluateDetour($ruta, 7.1186, -73.1102, 5.0);
        $this->assertFalse($evalP3['is_viable']);
    }

    /**
     * 8. Impacto de Tráfico Horario: Factor de congestión en horas pico
     */
    public function test_aplica_multiplicador_de_trafico_en_horas_pico_manana_y_tarde(): void
    {
        // Ruta en hora pico mañana (07:15 AM -> multiplicador 1.25)
        $rutaManana = $this->crearRutaBase('Cañaveral', 7, 15, 8, 15, 20.0, 4500);
        $evalManana = $this->matchingService->evaluateRouteDetourForPassenger($rutaManana, 7.1186, -73.1102);

        // Ruta en hora valle (10:00 AM -> multiplicador 1.05)
        $rutaValle = $this->crearRutaBase('Cañaveral', 10, 0, 11, 0, 20.0, 4500);
        $evalValle = $this->matchingService->evaluateRouteDetourForPassenger($rutaValle, 7.1186, -73.1102);

        $this->assertTrue($evalManana['is_viable']);
        $this->assertTrue($evalValle['is_viable']);

        // El desvío en hora pico mañana debe ser mayor que en hora valle para el mismo punto
        $this->assertGreaterThan($evalValle['detour_minutes'], $evalManana['detour_minutes']);
    }

    /**
     * 9. Disponibilidad de Cupos: No sugiere rutas con cupos agotados (available_seats = 0)
     */
    public function test_no_sugiere_rutas_con_cupos_agotados(): void
    {
        $rutaSinCupos = $this->crearRutaBase('Cañaveral', 6, 45, 7, 30, 25.0, 4500, 15, 0.0);
        $rutaSinCupos->available_seats = 0; // Sin cupos
        $rutaSinCupos->save();

        $payloadBusqueda = [
            'pickup_lat' => 7.0856,
            'pickup_lng' => -73.1142,
            'destination_campus_id' => 1,
        ];

        $response = $this->postJson('/api/v1/routes/search-match', $payloadBusqueda);

        $response->assertStatus(200)
            ->assertJsonPath('total_matches', 0)
            ->assertJsonPath('data', []);
    }

    /**
     * 10. Estado de la Ruta: No sugiere rutas canceladas o finalizadas
     */
    public function test_no_sugiere_rutas_canceladas_o_finalizadas(): void
    {
        $rutaCancelada = $this->crearRutaBase('Cañaveral', 6, 45, 7, 30, 25.0, 4500);
        $rutaCancelada->status = 'cancelada';
        $rutaCancelada->save();

        $payloadBusqueda = [
            'pickup_lat' => 7.0856,
            'pickup_lng' => -73.1142,
            'destination_campus_id' => 1,
        ];

        $response = $this->postJson('/api/v1/routes/search-match', $payloadBusqueda);

        $response->assertStatus(200)
            ->assertJsonPath('total_matches', 0);
    }

    /**
     * 11. Desglose Tarifario Matemático Exacto ($ Base + $300 COP / min de desvío)
     */
    public function test_calculo_exacto_del_desglose_tarifario_con_recargo_por_minuto(): void
    {
        $ruta = $this->crearRutaBase('Cañaveral', 6, 45, 7, 30, 20.0, 4000); // Tarifa base: $ 4.000 COP

        // Desvío de viaje de 4.0 minutos (+ 2.0 min abordaje = 6.0 min total)
        // Recargo económico = 4.0 min viaje * $300 COP = $ 1.200 COP
        // Tarifa total = $ 4.000 + $ 1.200 = $ 5.200 COP
        $evaluacion = $this->matchingService->evaluateDetour($ruta, 7.1186, -73.1102, 4.0);

        $this->assertTrue($evaluacion['is_viable']);
        $this->assertEquals(4000.0, $evaluacion['base_fare_cop']);
        $this->assertEquals(1200.0, $evaluacion['detour_extra_fee_cop']);
        $this->assertEquals(5200.0, $evaluacion['total_suggested_fare_cop']);
    }

    /**
     * 12. Endpoint de Detalle y Evaluación Específica (/routes/{id}/evaluate-detour)
     */
    public function test_puede_evaluar_el_desvio_detallado_de_una_ruta_especifica(): void
    {
        $ruta = $this->crearRutaBase('Cañaveral', 6, 45, 7, 30, 25.0, 4500);

        $response = $this->postJson("/api/v1/routes/{$ruta->id}/evaluate-detour", [
            'pickup_lat' => 7.1186,
            'pickup_lng' => -73.1102,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonPath('data.is_viable', true)
            ->assertJsonStructure([
                'data' => [
                    'is_viable',
                    'detour_minutes',
                    'total_suggested_fare_cop',
                    'estimated_arrival_time',
                ],
            ]);
    }

    /**
     * Helper para crear rutas con geometría en tests
     */
    protected function crearRutaBase(
        string $originName,
        int $depHour,
        int $depMinute,
        int $arrHour,
        int $arrMinute,
        float $durationMin = 20.0,
        float $baseFareCop = 4500.0,
        int $maxDetourMin = 15,
        float $accumDetourMin = 0.0
    ): Route {
        $driverId = (string) Str::uuid();
        $vehicleId = (string) Str::uuid();

        $ruta = Route::create([
            'driver_id' => $driverId,
            'vehicle_id' => $vehicleId,
            'origin_name' => $originName,
            'destination_campus_id' => 1,
            'destination_campus_name' => 'Campus El Jardín',
            'scheduled_departure_time' => Carbon::tomorrow()->setHour($depHour)->setMinute($depMinute),
            'target_arrival_time' => Carbon::tomorrow()->setHour($arrHour)->setMinute($arrMinute),
            'estimated_duration_minutes' => $durationMin,
            'max_detour_minutes' => $maxDetourMin,
            'accumulated_detour_minutes' => $accumDetourMin,
            'available_seats' => 3,
            'base_contribution_cop' => $baseFareCop,
            'status' => 'publicada',
        ]);

        $this->spatialRepo->saveRouteGeometry(
            $ruta->id,
            [
                [7.0678, -73.1066], // Cañaveral
                [7.0856, -73.1142], // Provenza
                [7.1023, -73.1185], // Puerta del Sol
                [7.1145, -73.1100], // Carrera 33
                [7.1165, -73.1054], // Campus El Jardín
            ],
            [7.0678, -73.1066],
            [7.1165, -73.1054]
        );

        return $ruta;
    }
}
