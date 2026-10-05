<?php

use App\Models\Institution;
use App\Models\User;
use App\Services\JwtService;
use Database\Seeders\InstitutionSeeder;
use Database\Seeders\RoleSeeder;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(InstitutionSeeder::class);
    $this->seed(RoleSeeder::class);
});

function usuarioParaRevocar(): User
{
    $user = User::create([
        'name' => 'Usuario Revocable',
        'email' => 'revocable.'.uniqid().'@unab.edu.co',
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

function tokenEmitidoHace(User $user, int $segundos): string
{
    $iat = time() - $segundos;

    return JWT::encode([
        'iss' => config('jwt.issuer'),
        'sub' => (string) $user->id,
        'email' => $user->email,
        'roles' => ['estudiante'],
        'type' => 'user',
        'jti' => (string) Str::uuid(),
        'iat' => $iat,
        'exp' => $iat + 14400,
    ], config('jwt.secret'), config('jwt.algo'));
}

test('un token emitido antes del reset de contraseña da 401 y uno posterior da 200', function () {
    $user = usuarioParaRevocar();
    $viejo = tokenEmitidoHace($user, 60);
    $this->withToken($viejo)->getJson('/api/v1/auth/me')->assertOk();

    Cache::put('password_reset_'.$user->email, '123456', now()->addMinutes(15));
    $this->postJson('/api/v1/auth/reset-password', [
        'email' => $user->email,
        'code' => '123456',
        'password' => 'NuevaClave123!',
    ])->assertOk();

    try {
        $this->withToken($viejo)->getJson('/api/v1/auth/me')
            ->assertStatus(401)
            ->assertJsonPath('message', 'Tu sesión ya no es válida. Inicia sesión de nuevo.');

        $this->withToken($viejo)->postJson('/api/v1/auth/refresh')->assertStatus(401);

        $nuevo = app(JwtService::class)->issue($user);
        $this->withToken($nuevo)->getJson('/api/v1/auth/me')->assertOk();
    } finally {
        Redis::del("uniwheels:tokens_valid_after:{$user->id}");
    }
});
