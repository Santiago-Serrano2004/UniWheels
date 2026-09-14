<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class RatingTest extends TestCase
{
    use RefreshDatabase;

    public function test_un_usuario_puede_calificar_a_otro_participante_del_viaje(): void
    {
        $rater = (string) Str::uuid();
        $rated = (string) Str::uuid();
        $tripId = (string) Str::uuid();

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
}
