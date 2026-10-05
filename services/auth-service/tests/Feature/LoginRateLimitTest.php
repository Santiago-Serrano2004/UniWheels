<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function intentarLogin(string $correo, array $extra = [])
{
    return test()->postJson('/api/v1/auth/login', array_merge([
        'email' => $correo,
        'password' => 'ClaveIncorrecta1!',
    ], $extra));
}

test('el 6.º intento de login con el mismo correo en un minuto da 429', function () {
    foreach (range(1, 5) as $i) {
        intentarLogin('victima@unab.edu.co')->assertStatus(422);
    }

    intentarLogin('victima@unab.edu.co')
        ->assertStatus(429)
        ->assertJsonPath('message', 'Demasiados intentos. Espera un minuto.');
});

test('otro correo desde la misma IP sigue permitido (NAT del campus)', function () {
    foreach (range(1, 6) as $i) {
        intentarLogin('bloqueada@unab.edu.co');
    }

    intentarLogin('otra.persona@unab.edu.co')->assertStatus(422);
});
