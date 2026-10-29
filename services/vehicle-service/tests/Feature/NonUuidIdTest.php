<?php

namespace Tests\Feature;

use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * SIM-007: un id que no es UUID responde 404, nunca 500.
 */
class NonUuidIdTest extends TestCase
{
    public function test_un_id_que_no_es_uuid_responde_404(): void
    {
        $this->withToken(jwtDePrueba((string) Str::uuid(), []))
            ->getJson('/api/v1/vehicles/no-es-un-uuid')
            ->assertStatus(404);
    }
}
