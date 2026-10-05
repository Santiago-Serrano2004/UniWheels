<?php

use App\Mail\AvisoFormularioMail;
use App\Mail\ConfirmacionFormularioMail;
use App\Models\Institution;
use App\Models\InstitutionCampus;
use App\Models\User;
use App\Models\WaitlistEntry;
use App\Services\JwtService;
use Database\Seeders\InstitutionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(InstitutionSeeder::class);
    $this->seed(RoleSeeder::class);
    RateLimiter::clear('waitlist');
});

function waitlistPayload(array $overrides = []): array
{
    return array_merge([
        'email' => 'lista.'.uniqid().'@unab.edu.co',
        'university' => 'Universidad Autónoma de Bucaramanga (UNAB)',
        'role' => 'conductor',
        'neighborhood' => 'Cabecera',
        'usual_time' => '06-08',
        'direction' => 'hacia_campus',
        'consent' => true,
    ], $overrides);
}

function waitlistToken(string $role): string
{
    $user = User::create([
        'name' => 'Usuario '.uniqid(),
        'email' => 'u.'.uniqid().'@unab.edu.co',
        'id_document_number' => (string) random_int(1000000000, 1999999999),
        'id_document_type' => 'CC',
        'phone_number' => '300'.random_int(1000000, 9999999),
        'student_code' => 'U00'.random_int(10000, 99999),
        'institution_id' => Institution::where('code', 'UNAB')->first()->id,
        'member_type' => 'estudiante',
        'academic_program_or_department' => 'Ingeniería de Sistemas',
        'password' => bcrypt('ClaveSegura123!'),
        'is_active' => true,
        'is_driver' => false,
        'email_verified_at' => now(),
        'verification_expires_at' => now()->addMonths(6),
    ]);
    $user->assignRole($role);

    return app(JwtService::class)->issue($user);
}

test('una inscripcion valida se guarda y responde con el mensaje de exito', function () {
    $campus = InstitutionCampus::first();
    $payload = waitlistPayload(['email' => 'Ana.Perez@UNAB.edu.co', 'campus_id' => $campus->id]);

    $this->postJson('/api/v1/waitlist', $payload)
        ->assertOk()
        ->assertJsonPath('success', true);

    $entry = WaitlistEntry::first();
    expect($entry->email)->toBe('ana.perez@unab.edu.co')
        ->and($entry->campus_id)->toBe($campus->id)
        ->and($entry->consent_at)->not->toBeNull();
});

test('acepta correos personales pero exige una universidad de la lista', function () {
    $this->postJson('/api/v1/waitlist', waitlistPayload(['email' => 'alguien@gmail.com']))->assertOk();

    $this->postJson('/api/v1/waitlist', waitlistPayload(['university' => 'Universidad Inventada']))
        ->assertStatus(422)
        ->assertJsonValidationErrors('university');
});

test('la primera inscripcion envia confirmacion y aviso interno; repetirla no reenvia', function () {
    Mail::fake();
    $payload = waitlistPayload();

    $this->postJson('/api/v1/waitlist', $payload)->assertOk();
    $this->postJson('/api/v1/waitlist', $payload)->assertOk();

    Mail::assertSent(ConfirmacionFormularioMail::class, 1);
    Mail::assertSent(AvisoFormularioMail::class, fn ($m) => $m->hasTo(config('landing.inbox')));
});

test('sin consentimiento devuelve 422', function () {
    $this->postJson('/api/v1/waitlist', waitlistPayload(['consent' => false]))
        ->assertStatus(422)
        ->assertJsonValidationErrors('consent');

    $payload = waitlistPayload();
    unset($payload['consent']);
    $this->postJson('/api/v1/waitlist', $payload)->assertStatus(422);
});

test('un correo repetido responde 200 sin duplicar la inscripcion', function () {
    $payload = waitlistPayload();

    $primera = $this->postJson('/api/v1/waitlist', $payload);
    $segunda = $this->postJson('/api/v1/waitlist', $payload);

    $primera->assertOk();
    $segunda->assertOk();
    expect($segunda->json('message'))->toBe($primera->json('message'))
        ->and(WaitlistEntry::count())->toBe(1);
});

test('el throttle limita a 5 por minuto por IP', function () {
    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/v1/waitlist', waitlistPayload())->assertOk();
    }

    $this->postJson('/api/v1/waitlist', waitlistPayload())->assertStatus(429);
});

test('el throttle limita a 3 por dia por correo', function () {
    $payload = waitlistPayload();

    for ($i = 0; $i < 3; $i++) {
        $this->postJson('/api/v1/waitlist', $payload)->assertOk();
    }

    $this->postJson('/api/v1/waitlist', $payload)->assertStatus(429);
});

test('la baja por correo elimina la inscripcion y siempre responde 200', function () {
    $payload = waitlistPayload();
    $this->postJson('/api/v1/waitlist', $payload)->assertOk();

    $this->deleteJson('/api/v1/waitlist', ['email' => strtoupper($payload['email'])])->assertOk();
    expect(WaitlistEntry::count())->toBe(0);

    $this->deleteJson('/api/v1/waitlist', ['email' => 'nadie@unab.edu.co'])->assertOk();
});

test('el listado de admin trae los agregados correctos', function () {
    $campus = InstitutionCampus::first();
    $mk = fn (array $o) => WaitlistEntry::create(array_merge([
        'email' => uniqid().'@unab.edu.co',
        'role' => 'pasajero',
        'neighborhood' => 'Cabecera',
        'campus_id' => $campus->id,
        'usual_time' => '06-08',
        'direction' => 'hacia_campus',
        'consent_at' => now(),
        'created_at' => now(),
    ], $o));
    $mk([]);
    $mk(['role' => 'conductor', 'neighborhood' => 'cabecera']);
    $mk(['role' => 'conductor', 'neighborhood' => 'Cañaveral', 'campus_id' => null, 'usual_time' => '08-10']);
    $mk(['role' => 'ambos', 'neighborhood' => 'Cañaveral', 'direction' => 'ambas']);

    $res = $this->withToken(waitlistToken('administrador'))->getJson('/api/v1/admin/waitlist')->assertOk();

    expect($res->json('totals.total'))->toBe(4)
        ->and($res->json('totals.by_role'))->toBe(['pasajero' => 1, 'conductor' => 2, 'ambos' => 1])
        ->and($res->json('totals.by_neighborhood.0.total'))->toBe(2)
        ->and($res->json('totals.by_usual_time'))->toHaveCount(2)
        ->and($res->json('totals.by_campus.0.total'))->toBe(3)
        ->and($res->json('meta.total'))->toBe(4);

    $this->withToken(waitlistToken('administrador'))
        ->getJson('/api/v1/admin/waitlist?role=conductor')
        ->assertOk()
        ->assertJsonPath('meta.total', 2);
});

test('un usuario que no es admin recibe 403 y sin token 401', function () {
    $token = waitlistToken('estudiante');

    $this->getJson('/api/v1/admin/waitlist')->assertStatus(401);
    $this->withToken($token)->getJson('/api/v1/admin/waitlist')->assertStatus(403);
    $this->withToken($token)->getJson('/api/v1/admin/waitlist/export')->assertStatus(403);
});

test('el CSV exportado tiene el encabezado correcto', function () {
    $this->postJson('/api/v1/waitlist', waitlistPayload())->assertOk();

    $res = $this->withToken(waitlistToken('administrador'))->get('/api/v1/admin/waitlist/export');
    $res->assertOk();

    $lines = explode("\n", trim($res->streamedContent()));
    expect($lines[0])->toBe('id,email,role,neighborhood,campus_id,campus,usual_time,direction,consent_at,created_at')
        ->and($lines)->toHaveCount(2);
});
