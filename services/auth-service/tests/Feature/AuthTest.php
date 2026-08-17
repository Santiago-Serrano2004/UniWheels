<?php

use App\Models\Institution;
use App\Models\InstitutionCampus;
use App\Models\User;
use Database\Seeders\InstitutionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(InstitutionSeeder::class);
    $this->seed(RoleSeeder::class);
});

test('puede listar las instituciones activas con sus sedes oficiales', function () {
    $response = $this->getJson('/api/v1/institutions');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
        ])
        ->assertJsonFragment([
            'code' => 'UNAB',
            'domain' => 'unab.edu.co',
        ])
        ->assertJsonFragment([
            'code' => 'JARDIN',
            'name' => 'Campus El Jardín',
        ]);
});

test('un estudiante puede registrarse exitosamente con prefijo y codigo estudiantil UXXXXXXXX', function () {
    $institution = Institution::where('code', 'UNAB')->first();
    $campus = InstitutionCampus::where('code', 'JARDIN')->first();
    $claveDinamica = 'Clave' . Str::random(10) . '1!';

    // Mock OTP verification code in cache
    \Illuminate\Support\Facades\Cache::put('email_verification_crodriguez@unab.edu.co', '123456', 300);

    $payload = [
        'name' => 'Carlos Rodriguez',
        'email_prefix' => 'crodriguez',
        'verification_code' => '123456',
        'institution_id' => $institution->id,
        'campus_id' => $campus->id,
        'id_document_number' => '1098998877',
        'id_document_type' => 'CC',
        'phone_number' => '3159876543',
        'member_type' => 'estudiante',
        'student_code' => 'U00099887',
        'academic_program_or_department' => 'Ingeniería Mecatrónica',
        'semester' => 4,
        'password' => $claveDinamica,
        'is_driver' => false,
    ];

    $response = $this->postJson('/api/v1/auth/register', $payload);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
            'message' => 'Usuario registrado y verificado exitosamente. Se ha enviado un correo de bienvenida.',
        ])
        ->assertJsonPath('data.user.email', 'crodriguez@unab.edu.co')
        ->assertJsonPath('data.user.academic_profile.student_code', 'U00099887')
        ->assertJsonPath('data.user.wallet.balance_cop', 0)
        ->assertJsonPath('data.token_type', 'Bearer');

    $this->assertDatabaseHas('users', [
        'email' => 'crodriguez@unab.edu.co',
        'name' => 'Carlos Rodriguez',
        'student_code' => 'U00099887',
    ]);

    $this->assertDatabaseHas('user_wallets', [
        'balance_cop' => 0.00,
    ]);

    $this->assertDatabaseHas('user_reputation_stats', [
        'total_trips_as_driver' => 0,
        'total_trips_as_passenger' => 0,
    ]);
});

test('rechaza registro si el codigo estudiantil no cumple el formato UXXXXXXXX', function () {
    $institution = Institution::where('code', 'UNAB')->first();
    $claveDinamica = 'Clave' . Str::random(10) . '1!';

    $payload = [
        'name' => 'Usuario Formato Invalido',
        'email_prefix' => 'invalido',
        'institution_id' => $institution->id,
        'id_document_number' => '1098000111',
        'id_document_type' => 'CC',
        'phone_number' => '3150001122',
        'member_type' => 'estudiante',
        'student_code' => '12345678', // Falta la 'U' inicial
        'academic_program_or_department' => 'Medicina',
        'semester' => 2,
        'password' => $claveDinamica,
    ];

    $response = $this->postJson('/api/v1/auth/register', $payload);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['student_code']);
});

test('rechaza registro con dominio de correo no perteneciente a la universidad', function () {
    $institution = Institution::where('code', 'UNAB')->first();
    $claveDinamica = 'Clave' . Str::random(10) . '1!';

    $payload = [
        'name' => 'Usuario Invalido',
        'email' => 'usuario@gmail.com',
        'institution_id' => $institution->id,
        'id_document_number' => '1098555666',
        'id_document_type' => 'CC',
        'phone_number' => '3159998877',
        'member_type' => 'estudiante',
        'student_code' => 'U00055566',
        'academic_program_or_department' => 'Derecho',
        'semester' => 1,
        'password' => $claveDinamica,
    ];

    $response = $this->postJson('/api/v1/auth/register', $payload);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

test('un usuario registrado puede iniciar sesion y obtener Bearer Token', function () {
    $institution = Institution::where('code', 'UNAB')->first();
    $claveDinamica = 'Clave' . Str::random(10) . '1!';

    $user = User::create([
        'name' => 'Ana Gomez',
        'email' => 'ana.gomez@unab.edu.co',
        'id_document_number' => '1098444333',
        'id_document_type' => 'CC',
        'phone_number' => '3171112233',
        'institution_id' => $institution->id,
        'member_type' => 'estudiante',
        'student_code' => 'U00044433',
        'academic_program_or_department' => 'Psicología',
        'semester' => 6,
        'password' => bcrypt($claveDinamica),
        'is_active' => true,
        'email_verified_at' => now(),
        'verification_expires_at' => now()->addMonths(6),
    ]);
    $user->assignRole('estudiante');

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'ana.gomez@unab.edu.co',
        'password' => $claveDinamica,
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Inicio de sesión exitoso.',
        ])
        ->assertJsonPath('data.user.email', 'ana.gomez@unab.edu.co')
        ->assertJsonStructure([
            'data' => [
                'user',
                'access_token',
                'token_type',
            ],
        ]);
});

test('un usuario autenticado puede consultar su perfil con /api/v1/auth/me', function () {
    $institution = Institution::where('code', 'UNAB')->first();
    $claveDinamica = 'Clave' . Str::random(10) . '1!';

    $user = User::create([
        'name' => 'Usuario Perfil Test',
        'email' => 'perfil.test@unab.edu.co',
        'id_document_number' => '1098777888',
        'id_document_type' => 'CC',
        'phone_number' => '3157778899',
        'institution_id' => $institution->id,
        'member_type' => 'docente',
        'student_code' => null,
        'academic_program_or_department' => 'Facultad de Ingeniería',
        'semester' => null,
        'password' => bcrypt($claveDinamica),
        'is_active' => true,
        'email_verified_at' => now(),
        'verification_expires_at' => now()->addMonths(6),
    ]);
    $user->assignRole('estudiante');

    $token = $user->createToken('test_token')->plainTextToken;

    $response = $this->withToken($token)->getJson('/api/v1/auth/me');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
        ])
        ->assertJsonPath('data.email', 'perfil.test@unab.edu.co')
        ->assertJsonPath('data.academic_profile.member_type', 'docente');
});

test('un usuario puede cerrar sesion y revocar su token', function () {
    $institution = Institution::where('code', 'UNAB')->first();
    $claveDinamica = 'Clave' . Str::random(10) . '1!';

    $user = User::create([
        'name' => 'Usuario Logout Test',
        'email' => 'logout.test@unab.edu.co',
        'id_document_number' => '1098666555',
        'id_document_type' => 'CC',
        'phone_number' => '3156665544',
        'institution_id' => $institution->id,
        'member_type' => 'administrativo',
        'student_code' => null,
        'academic_program_or_department' => 'Recursos Humanos',
        'semester' => null,
        'password' => bcrypt($claveDinamica),
        'is_active' => true,
        'email_verified_at' => now(),
        'verification_expires_at' => now()->addMonths(6),
    ]);
    $token = $user->createToken('logout_token')->plainTextToken;

    $response = $this->withToken($token)->postJson('/api/v1/auth/logout');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Sesión cerrada exitosamente. Token revocado.',
        ]);

    $this->assertDatabaseCount('personal_access_tokens', 0);
});
