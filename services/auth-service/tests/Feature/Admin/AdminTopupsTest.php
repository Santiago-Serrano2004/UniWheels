<?php

use App\Models\Institution;
use App\Models\User;
use App\Models\UserWallet;
use App\Models\WalletTransaction;
use App\Models\WompiWebhookEvent;
use App\Services\JwtService;
use Database\Seeders\InstitutionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(InstitutionSeeder::class);
    $this->seed(RoleSeeder::class);
});

test('la ruta de consulta de recargas requiere rol administrador', function () {
    $institution = Institution::where('code', 'UNAB')->first();

    $estudiante = User::create([
        'name' => 'Usuario No Admin',
        'email' => 'noadmin.'.uniqid().'@unab.edu.co',
        'id_document_number' => (string) random_int(1000000000, 1999999999),
        'id_document_type' => 'CC',
        'phone_number' => '3001234567',
        'institution_id' => $institution->id,
        'member_type' => 'estudiante',
        'academic_program_or_department' => 'Sistemas',
        'password' => bcrypt('ClaveSegura123!'),
        'is_active' => true,
        'email_verified_at' => now(),
        'verification_expires_at' => now()->addMonths(6),
    ]);
    $estudiante->assignRole('estudiante');

    $token = app(JwtService::class)->issue($estudiante);

    $this->getJson('/api/v1/admin/payments/topups')->assertStatus(401);
    $this->withToken($token)->getJson('/api/v1/admin/payments/topups')->assertStatus(403);
});

test('un administrador puede consultar las recargas de billetera y sus transacciones asociadas', function () {
    $institution = Institution::where('code', 'UNAB')->first();

    $admin = User::create([
        'name' => 'Admin Finanzas',
        'email' => 'admin.finanzas.'.uniqid().'@unab.edu.co',
        'id_document_number' => (string) random_int(1000000000, 1999999999),
        'id_document_type' => 'CC',
        'phone_number' => '3007654321',
        'institution_id' => $institution->id,
        'member_type' => 'estudiante',
        'academic_program_or_department' => 'Administración',
        'password' => bcrypt('ClaveSegura123!'),
        'is_active' => true,
        'email_verified_at' => now(),
        'verification_expires_at' => now()->addMonths(6),
    ]);
    $admin->assignRole('administrador');

    $user = User::create([
        'name' => 'Usuario Recarga',
        'email' => 'recarga.'.uniqid().'@unab.edu.co',
        'id_document_number' => (string) random_int(1000000000, 1999999999),
        'id_document_type' => 'CC',
        'phone_number' => '3001112233',
        'institution_id' => $institution->id,
        'member_type' => 'estudiante',
        'academic_program_or_department' => 'Medicina',
        'password' => bcrypt('ClaveSegura123!'),
        'is_active' => true,
        'email_verified_at' => now(),
        'verification_expires_at' => now()->addMonths(6),
    ]);
    $user->assignRole('estudiante');

    $wallet = UserWallet::create([
        'user_id' => $user->id,
        'balance_cop' => 30000.00,
        'is_locked' => false,
    ]);

    $referencia = "WR-{$user->id}-".time().'-'.Str::random(6);

    $evento = WompiWebhookEvent::create([
        'event_type' => 'transaction.updated',
        'transaction_id' => 'tx-wompi-topup-1',
        'reference' => $referencia,
        'status' => 'APPROVED',
        'amount_in_cents' => 3000000,
        'currency' => 'COP',
        'signature_valid' => true,
        'processed' => true,
        'processed_at' => now(),
        'payload' => ['data' => ['transaction' => ['id' => 'tx-wompi-topup-1']]],
    ]);

    $tx = WalletTransaction::create([
        'wallet_id' => $wallet->id,
        'transaction_type' => 'recarga_tarjeta',
        'amount_cop' => 30000.00,
        'balance_before_cop' => 0.00,
        'balance_after_cop' => 30000.00,
        'reference_id' => $referencia,
        'status' => 'completado',
        'notes' => 'Recarga Wompi',
    ]);

    $tokenAdmin = app(JwtService::class)->issue($admin);

    $response = $this->withToken($tokenAdmin)
        ->getJson('/api/v1/admin/payments/topups?status=APPROVED');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
        ])
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $evento->id)
        ->assertJsonPath('data.0.reference', $referencia)
        ->assertJsonPath('data.0.amount_cop', 30000)
        ->assertJsonPath('data.0.transaction.id', $tx->id)
        ->assertJsonPath('data.0.transaction.amount_cop', 30000);
});
