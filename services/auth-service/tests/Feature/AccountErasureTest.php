<?php

use App\Models\Institution;
use App\Models\User;
use App\Services\JwtService;
use Database\Seeders\InstitutionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(InstitutionSeeder::class);
    $this->seed(RoleSeeder::class);
});

function crearUsuarioParaBorrado(): User
{
    $institution = Institution::where('code', 'UNAB')->first();

    $user = User::create([
        'name' => 'Ana Persona Real',
        'email' => 'ana.real.'.uniqid().'@unab.edu.co',
        'id_document_number' => (string) random_int(1000000000, 1999999999),
        'id_document_type' => 'CC',
        'phone_number' => '3001234567',
        'profile_photo_path' => 'profile-photos/ana.jpg',
        'institution_id' => $institution->id,
        'member_type' => 'estudiante',
        'student_code' => 'U00012345',
        'academic_program_or_department' => 'Ingeniería de Sistemas',
        'semester' => 6,
        'password' => Str::password(16),
        'is_active' => true,
        'email_verified_at' => now(),
        'verification_expires_at' => now()->addMonths(6),
    ]);
    $user->assignRole('estudiante');

    return $user;
}

function fakeServiciosDeBorrado(): void
{
    Http::fake(['*' => Http::response(['success' => true], 200)]);
}

test('eliminar la cuenta anonimiza todos los datos personales y hace soft delete', function () {
    fakeServiciosDeBorrado();
    Storage::fake('public');
    Storage::disk('public')->put('profile-photos/ana.jpg', 'x');
    $user = crearUsuarioParaBorrado();
    $correoOriginal = $user->email;
    $token = app(JwtService::class)->issue($user);

    $this->withToken($token)->deleteJson('/api/v1/auth/account')->assertOk();

    $fila = User::withTrashed()->find($user->id);
    expect($fila->name)->toBe('Usuario eliminado')
        ->and($fila->email)->toStartWith('deleted+')->toEndWith('@deleted.invalid')
        ->and($fila->email)->not->toBe($correoOriginal)
        ->and($fila->id_document_number)->toBeNull()
        ->and($fila->phone_number)->toBeNull()
        ->and($fila->student_code)->toBeNull()
        ->and($fila->academic_program_or_department)->toBeNull()
        ->and($fila->profile_photo_path)->toBeNull()
        ->and($fila->semester)->toBeNull()
        ->and($fila->is_active)->toBeFalse()
        ->and($fila->trashed())->toBeTrue();
    Storage::disk('public')->assertMissing('profile-photos/ana.jpg');
});

test('el usuario eliminado ya no puede iniciar sesion y su token queda revocado', function () {
    fakeServiciosDeBorrado();
    $user = crearUsuarioParaBorrado();
    $correoOriginal = $user->email;
    $token = app(JwtService::class)->issue($user);

    $this->withToken($token)->deleteJson('/api/v1/auth/account')->assertOk();

    $this->postJson('/api/v1/auth/login', [
        'email' => $correoOriginal,
        'password' => Str::password(16),
    ])->assertStatus(422);

    $this->withToken($token)->getJson('/api/v1/auth/me')->assertStatus(401);
});

test('eliminar la cuenta pide a los 4 servicios borrar los datos personales', function () {
    fakeServiciosDeBorrado();
    $user = crearUsuarioParaBorrado();
    $token = app(JwtService::class)->issue($user);

    $this->withToken($token)->deleteJson('/api/v1/auth/account')->assertOk();

    foreach (['8002', '8003', '8004', '8005'] as $puerto) {
        Http::assertSent(fn ($request) => $request->method() === 'DELETE'
            && str_contains($request->url(), ":{$puerto}/api/v1/internal/users/{$user->id}/personal-data")
            && $request->hasHeader('Authorization'));
    }
});

test('si un servicio falla la anonimizacion local igual se completa', function () {
    Http::fake(['*' => Http::response(['success' => false], 500)]);
    $user = crearUsuarioParaBorrado();
    $token = app(JwtService::class)->issue($user);

    $this->withToken($token)->deleteJson('/api/v1/auth/account')->assertOk();

    expect(User::withTrashed()->find($user->id)->name)->toBe('Usuario eliminado');
});

test('la ruta duplicada POST /auth/delete-account ya no existe', function () {
    $user = crearUsuarioParaBorrado();
    $token = app(JwtService::class)->issue($user);

    $this->withToken($token)->postJson('/api/v1/auth/delete-account')->assertStatus(404);
});

test('eliminar la cuenta no borra archivos fuera de profile-photos/', function (string $ruta) {
    fakeServiciosDeBorrado();
    Storage::fake('public');
    Storage::disk('public')->put('vehicle-docs/x.pdf', 'x');
    Storage::disk('public')->put('otros/ajena.jpg', 'x');
    $user = crearUsuarioParaBorrado();
    $user->forceFill(['profile_photo_path' => $ruta])->save();
    $token = app(JwtService::class)->issue($user);

    $this->withToken($token)->deleteJson('/api/v1/auth/account')->assertOk();

    Storage::disk('public')->assertExists('vehicle-docs/x.pdf');
    Storage::disk('public')->assertExists('otros/ajena.jpg');
})->with([
    'traversal' => 'profile-photos/../vehicle-docs/x.pdf',
    'otra carpeta' => 'otros/ajena.jpg',
]);

