<?php

use App\Models\Institution;
use App\Models\User;
use App\Models\UserWallet;
use App\Models\WalletTransaction;
use App\Services\JwtService;
use App\Services\WompiService;
use Database\Seeders\InstitutionSeeder;
use Database\Seeders\RoleSeeder;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(InstitutionSeeder::class);
    $this->seed(RoleSeeder::class);

    config([
        'services.wompi.public_key' => 'pub_test_fake',
        'services.wompi.integrity_secret' => 'integridad_de_prueba',
        'services.wompi.events_secret' => 'eventos_de_prueba',
    ]);
});

function crearUsuarioConBilletera(float $saldoInicial = 0.0): User
{
    $institution = Institution::first();

    $user = User::create([
        'name' => 'Conductor de Prueba',
        'email' => 'conductor.wallet.'.Str::random(6).'@unab.edu.co',
        'id_document_number' => (string) random_int(10000000, 99999999),
        'id_document_type' => 'CC',
        'phone_number' => '3'.random_int(100000000, 999999999),
        'institution_id' => $institution->id,
        'member_type' => 'estudiante',
        'academic_program_or_department' => 'Ingeniería',
        'password' => bcrypt('Clave1234!'),
        'is_driver' => true,
        'is_active' => true,
        'email_verified_at' => now(),
        'verification_expires_at' => now()->addMonths(6),
    ]);
    $user->assignRole('conductor');

    UserWallet::create(['user_id' => $user->id, 'balance_cop' => $saldoInicial]);

    return $user;
}

function tokenDeServicioTest(string $nombreServicio = 'trip-service'): string
{
    $ahora = time();

    return JWT::encode([
        'iss' => 'uniwheels-'.$nombreServicio,
        'sub' => $nombreServicio,
        'type' => 'service',
        'jti' => (string) Str::uuid(),
        'iat' => $ahora,
        'exp' => $ahora + 60,
    ], config('jwt.secret'), config('jwt.algo'));
}

test('un usuario autenticado puede iniciar una recarga y recibe los parámetros del widget de Wompi', function () {
    $user = crearUsuarioConBilletera();
    $token = app(JwtService::class)->issue($user);

    $response = $this->withToken($token)->postJson('/api/v1/wallet/recharge/init', ['amount_cop' => 20000]);

    $response->assertStatus(200)
        ->assertJsonPath('data.public_key', 'pub_test_fake')
        ->assertJsonPath('data.amount_in_cents', 2000000)
        ->assertJsonStructure(['data' => ['reference', 'signature', 'currency']]);

    $data = $response->json('data');
    expect($data['reference'])->toStartWith('WR-'.$user->id);
});

test('rechaza iniciar una recarga por debajo del monto mínimo', function () {
    $user = crearUsuarioConBilletera();
    $token = app(JwtService::class)->issue($user);

    $this->withToken($token)
        ->postJson('/api/v1/wallet/recharge/init', ['amount_cop' => 100])
        ->assertStatus(422);
});

test('el endpoint de credit solo puede ser invocado con un token de servicio, nunca por un usuario', function () {
    $user = crearUsuarioConBilletera();
    $token = app(JwtService::class)->issue($user);

    $this->withToken($token)
        ->postJson('/api/v1/wallet/credit', ['user_id' => $user->id, 'amount_cop' => 1000])
        ->assertStatus(403);
});

test('trip-service puede acreditar la ganancia de un conductor vía servicio', function () {
    $user = crearUsuarioConBilletera(5000.0);

    $response = $this->withToken(tokenDeServicioTest())
        ->postJson('/api/v1/wallet/credit', [
            'user_id' => $user->id,
            'amount_cop' => 4400,
            'reference' => 'trip:abc123',
        ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('user_wallets', ['user_id' => $user->id, 'balance_cop' => 9400.00]);
    $this->assertDatabaseHas('wallet_transactions', [
        'reference_id' => 'trip:abc123',
        'transaction_type' => 'pago_recibido_billetera',
    ]);
});

test('trip-service puede debitar la comision de un conductor y bloquear la billetera si excede la deuda maxima', function () {
    $user = crearUsuarioConBilletera(-4000.0);

    $response = $this->withToken(tokenDeServicioTest())
        ->postJson('/api/v1/wallet/debit-commission', [
            'user_id' => $user->id,
            'amount_cop' => 2000,
            'trip_id' => 'trip-xyz',
        ]);

    $response->assertStatus(200)->assertJsonPath('data.wallet_locked', true);

    $this->assertDatabaseHas('user_wallets', ['user_id' => $user->id, 'balance_cop' => -6000.00, 'is_locked' => true]);
});

use App\Models\WompiWebhookEvent;
use Illuminate\Database\UniqueConstraintViolationException;

test('el webhook de wompi rechaza eventos con firma invalida pero persiste el evento para auditoria', function () {
    $this->postJson('/api/v1/webhooks/wompi', [
        'timestamp' => time(),
        'signature' => ['checksum' => 'firma-falsa', 'properties' => ['transaction.id']],
        'data' => ['transaction' => ['id' => 'x', 'reference' => 'WR-fake', 'status' => 'APPROVED']],
    ])->assertStatus(403);

    $this->assertDatabaseHas('wompi_webhook_events', [
        'reference' => 'WR-fake',
        'signature_valid' => false,
    ]);
});

test('el webhook de wompi acredita el saldo cuando la firma es valida y la recarga fue aprobada, y persiste el evento procesado', function () {
    $user = crearUsuarioConBilletera(0.0);
    $referencia = 'WR-'.$user->id.'-20260101000000-abc123';

    $payload = buildWompiWebhookPayload($referencia, 15000, 'APPROVED');

    $response = $this->postJson('/api/v1/webhooks/wompi', $payload);

    $response->assertStatus(200);
    $this->assertDatabaseHas('user_wallets', ['user_id' => $user->id, 'balance_cop' => 15000.00]);
    $this->assertDatabaseHas('wallet_transactions', ['reference_id' => $referencia, 'transaction_type' => 'recarga_tarjeta']);
    $this->assertDatabaseHas('wompi_webhook_events', [
        'reference' => $referencia,
        'status' => 'APPROVED',
        'signature_valid' => true,
        'processed' => true,
    ]);
});

test('el webhook de wompi es idempotente: no acredita dos veces la misma referencia', function () {
    $user = crearUsuarioConBilletera(0.0);
    $referencia = 'WR-'.$user->id.'-20260101000000-abc123';
    $payload = buildWompiWebhookPayload($referencia, 15000, 'APPROVED');

    $this->postJson('/api/v1/webhooks/wompi', $payload)->assertStatus(200);
    $this->postJson('/api/v1/webhooks/wompi', $payload)->assertStatus(200);

    $this->assertDatabaseHas('user_wallets', ['user_id' => $user->id, 'balance_cop' => 15000.00]);
    expect(WalletTransaction::where('reference_id', $referencia)->count())->toBe(1);
    expect(WompiWebhookEvent::where('reference', $referencia)->count())->toBe(2);
});

test('la base de datos rechaza duplicados de reference_id gracias a la restriccion unique', function () {
    $user = crearUsuarioConBilletera(0.0);
    $referencia = 'WR-'.$user->id.'-20260101000000-unique-test';

    WalletTransaction::create([
        'wallet_id' => $user->wallet->id,
        'transaction_type' => 'recarga_tarjeta',
        'amount_cop' => 10000.00,
        'balance_before_cop' => 0.00,
        'balance_after_cop' => 10000.00,
        'reference_id' => $referencia,
        'status' => 'completado',
    ]);

    expect(function () use ($user, $referencia) {
        WalletTransaction::create([
            'wallet_id' => $user->wallet->id,
            'transaction_type' => 'recarga_tarjeta',
            'amount_cop' => 10000.00,
            'balance_before_cop' => 10000.00,
            'balance_after_cop' => 20000.00,
            'reference_id' => $referencia,
            'status' => 'completado',
        ]);
    })->toThrow(UniqueConstraintViolationException::class);
});

test('el webhook de wompi persiste eventos no aprobados sin acreditar saldo', function () {
    $user = crearUsuarioConBilletera(0.0);
    $referencia = 'WR-'.$user->id.'-20260101000000-abc123';
    $payload = buildWompiWebhookPayload($referencia, 15000, 'DECLINED');

    $this->postJson('/api/v1/webhooks/wompi', $payload)->assertStatus(200);

    $this->assertDatabaseHas('user_wallets', ['user_id' => $user->id, 'balance_cop' => 0.00]);
    $this->assertDatabaseHas('wompi_webhook_events', [
        'reference' => $referencia,
        'status' => 'DECLINED',
        'signature_valid' => true,
    ]);
});

function buildWompiWebhookPayload(string $referencia, int $montoCop, string $estado): array
{
    $data = [
        'transaction' => [
            'id' => 'tr_'.Str::random(8),
            'reference' => $referencia,
            'status' => $estado,
            'amount_in_cents' => $montoCop * 100,
        ],
    ];
    $timestamp = time();
    $propiedades = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'];

    $wompi = app(WompiService::class);
    $reflexion = new ReflectionClass($wompi);
    $metodo = $reflexion->getMethod('resolverValorPorRuta');
    $metodo->setAccessible(true);

    $cadena = '';
    foreach ($propiedades as $ruta) {
        $cadena .= (string) $metodo->invoke($wompi, $data, $ruta);
    }
    $cadena .= $timestamp.config('services.wompi.events_secret');

    return [
        'data' => $data,
        'timestamp' => $timestamp,
        'signature' => [
            'checksum' => hash('sha256', $cadena),
            'properties' => $propiedades,
        ],
    ];
}
