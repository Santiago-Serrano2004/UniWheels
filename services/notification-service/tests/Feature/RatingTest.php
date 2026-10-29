<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class RatingTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Simula trip-service (participantes del viaje) y auth-service (reputación).
     */
    private function fakeViaje(string $tripId, string $driverId, string $passengerId, string $status = 'completado'): void
    {
        Http::fake([
            '*/api/v1/internal/trips/*' => Http::response(['success' => true, 'data' => [
                'id' => $tripId, 'driver_id' => $driverId, 'passenger_id' => $passengerId, 'status' => $status,
            ]], 200),
            '*/api/v1/internal/users/*/reputation' => Http::response(['success' => true], 200),
        ]);
    }

    public function test_un_usuario_puede_calificar_a_otro_participante_del_viaje(): void
    {
        $rater = (string) Str::uuid();
        $rated = (string) Str::uuid();
        $tripId = (string) Str::uuid();
        $this->fakeViaje($tripId, $rated, $rater);

        $response = $this->withToken($this->jwtDePrueba($rater))->postJson('/api/v1/ratings', [
            'trip_id' => $tripId,
            'rated_user_id' => $rated,
            'role_rated' => 'conductor',
            'score' => 5,
            'optional_comment' => 'Excelente viaje.',
        ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.score', 5);

        $this->assertDatabaseHas('ratings', [
            'trip_id' => $tripId,
            'rater_user_id' => $rater,
            'rated_user_id' => $rated,
            'score' => 5,
        ]);
    }

    public function test_no_se_puede_calificar_dos_veces_el_mismo_viaje_y_usuario(): void
    {
        $rater = (string) Str::uuid();
        $rated = (string) Str::uuid();
        $tripId = (string) Str::uuid();

        $this->fakeViaje($tripId, $rated, $rater);

        $payload = [
            'trip_id' => $tripId,
            'rated_user_id' => $rated,
            'role_rated' => 'conductor',
            'score' => 5,
        ];

        $this->withToken($this->jwtDePrueba($rater))->postJson('/api/v1/ratings', $payload)
            ->assertStatus(201);

        $this->withToken($this->jwtDePrueba($rater))->postJson('/api/v1/ratings', $payload)
            ->assertStatus(409);
    }

    public function test_no_se_puede_calificar_a_si_mismo(): void
    {
        $userId = (string) Str::uuid();

        $response = $this->withToken($this->jwtDePrueba($userId))->postJson('/api/v1/ratings', [
            'trip_id' => (string) Str::uuid(),
            'rated_user_id' => $userId,
            'role_rated' => 'conductor',
            'score' => 5,
        ]);

        $response->assertStatus(422);
    }

    public function test_rechaza_un_score_fuera_de_rango(): void
    {
        $response = $this->withToken($this->jwtDePrueba((string) Str::uuid()))->postJson('/api/v1/ratings', [
            'trip_id' => (string) Str::uuid(),
            'rated_user_id' => (string) Str::uuid(),
            'role_rated' => 'conductor',
            'score' => 7,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['score']);
    }

    public function test_la_calificacion_se_reporta_a_auth_service_para_la_reputacion(): void
    {
        $conductor = (string) Str::uuid();
        $pasajero = (string) Str::uuid();
        $tripId = (string) Str::uuid();
        $this->fakeViaje($tripId, $conductor, $pasajero);

        $this->withToken($this->jwtDePrueba($pasajero))->postJson('/api/v1/ratings', [
            'trip_id' => $tripId,
            'rated_user_id' => $conductor,
            'role_rated' => 'conductor',
            'score' => 4,
        ])->assertStatus(201);

        Http::assertSent(fn ($request) => str_ends_with($request->url(), "/api/v1/internal/users/{$conductor}/reputation")
            && $request['type'] === 'rating' && $request['role'] === 'conductor' && $request['score'] === 4);
    }

    public function test_quien_no_viajo_no_puede_calificar(): void
    {
        $conductor = (string) Str::uuid();
        $pasajero = (string) Str::uuid();
        $intruso = (string) Str::uuid();
        $tripId = (string) Str::uuid();
        $this->fakeViaje($tripId, $conductor, $pasajero);

        $this->withToken($this->jwtDePrueba($intruso))->postJson('/api/v1/ratings', [
            'trip_id' => $tripId,
            'rated_user_id' => $conductor,
            'role_rated' => 'conductor',
            'score' => 1,
        ])->assertStatus(403);

        $this->assertDatabaseCount('ratings', 0);
    }

    public function test_no_se_puede_calificar_a_alguien_que_no_participo_en_el_viaje(): void
    {
        $conductor = (string) Str::uuid();
        $pasajero = (string) Str::uuid();
        $tripId = (string) Str::uuid();
        $this->fakeViaje($tripId, $conductor, $pasajero);

        $this->withToken($this->jwtDePrueba($pasajero))->postJson('/api/v1/ratings', [
            'trip_id' => $tripId,
            'rated_user_id' => (string) Str::uuid(),
            'role_rated' => 'conductor',
            'score' => 1,
        ])->assertStatus(403);
    }

    public function test_solo_se_califica_un_viaje_completado(): void
    {
        $conductor = (string) Str::uuid();
        $pasajero = (string) Str::uuid();
        $tripId = (string) Str::uuid();
        $this->fakeViaje($tripId, $conductor, $pasajero, 'en_camino');

        $this->withToken($this->jwtDePrueba($pasajero))->postJson('/api/v1/ratings', [
            'trip_id' => $tripId,
            'rated_user_id' => $conductor,
            'role_rated' => 'conductor',
            'score' => 5,
        ])->assertStatus(403);
    }

    public function test_un_viaje_inexistente_da_403_y_trip_service_caido_da_503(): void
    {
        $payload = [
            'trip_id' => (string) Str::uuid(),
            'rated_user_id' => (string) Str::uuid(),
            'role_rated' => 'conductor',
            'score' => 5,
        ];
        $token = $this->jwtDePrueba((string) Str::uuid());

        Http::fake(['*/api/v1/internal/trips/*' => Http::sequence()
            ->push(['success' => false], 404)
            ->push([], 500)]);

        $this->withToken($token)->postJson('/api/v1/ratings', $payload)->assertStatus(403);
        $this->withToken($token)->postJson('/api/v1/ratings', $payload)->assertStatus(503);
    }
}
