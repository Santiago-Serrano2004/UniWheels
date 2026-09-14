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

function crearUsuarioJwtTest(): User
{
    $institution = Institution::where('code', 'UNAB')->first();

    $user = User::create([
        'name' => 'Usuario JWT Test',
        'email' => 'jwt.test.'.uniqid().'@unab.edu.co',
        'id_document_number' => (string) random_int(1000000000, 1999999999),
        'id_document_type' => 'CC',
        'phone_number' => '3000000000',
        'institution_id' => $institution->id,
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

test('una ruta protegida rechaza la peticion sin token', function () {
    $this->getJson('/api/v1/auth/me')
        ->assertStatus(401);
});

test('una ruta protegida rechaza un token con firma invalida', function () {
    $this->withToken('esto-no-es-un-jwt-valido')
        ->getJson('/api/v1/auth/me')
        ->assertStatus(401);
});

test('una ruta protegida rechaza un token JWT expirado', function () {
    $user = crearUsuarioJwtTest();

    $payload = [
        'iss' => config('jwt.issuer'),
        'sub' => (string) $user->id,
        'email' => $user->email,
        'roles' => ['estudiante'],
        'type' => 'user',
        'jti' => (string) Str::uuid(),
        'iat' => time() - 20000,
        'exp' => time() - 10000,
    ];
    $tokenExpirado = JWT::encode($payload, config('jwt.secret'), config('jwt.algo'));

    $this->withToken($tokenExpirado)
        ->getJson('/api/v1/auth/me')
        ->assertStatus(401);
});

test('driver register ya no tiene fallback sin autenticacion (backdoor eliminado)', function () {
    $this->postJson('/api/v1/driver/register', [
        'vehicle_type' => 'carro',
        'plate_number' => 'ABC123',
        'brand' => 'Chevrolet',
        'model_line' => 'Spark',
        'year' => 2023,
        'propulsion_type' => 'gasolina',
        'available_seats' => 3,
    ])->assertStatus(401);
});

test('un token revocado por logout deja de ser valido (blocklist en Redis)', function () {
    $user = crearUsuarioJwtTest();
    $token = app(JwtService::class)->issue($user);

    $this->withToken($token)->postJson('/api/v1/auth/logout')->assertStatus(200);

    $this->withToken($token)->getJson('/api/v1/auth/me')->assertStatus(401);
});
