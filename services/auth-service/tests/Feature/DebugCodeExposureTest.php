<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

// SIM-028: debug_code solo se devuelve con APP_ENV=local Y APP_DEBUG=true.
function pedirCodigoConEntorno(string $entorno, bool $debug): array
{
    app()['env'] = $entorno;
    config(['app.debug' => $debug]);
    Cache::flush();

    return test()->postJson('/api/v1/auth/send-verification-code', ['email' => 'debug.code@unab.edu.co'])
        ->assertOk()
        ->json('data');
}

test('en production nunca devuelve debug_code, ni con APP_DEBUG=true', function (bool $debug) {
    expect(pedirCodigoConEntorno('production', $debug)['debug_code'])->toBeNull();
})->with([true, false]);

test('en local con APP_DEBUG=false no devuelve debug_code', function () {
    expect(pedirCodigoConEntorno('local', false)['debug_code'])->toBeNull();
});

test('en local con APP_DEBUG=true devuelve el código de 6 dígitos', function () {
    expect(pedirCodigoConEntorno('local', true)['debug_code'])->toMatch('/^\d{6}$/');
});
