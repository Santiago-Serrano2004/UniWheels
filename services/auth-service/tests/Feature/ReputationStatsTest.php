<?php

use App\Models\Institution;
use App\Models\User;
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

function crearUsuarioReputacion(): User
{
    $user = User::create([
        'name' => 'Usuario Reputación',
        'email' => 'rep.'.uniqid().'@unab.edu.co',
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

function eventoReputacion(User $user, array $cuerpo, ?string $token = null)
{
    $token ??= app(JwtService::class)->issueServiceToken('notification-service');

    return test()->withToken($token)->postJson("/api/v1/internal/users/{$user->id}/reputation", $cuerpo);
}

test('el endpoint interno de reputacion exige token de servicio', function () {
    $user = crearUsuarioReputacion();
    $cuerpo = ['type' => 'trip_completed', 'role' => 'conductor'];

    test()->postJson("/api/v1/internal/users/{$user->id}/reputation", $cuerpo)->assertStatus(401);
    eventoReputacion($user, $cuerpo, app(JwtService::class)->issue($user))->assertStatus(403);
});

test('los viajes completados y las calificaciones actualizan user_reputation_stats por rol', function () {
    $user = crearUsuarioReputacion();

    foreach ([5, 4, 4] as $nota) {
        eventoReputacion($user, ['type' => 'rating', 'role' => 'conductor', 'score' => $nota])->assertOk();
    }
    eventoReputacion($user, ['type' => 'trip_completed', 'role' => 'conductor'])->assertOk();
    eventoReputacion($user, ['type' => 'trip_completed', 'role' => 'pasajero'])->assertOk();

    $stats = $user->fresh()->reputationStats;
    expect($stats->rating_count_as_driver)->toBe(3)
        ->and($stats->rating_sum_as_driver)->toBe(13.0)
        ->and($stats->total_trips_as_driver)->toBe(1)
        ->and($stats->total_trips_as_passenger)->toBe(1)
        ->and($stats->rating_count_as_passenger)->toBe(0);

    // El usuario ve los nombres reales de los campos en /user/reputation-stats.
    test()->withToken(app(JwtService::class)->issue($user))
        ->getJson('/api/v1/user/reputation-stats')
        ->assertOk()
        ->assertJsonPath('data.rating_average_driver', 4.33)
        ->assertJsonPath('data.total_trips_as_driver', 1)
        ->assertJsonPath('data.total_trips_as_passenger', 1)
        ->assertJsonPath('data.reviews_count', 3);
});

test('una calificacion exige score entre 1 y 5 y el usuario debe existir', function () {
    $user = crearUsuarioReputacion();

    eventoReputacion($user, ['type' => 'rating', 'role' => 'conductor'])->assertStatus(422);
    eventoReputacion($user, ['type' => 'rating', 'role' => 'conductor', 'score' => 6])->assertStatus(422);

    $inexistente = (string) Str::uuid();
    test()->withToken(app(JwtService::class)->issueServiceToken())
        ->postJson("/api/v1/internal/users/{$inexistente}/reputation", ['type' => 'trip_completed', 'role' => 'conductor'])
        ->assertStatus(404);
});
