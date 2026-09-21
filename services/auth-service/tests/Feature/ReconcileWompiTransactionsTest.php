<?php

use App\Models\Institution;
use App\Models\User;
use App\Models\UserWallet;
use App\Models\WalletTransaction;
use App\Models\WompiWebhookEvent;
use Database\Seeders\InstitutionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(InstitutionSeeder::class);
    $this->seed(RoleSeeder::class);
});

function crearUsuarioParaConciliacion(): User
{
    $institution = Institution::first();
    $user = User::create([
        'name' => 'Conductor Conciliacion',
        'email' => 'conductor.reconcile.'.Str::random(6).'@unab.edu.co',
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
    UserWallet::create(['user_id' => $user->id, 'balance_cop' => 0.0]);

    return $user;
}

test('comando de conciliacion pasa exitosamente cuando eventos wompi y transacciones coinciden', function () {
    $user = crearUsuarioParaConciliacion();
    $ref = 'WR-'.$user->id.'-20260921120000-abc123';
    $wallet = $user->wallet;

    WompiWebhookEvent::create([
        'event_type' => 'transaction.updated',
        'transaction_id' => 'tr_123456',
        'reference' => $ref,
        'status' => 'APPROVED',
        'amount_in_cents' => 2000000,
        'currency' => 'COP',
        'signature_valid' => true,
        'processed' => true,
        'processed_at' => now(),
        'payload' => ['dummy' => 'payload'],
    ]);

    WalletTransaction::create([
        'wallet_id' => $wallet->id,
        'transaction_type' => 'recarga_tarjeta',
        'amount_cop' => 20000.00,
        'balance_before_cop' => 0.00,
        'balance_after_cop' => 20000.00,
        'reference_id' => $ref,
        'status' => 'completado',
    ]);

    $this->artisan('uniwheels:reconcile-wompi --days=1')
        ->expectsOutputToContain('Conciliación completada exitosamente sin discrepancias.')
        ->assertExitCode(0);
});

test('comando de conciliacion detecta evento wompi aprobado sin transaccion acreditada', function () {
    $user = crearUsuarioParaConciliacion();
    $ref = 'WR-'.$user->id.'-20260921120000-huerfano';

    WompiWebhookEvent::create([
        'event_type' => 'transaction.updated',
        'transaction_id' => 'tr_999888',
        'reference' => $ref,
        'status' => 'APPROVED',
        'amount_in_cents' => 5000000,
        'currency' => 'COP',
        'signature_valid' => true,
        'processed' => false,
        'payload' => ['dummy' => 'payload'],
    ]);

    $this->artisan('uniwheels:reconcile-wompi --days=1')
        ->expectsOutputToContain('APROBADO_SIN_TRANSACCION')
        ->assertExitCode(1);
});

test('comando de conciliacion detecta discrepancia de monto entre wompi y billetera', function () {
    $user = crearUsuarioParaConciliacion();
    $ref = 'WR-'.$user->id.'-20260921120000-mismatch';
    $wallet = $user->wallet;

    WompiWebhookEvent::create([
        'event_type' => 'transaction.updated',
        'transaction_id' => 'tr_mismatch',
        'reference' => $ref,
        'status' => 'APPROVED',
        'amount_in_cents' => 3000000, // 30.000 COP
        'currency' => 'COP',
        'signature_valid' => true,
        'processed' => true,
        'payload' => ['dummy' => 'payload'],
    ]);

    WalletTransaction::create([
        'wallet_id' => $wallet->id,
        'transaction_type' => 'recarga_tarjeta',
        'amount_cop' => 15000.00, // Discrepancia: 15.000 COP
        'balance_before_cop' => 0.00,
        'balance_after_cop' => 15000.00,
        'reference_id' => $ref,
        'status' => 'completado',
    ]);

    $this->artisan('uniwheels:reconcile-wompi --days=1')
        ->expectsOutputToContain('MONTO_DISCREPANTE')
        ->assertExitCode(1);
});

test('comando de conciliacion detecta evento rechazado que fue indebidamente acreditado', function () {
    $user = crearUsuarioParaConciliacion();
    $ref = 'WR-'.$user->id.'-20260921120000-declined';
    $wallet = $user->wallet;

    WompiWebhookEvent::create([
        'event_type' => 'transaction.updated',
        'transaction_id' => 'tr_declined',
        'reference' => $ref,
        'status' => 'DECLINED',
        'amount_in_cents' => 1000000,
        'currency' => 'COP',
        'signature_valid' => true,
        'processed' => false,
        'payload' => ['dummy' => 'payload'],
    ]);

    WalletTransaction::create([
        'wallet_id' => $wallet->id,
        'transaction_type' => 'recarga_tarjeta',
        'amount_cop' => 10000.00,
        'balance_before_cop' => 0.00,
        'balance_after_cop' => 10000.00,
        'reference_id' => $ref,
        'status' => 'completado',
    ]);

    $this->artisan('uniwheels:reconcile-wompi --days=1')
        ->expectsOutputToContain('CREDITO_INDEBIDO')
        ->assertExitCode(1);
});

test('comando de conciliacion detecta transaccion de recarga sin evento wompi persistido', function () {
    $user = crearUsuarioParaConciliacion();
    $wallet = $user->wallet;

    WalletTransaction::create([
        'wallet_id' => $wallet->id,
        'transaction_type' => 'recarga_tarjeta',
        'amount_cop' => 25000.00,
        'balance_before_cop' => 0.00,
        'balance_after_cop' => 25000.00,
        'reference_id' => 'WR-'.$user->id.'-no-event',
        'status' => 'completado',
    ]);

    $this->artisan('uniwheels:reconcile-wompi --days=1')
        ->expectsOutputToContain('TRANSACCION_SIN_EVENTO')
        ->assertExitCode(1);
});
