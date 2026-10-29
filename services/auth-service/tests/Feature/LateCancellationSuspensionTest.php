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

function crearUsuarioParaSuspensionAutomatica(string $role = 'estudiante', array $attributes = []): User
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

function tokenDeServicio(): string
{
    $servicio = crearUsuarioParaSuspensionAutomatica();

    return app(JwtService::class)->issue($servicio, 'service');
}

function urlSuspensionTardia(User $user): string
{
    return "/api/v1/internal/users/{$user->id}/late-cancellation-suspension";
}

const CUERPO_SUSPENSION_TARDIA = ['late_cancellations_count' => 3, 'days' => 30];

test('el endpoint interno rechaza peticiones sin token de servicio', function () {
    $user = crearUsuarioParaSuspensionAutomatica();

    $this->postJson(urlSuspensionTardia($user), CUERPO_SUSPENSION_TARDIA)->assertStatus(401);

    $this->withToken(app(JwtService::class)->issue($user))
        ->postJson(urlSuspensionTardia($user), CUERPO_SUSPENSION_TARDIA)
        ->assertStatus(403);
});

test('con token de servicio suspende al usuario, guarda suspended_until y registra la bitacora', function () {
    Redis::spy();
    $user = crearUsuarioParaSuspensionAutomatica();

    $this->withToken(tokenDeServicio())
        ->postJson(urlSuspensionTardia($user), CUERPO_SUSPENSION_TARDIA)
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.suspended', true);

    $user->refresh();
    expect($user->is_active)->toBeFalse();
    expect($user->suspended_until->isFuture())->toBeTrue();
    expect((int) round(now()->diffInDays($user->suspended_until)))->toBe(30);

    $this->assertDatabaseHas('user_suspension_logs', [
        'user_id' => $user->id,
        'admin_user_id' => null,
        'action' => 'auto_suspended',
        'reason' => 'Suspensión automática: 3 cancelaciones tardías en 30 días',
    ]);

    Redis::shouldHaveReceived('setex')
        ->withArgs(fn ($key, $ttl, $value) => $key === "uniwheels:suspended_user:{$user->id}" && $ttl > 0 && $value === '1')
        ->once();
});

test('el endpoint interno es idempotente', function () {
    Redis::spy();
    $user = crearUsuarioParaSuspensionAutomatica();
    $token = tokenDeServicio();

    $this->withToken($token)->postJson(urlSuspensionTardia($user), CUERPO_SUSPENSION_TARDIA)->assertStatus(200);
    $primera = $user->fresh()->suspended_until;

    $this->withToken($token)->postJson(urlSuspensionTardia($user), CUERPO_SUSPENSION_TARDIA)
        ->assertStatus(200)
        ->assertJsonPath('data.suspended', true);

    expect($user->fresh()->suspended_until->equalTo($primera))->toBeTrue();
    $this->assertDatabaseCount('user_suspension_logs', 1);
});

test('el endpoint interno no suspende a un administrador', function () {
    Redis::spy();
    $admin = crearUsuarioParaSuspensionAutomatica('administrador');

    $this->withToken(tokenDeServicio())
        ->postJson(urlSuspensionTardia($admin), CUERPO_SUSPENSION_TARDIA)
        ->assertStatus(200)
        ->assertJsonPath('data.suspended', false);

    expect($admin->fresh()->is_active)->toBeTrue();
    $this->assertDatabaseCount('user_suspension_logs', 0);
});

test('el endpoint interno responde 404 si el usuario no existe y valida el rango de dias', function () {
    $token = tokenDeServicio();

    $this->withToken($token)
        ->postJson('/api/v1/internal/users/'.fake()->uuid().'/late-cancellation-suspension', CUERPO_SUSPENSION_TARDIA)
        ->assertStatus(404);

    $user = crearUsuarioParaSuspensionAutomatica();
    $this->withToken($token)
        ->postJson(urlSuspensionTardia($user), ['late_cancellations_count' => 3, 'days' => 91])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['days']);
});

test('con suspended_until vencido una peticion autenticada reactiva al usuario y registra auto_reactivated', function () {
    Redis::spy();
    $user = crearUsuarioParaSuspensionAutomatica('estudiante', [
        'is_active' => false,
        'suspended_until' => now()->addDays(30),
    ]);
    $token = app(JwtService::class)->issue($user);

    $this->travel(31)->days();

    $this->withToken($token)->getJson('/api/v1/auth/me')->assertStatus(200);

    $user->refresh();
    expect($user->is_active)->toBeTrue();
    expect($user->suspended_until)->toBeNull();

    $this->assertDatabaseHas('user_suspension_logs', [
        'user_id' => $user->id,
        'admin_user_id' => null,
        'action' => 'auto_reactivated',
    ]);
    Redis::shouldHaveReceived('del')->with("uniwheels:suspended_user:{$user->id}")->once();
});

test('antes de vencer, el 403 incluye la fecha de fin de la suspension', function () {
    Redis::spy();
    $user = crearUsuarioParaSuspensionAutomatica('estudiante', [
        'is_active' => false,
        'suspended_until' => now()->addDays(10),
    ]);

    $this->withToken(app(JwtService::class)->issue($user))
        ->getJson('/api/v1/auth/me')
        ->assertStatus(403)
        ->assertJsonPath('message', 'Tu cuenta está suspendida hasta el '.$user->suspended_until->setTimezone('America/Bogota')->format('d/m/Y').'.')
        ->assertJsonPath('suspended_until', $user->suspended_until->toISOString());
});

test('una cuenta eliminada (inactiva sin fecha) nunca se reactiva', function () {
    Redis::spy();
    $user = crearUsuarioParaSuspensionAutomatica('estudiante', ['is_active' => false, 'suspended_until' => null]);
    $token = app(JwtService::class)->issue($user);

    $this->travel(400)->days();

    $this->withToken($token)->getJson('/api/v1/auth/me')->assertStatus(401);

    expect($user->fresh()->is_active)->toBeFalse();
    $this->assertDatabaseCount('user_suspension_logs', 0);
});

test('el login de un usuario suspendido con fecha responde con el mensaje y la fecha', function () {
    $user = crearUsuarioParaSuspensionAutomatica('estudiante', [
        'is_active' => false,
        'suspended_until' => now()->addDays(10),
    ]);

    $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'ClaveSegura123!'])
        ->assertStatus(403)
        ->assertJsonPath('message', 'Tu cuenta está suspendida hasta el '.$user->suspended_until->setTimezone('America/Bogota')->format('d/m/Y').'.')
        ->assertJsonPath('suspended_until', $user->suspended_until->toISOString());
});

test('el login con suspension vencida reactiva al usuario', function () {
    Redis::spy();
    $user = crearUsuarioParaSuspensionAutomatica('estudiante', [
        'is_active' => false,
        'suspended_until' => now()->addDays(30),
    ]);

    $this->travel(31)->days();

    $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'ClaveSegura123!'])
        ->assertStatus(200);

    expect($user->fresh()->is_active)->toBeTrue();
    $this->assertDatabaseHas('user_suspension_logs', ['user_id' => $user->id, 'action' => 'auto_reactivated']);
});

test('la reactivacion manual del administrador limpia suspended_until', function () {
    Redis::spy();
    $admin = crearUsuarioParaSuspensionAutomatica('administrador');
    $user = crearUsuarioParaSuspensionAutomatica('estudiante', [
        'is_active' => false,
        'suspended_until' => now()->addDays(20),
    ]);

    $this->withToken(app(JwtService::class)->issue($admin))
        ->patchJson("/api/v1/admin/users/{$user->id}/suspension", ['suspended' => false, 'reason' => 'Apelación aprobada'])
        ->assertStatus(200)
        ->assertJsonPath('data.suspended_until', null);

    $user->refresh();
    expect($user->is_active)->toBeTrue();
    expect($user->suspended_until)->toBeNull();
});
