<?php

use App\Models\Institution;
use App\Models\User;
use App\Services\JwtService;
use Database\Seeders\InstitutionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(InstitutionSeeder::class);
    $this->seed(RoleSeeder::class);
});

function createTestUser(string $role = 'estudiante', array $attributes = []): User
{
    $institution = Institution::where('code', 'UNAB')->first();

    $user = User::create(array_merge([
        'name' => 'Usuario Test '.uniqid(),
        'email' => 'user.'.uniqid().'@unab.edu.co',
        'id_document_number' => (string) random_int(1000000000, 1999999999),
        'id_document_type' => 'CC',
        'phone_number' => '300'.random_int(1000000, 9999999),
        'institution_id' => $institution->id,
        'member_type' => 'estudiante',
        'academic_program_or_department' => 'Ingeniería de Sistemas',
        'password' => bcrypt('ClaveSegura123!'),
        'is_active' => true,
        'email_verified_at' => now(),
        'verification_expires_at' => now()->addMonths(6),
    ], $attributes));

    $user->assignRole($role);

    return $user;
}

test('un usuario no autenticado no puede acceder a la ruta de suspension', function () {
    $targetUser = createTestUser('estudiante');

    $this->patchJson("/api/v1/admin/users/{$targetUser->id}/suspension", [
        'suspended' => true,
        'reason' => 'Incumplimiento de términos',
    ])->assertStatus(401);
});

test('un usuario no administrador recibe 403 al intentar suspender', function () {
    $estudiante = createTestUser('estudiante');
    $targetUser = createTestUser('estudiante');
    $token = app(JwtService::class)->issue($estudiante);

    $this->withToken($token)
        ->patchJson("/api/v1/admin/users/{$targetUser->id}/suspension", [
            'suspended' => true,
            'reason' => 'Incumplimiento de términos',
        ])->assertStatus(403);
});

test('un administrador puede suspender y reactivar a un usuario', function () {
    $admin = createTestUser('administrador');
    $targetUser = createTestUser('estudiante');
    $adminToken = app(JwtService::class)->issue($admin);
    $userToken = app(JwtService::class)->issue($targetUser);

    Redis::spy();

    // 1. Suspender
    $response = $this->withToken($adminToken)
        ->patchJson("/api/v1/admin/users/{$targetUser->id}/suspension", [
            'suspended' => true,
            'reason' => 'Conducta inapropiada en viajes',
        ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $targetUser->id,
                'is_active' => false,
            ],
        ]);

    expect($targetUser->fresh()->is_active)->toBeFalse();

    $this->assertDatabaseHas('user_suspension_logs', [
        'user_id' => $targetUser->id,
        'admin_user_id' => $admin->id,
        'action' => 'suspended',
        'reason' => 'Conducta inapropiada en viajes',
    ]);

    Redis::shouldHaveReceived('set')
        ->with("uniwheels:suspended_user:{$targetUser->id}", '1')
        ->once();

    // 2. Comprobar que usuario suspendido recibe 403 en endpoint protegido
    Redis::shouldReceive('exists')
        ->andReturnUsing(function (string $key) use ($targetUser) {
            if ($key === "uniwheels:suspended_user:{$targetUser->id}") {
                return 1;
            }

            return 0;
        });

    $this->withToken($userToken)
        ->getJson('/api/v1/auth/me')
        ->assertStatus(403)
        ->assertJson(['message' => 'Tu cuenta está suspendida.']);

    // 3. Reactivar
    $reactivateResponse = $this->withToken($adminToken)
        ->patchJson("/api/v1/admin/users/{$targetUser->id}/suspension", [
            'suspended' => false,
            'reason' => 'Apelación aprobada',
        ]);

    $reactivateResponse->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $targetUser->id,
                'is_active' => true,
            ],
        ]);

    expect($targetUser->fresh()->is_active)->toBeTrue();

    $this->assertDatabaseHas('user_suspension_logs', [
        'user_id' => $targetUser->id,
        'admin_user_id' => $admin->id,
        'action' => 'reactivated',
        'reason' => 'Apelación aprobada',
    ]);

    Redis::shouldHaveReceived('del')
        ->with("uniwheels:suspended_user:{$targetUser->id}")
        ->once();
});

test('un administrador no puede suspenderse a si mismo', function () {
    $admin = createTestUser('administrador');
    $adminToken = app(JwtService::class)->issue($admin);

    $this->withToken($adminToken)
        ->patchJson("/api/v1/admin/users/{$admin->id}/suspension", [
            'suspended' => true,
            'reason' => 'Prueba auto-suspensión',
        ])->assertStatus(422);
});

test('un administrador no puede suspender a otro administrador', function () {
    $admin1 = createTestUser('administrador');
    $admin2 = createTestUser('administrador');
    $admin1Token = app(JwtService::class)->issue($admin1);

    $this->withToken($admin1Token)
        ->patchJson("/api/v1/admin/users/{$admin2->id}/suspension", [
            'suspended' => true,
            'reason' => 'Prueba suspender admin',
        ])->assertStatus(422);
});

test('la razon es obligatoria al suspender', function () {
    $admin = createTestUser('administrador');
    $targetUser = createTestUser('estudiante');
    $adminToken = app(JwtService::class)->issue($admin);

    $this->withToken($adminToken)
        ->patchJson("/api/v1/admin/users/{$targetUser->id}/suspension", [
            'suspended' => true,
        ])->assertStatus(422)
        ->assertJsonValidationErrors(['reason']);
});
