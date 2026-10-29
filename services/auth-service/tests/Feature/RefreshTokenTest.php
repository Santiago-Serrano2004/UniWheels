<?php

use App\Models\Institution;
use App\Models\User;
use App\Services\JwtService;
use Database\Seeders\InstitutionSeeder;
use Database\Seeders\RoleSeeder;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(InstitutionSeeder::class);
    $this->seed(RoleSeeder::class);
});

function crearUsuarioParaRefresh(): User
{
    $user = User::create([
        'name' => 'Usuario Refresh',
        'email' => 'refresh.'.uniqid().'@unab.edu.co',
        'id_document_number' => (string) random_int(1000000000, 1999999999),
        'id_document_type' => 'CC',
        'phone_number' => '3000000000',
        'institution_id' => Institution::where('code', 'UNAB')->first()->id,
        'member_type' => 'estudiante',
        'academic_program_or_department' => 'Ingeniería de Sistemas',
        'password' => bcrypt('ClaveSegura123!'),
        'is_active' => true,
        'email_verified_at' => now(),
        'verification_expires_at' => now()->addMonths(6),
    ]);
    $user->assignRole('estudiante');

    return $user;
}

/**
 * Token firmado correctamente que venció hace $segundos.
 */
function tokenVencidoHace(User $user, int $segundos, ?string $secreto = null): string
{
    return JWT::encode([
        'iss' => config('jwt.issuer'),
        'sub' => (string) $user->id,
        'email' => $user->email,
        'roles' => ['estudiante'],
        'type' => 'user',
        'jti' => (string) Str::uuid(),
        'iat' => time() - $segundos - 14400,
        'exp' => time() - $segundos,
    ], $secreto ?? config('jwt.secret'), config('jwt.algo'));
}

test('un token vencido hace menos de 7 dias se renueva y el anterior queda bloqueado', function () {
    $user = crearUsuarioParaRefresh();
    $viejo = tokenVencidoHace($user, 2 * 86400);

    $respuesta = test()->withToken($viejo)->postJson('/api/v1/auth/refresh')->assertOk();

    $nuevo = $respuesta->json('data.access_token');
    expect($nuevo)->toBeString()->not->toBe($viejo);
    test()->withToken($nuevo)->getJson('/api/v1/auth/me')->assertOk();

    // El token anterior se bloqueó: no se puede renovar otra vez.
    test()->withToken($viejo)->postJson('/api/v1/auth/refresh')->assertStatus(401);
});

test('un token vigente tambien se renueva', function () {
    $user = crearUsuarioParaRefresh();
    $token = app(JwtService::class)->issue($user);

    test()->withToken($token)->postJson('/api/v1/auth/refresh')->assertOk()
        ->assertJsonStructure(['data' => ['access_token', 'token_type']]);
});

test('un token vencido hace mas de 7 dias no se renueva', function () {
    $user = crearUsuarioParaRefresh();

    test()->withToken(tokenVencidoHace($user, 8 * 86400))
        ->postJson('/api/v1/auth/refresh')
        ->assertStatus(401);
});

test('un token con firma invalida no se renueva aunque este dentro de la ventana', function () {
    $user = crearUsuarioParaRefresh();

    test()->withToken(tokenVencidoHace($user, 3600, 'otro-secreto-que-no-es-el-compartido-12345'))
        ->postJson('/api/v1/auth/refresh')
        ->assertStatus(401);

    test()->postJson('/api/v1/auth/refresh')->assertStatus(401);
});

test('un token revocado por logout no se puede renovar ni siquiera vencido', function () {
    $user = crearUsuarioParaRefresh();
    $token = app(JwtService::class)->issue($user);

    test()->withToken($token)->postJson('/api/v1/auth/logout')->assertOk();

    test()->withToken($token)->postJson('/api/v1/auth/refresh')->assertStatus(401);
});

test('un token de servicio no sirve para renovar sesion', function () {
    $user = crearUsuarioParaRefresh();
    $token = app(JwtService::class)->issueServiceToken();

    test()->withToken($token)->postJson('/api/v1/auth/refresh')->assertStatus(401);
});
