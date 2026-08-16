<?php

namespace Tests\Feature;

use App\Models\Route;
use App\Services\PostGisSpatialRepository;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SpatialMatchingTest extends TestCase
{
    use RefreshDatabase;

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

    public function test_un_pasajero_en_el_corredor_vial_empareja_en_modalidad_1(): void
    {
        $driverId = (string) Str::uuid();
        $vehicleId = (string) Str::uuid();

        // Crear ruta activa
        $ruta = Route::create([
            'driver_id' => $driverId,
            'vehicle_id' => $vehicleId,
            'origin_name' => 'Cañaveral',
            'destination_campus_id' => 1,
            'destination_campus_name' => 'Campus El Jardín',
            'scheduled_departure_time' => Carbon::tomorrow()->setHour(6)->setMinute(45),
            'target_arrival_time' => Carbon::tomorrow()->setHour(7)->setMinute(30),
            'estimated_duration_minutes' => 25.0,
            'max_detour_minutes' => 15,
            'accumulated_detour_minutes' => 0.0,
            'available_seats' => 3,
            'base_contribution_cop' => 4500,
            'status' => 'publicada',
        ]);

        // Guardar geometría nativa
        $repo = app(PostGisSpatialRepository::class);
        $repo->saveRouteGeometry(
            $ruta->id,
            [
                [7.0678, -73.1066], // Cañaveral
                [7.0856, -73.1142], // Provenza
                [7.1023, -73.1185], // Puerta del Sol
                [7.1165, -73.1054], // Campus El Jardín
            ],
            [7.0678, -73.1066],
            [7.1165, -73.1054]
        );

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

    public function test_un_pasajero_fuera_de_ruta_empareja_en_modalidad_2_con_ia(): void
    {
        $driverId = (string) Str::uuid();
        $vehicleId = (string) Str::uuid();

        $ruta = Route::create([
            'driver_id' => $driverId,
            'vehicle_id' => $vehicleId,
            'origin_name' => 'Cañaveral',
            'destination_campus_id' => 1,
            'destination_campus_name' => 'Campus El Jardín',
            'scheduled_departure_time' => Carbon::tomorrow()->setHour(6)->setMinute(45),
            'target_arrival_time' => Carbon::tomorrow()->setHour(7)->setMinute(30),
            'estimated_duration_minutes' => 20.0,
            'max_detour_minutes' => 15,
            'accumulated_detour_minutes' => 0.0,
            'available_seats' => 2,
            'base_contribution_cop' => 4500,
            'status' => 'publicada',
        ]);

        $repo = app(PostGisSpatialRepository::class);
        $repo->saveRouteGeometry(
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

        $repo = app(PostGisSpatialRepository::class);
        $repo->saveRouteGeometry(
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

    public function test_puede_evaluar_el_desvio_detallado_de_una_ruta_especifica(): void
    {
        $driverId = (string) Str::uuid();
        $vehicleId = (string) Str::uuid();

        $ruta = Route::create([
            'driver_id' => $driverId,
            'vehicle_id' => $vehicleId,
            'origin_name' => 'Cañaveral',
            'destination_campus_id' => 1,
            'destination_campus_name' => 'Campus El Jardín',
            'scheduled_departure_time' => Carbon::tomorrow()->setHour(6)->setMinute(45),
            'target_arrival_time' => Carbon::tomorrow()->setHour(7)->setMinute(30),
            'estimated_duration_minutes' => 25.0,
            'max_detour_minutes' => 15,
            'accumulated_detour_minutes' => 0.0,
            'available_seats' => 3,
            'base_contribution_cop' => 4500,
            'status' => 'publicada',
        ]);

        $repo = app(PostGisSpatialRepository::class);
        $repo->saveRouteGeometry(
            $ruta->id,
            [
                [7.0678, -73.1066],
                [7.1023, -73.1185],
                [7.1165, -73.1054],
            ],
            [7.0678, -73.1066],
            [7.1165, -73.1054]
        );

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
}
