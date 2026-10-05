<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function pedirCodigo(string $ruta, string $correo)
{
    return test()->postJson($ruta, ['email' => $correo]);
}

test('send-verification-code limita a 5 por minuto por correo', function () {
    foreach (range(1, 5) as $i) {
        pedirCodigo('/api/v1/auth/send-verification-code', 'misma.persona@unab.edu.co')->assertOk();
    }

    pedirCodigo('/api/v1/auth/send-verification-code', 'misma.persona@unab.edu.co')->assertStatus(429);
});

test('varias personas desde la misma IP no se bloquean entre si (NAT del campus)', function () {
    // 20 altas distintas desde una sola IP: antes eran 9 respuestas 429 (límite 5/min por IP).
    foreach (range(1, 20) as $i) {
        pedirCodigo('/api/v1/auth/send-verification-code', "estudiante{$i}@unab.edu.co")->assertOk();
    }
});

test('el limite por IP sigue frenando un abuso masivo (60 por minuto)', function () {
    foreach (range(1, 60) as $i) {
        pedirCodigo('/api/v1/auth/send-verification-code', "masivo{$i}@unab.edu.co")->assertOk();
    }

    pedirCodigo('/api/v1/auth/send-verification-code', 'masivo61@unab.edu.co')->assertStatus(429);
});

test('forgot-password usa el mismo limite por correo y por IP', function () {
    foreach (range(1, 5) as $i) {
        // El correo no existe: responde 404, pero cuenta para el límite.
        pedirCodigo('/api/v1/auth/forgot-password', 'olvido@unab.edu.co')->assertStatus(404);
    }
    pedirCodigo('/api/v1/auth/forgot-password', 'olvido@unab.edu.co')->assertStatus(429);

    // Otro correo desde la misma IP sigue pudiendo pedir su código.
    pedirCodigo('/api/v1/auth/forgot-password', 'otro@unab.edu.co')->assertStatus(404);
});
