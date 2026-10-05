<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

function resetear(string $correo, string $codigo)
{
    return test()->postJson('/api/v1/auth/reset-password', [
        'email' => $correo,
        'code' => $codigo,
        'password' => 'NuevaClave123!',
    ]);
}

test('5 codigos incorrectos invalidan el codigo de recuperacion', function () {
    $correo = 'fuerza.bruta@unab.edu.co';
    Cache::put('password_reset_'.$correo, '123456', now()->addMinutes(15));

    foreach (range(1, 4) as $i) {
        resetear($correo, '00000'.$i)->assertStatus(422)
            ->assertJsonPath('message', 'El código de verificación es inválido o ha expirado.');
    }
    resetear($correo, '000005')->assertStatus(422)
        ->assertJsonPath('message', 'Demasiados intentos. Solicita un código nuevo.');

    expect(Cache::get('password_reset_'.$correo))->toBeNull();

    // El throttle por minuto no es lo que bloquea: aun sin él, el código correcto ya no sirve.
    $this->travel(61)->seconds();
    resetear($correo, '123456')->assertStatus(422);
});
