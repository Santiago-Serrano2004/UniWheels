<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * SIM-006: un JWT mal formado (no decodificable) responde 401, nunca 500.
 */
class MalformedJwtTest extends TestCase
{
    public function test_un_bearer_mal_formado_responde_401(): void
    {
        $this->withToken('abc.def.ghi')->getJson('/api/v1/vehicles')->assertStatus(401);
    }
}
