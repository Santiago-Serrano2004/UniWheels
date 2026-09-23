<?php

use App\Models\Institution;
use App\Models\User;
use App\Models\UserReputationStats;
use App\Models\UserSuspensionLog;
use App\Models\UserWallet;
use App\Services\JwtService;
use Database\Seeders\InstitutionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(InstitutionSeeder::class);
    $this->seed(RoleSeeder::class);
});

function createAdminMgmtUser(string $role = 'estudiante', array $attributes = []): User
{
    $institution = Institution::where('code', 'UNAB')->first();

    $user = User::create(array_merge([
        'name' => 'Usuario '.uniqid(),
        'email' => 'user.'.uniqid().'@unab.edu.co',
        'id_document_number' => (string) random_int(1000000000, 1999999999),
        'id_document_type' => 'CC',
        'phone_number' => '300'.random_int(1000000, 9999999),
        'student_code' => 'U00'.random_int(10000, 99999),
        'institution_id' => $institution->id,
        'member_type' => 'estudiante',
        'academic_program_or_department' => 'Ingeniería de Sistemas',
        'password' => bcrypt('ClaveSegura123!'),
        'is_active' => true,
        'is_driver' => false,
        'email_verified_at' => now(),
        'verification_expires_at' => now()->addMonths(6),
    ], $attributes));

    $user->assignRole($role);

    return $user;
}

test('rutas de administracion de usuarios requieren rol administrador', function () {
    $estudiante = createAdminMgmtUser('estudiante');
    $token = app(JwtService::class)->issue($estudiante);

    $this->getJson('/api/v1/admin/users')->assertStatus(401);
    $this->withToken($token)->getJson('/api/v1/admin/users')->assertStatus(403);
    $this->withToken($token)->getJson("/api/v1/admin/users/{$estudiante->id}")->assertStatus(403);
    $this->withToken($token)->postJson('/api/v1/admin/users/lookup', ['ids' => [$estudiante->id]])->assertStatus(403);
});

test('un administrador puede listar usuarios con filtros de busqueda rol y estado', function () {
    $admin = createAdminMgmtUser('administrador');
    $tokenAdmin = app(JwtService::class)->issue($admin);

    $u1 = createAdminMgmtUser('estudiante', [
        'name' => 'Carlos Andrés Pérez',
        'email' => 'cperez@unab.edu.co',
        'student_code' => 'U0012345',
        'is_active' => true,
    ]);

    $u2 = createAdminMgmtUser('conductor', [
        'name' => 'María Camila Gómez',
        'email' => 'mgomez@unab.edu.co',
        'student_code' => 'U0099999',
        'is_active' => false,
        'is_driver' => true,
    ]);

    // Filtrar por búsqueda
    $respSearch = $this->withToken($tokenAdmin)
        ->getJson('/api/v1/admin/users?search=Carlos');
    $respSearch->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $u1->id)
        ->assertJsonPath('data.0.student_code', 'U0012345');

    // Filtrar por rol
    $respRole = $this->withToken($tokenAdmin)
        ->getJson('/api/v1/admin/users?role=conductor');
    $respRole->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $u2->id)
        ->assertJsonPath('data.0.is_driver', true);

    // Filtrar por activo = false
    $respActive = $this->withToken($tokenAdmin)
        ->getJson('/api/v1/admin/users?active=false');
    $respActive->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $u2->id)
        ->assertJsonPath('data.0.is_active', false);
});

test('un administrador puede consultar el detalle de un usuario con reputacion billetera y suspensiones', function () {
    $admin = createAdminMgmtUser('administrador');
    $tokenAdmin = app(JwtService::class)->issue($admin);

    $targetUser = createAdminMgmtUser('conductor', [
        'name' => 'Laura Conductora',
        'is_driver' => true,
    ]);

    UserReputationStats::create([
        'user_id' => $targetUser->id,
        'total_trips_as_driver' => 15,
        'total_trips_as_passenger' => 4,
        'rating_count_as_driver' => 10,
        'rating_count_as_passenger' => 3,
        'rating_sum_as_driver' => 48.0,
        'rating_sum_as_passenger' => 15.0,
    ]);

    UserWallet::create([
        'user_id' => $targetUser->id,
        'balance_cop' => 25000.00,
        'is_locked' => false,
    ]);

    UserSuspensionLog::create([
        'user_id' => $targetUser->id,
        'admin_user_id' => $admin->id,
        'action' => 'suspended',
        'reason' => 'Incidente de prueba',
        'created_at' => now(),
    ]);

    $response = $this->withToken($tokenAdmin)
        ->getJson("/api/v1/admin/users/{$targetUser->id}");

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $targetUser->id,
                'name' => 'Laura Conductora',
                'reputation' => [
                    'total_trips_as_driver' => 15,
                    'average_rating_as_driver' => 4.8,
                ],
                'wallet' => [
                    'balance_cop' => 25000.0,
                    'is_locked' => false,
                ],
            ],
        ])
        ->assertJsonCount(1, 'data.suspension_logs')
        ->assertJsonPath('data.suspension_logs.0.reason', 'Incidente de prueba');
});

test('un administrador puede hacer lookup masivo de nombres y correos por id', function () {
    $admin = createAdminMgmtUser('administrador');
    $tokenAdmin = app(JwtService::class)->issue($admin);

    $u1 = createAdminMgmtUser('estudiante', ['name' => 'Usuario Uno', 'email' => 'uno@unab.edu.co']);
    $u2 = createAdminMgmtUser('estudiante', ['name' => 'Usuario Dos', 'email' => 'dos@unab.edu.co']);

    $response = $this->withToken($tokenAdmin)
        ->postJson('/api/v1/admin/users/lookup', [
            'ids' => [$u1->id, $u2->id],
        ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
        ])
        ->assertJsonCount(2, 'data')
        ->assertJsonFragment(['id' => $u1->id, 'name' => 'Usuario Uno', 'email' => 'uno@unab.edu.co'])
        ->assertJsonFragment(['id' => $u2->id, 'name' => 'Usuario Dos', 'email' => 'dos@unab.edu.co']);
});
