<?php

use App\Mail\AvisoFormularioMail;
use App\Mail\ConfirmacionFormularioMail;
use App\Models\BetaSignup;
use App\Models\UniversityContact;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;

uses(RefreshDatabase::class);

beforeEach(function () {
    RateLimiter::clear('landing-form');
    Mail::fake();
});

test('la inscripcion a la beta se guarda y envia confirmacion y aviso interno', function () {
    $payload = [
        'name' => 'Laura M.',
        'email' => 'Laura@Gmail.com',
        'university' => 'Universidad Industrial de Santander (UIS)',
        'platform' => 'ios',
        'role' => 'pasajero',
        'consent' => true,
    ];

    $this->postJson('/api/v1/beta', $payload)->assertOk()->assertJsonPath('success', true);
    $this->postJson('/api/v1/beta', $payload)->assertOk();

    expect(BetaSignup::count())->toBe(1)
        ->and(BetaSignup::first()->email)->toBe('laura@gmail.com');
    Mail::assertSent(ConfirmacionFormularioMail::class, fn ($m) => $m->hasTo('laura@gmail.com'));
    Mail::assertSent(AvisoFormularioMail::class, 1);
});

test('la beta valida plataforma, universidad y consentimiento', function () {
    $this->postJson('/api/v1/beta', [
        'name' => 'X',
        'email' => 'x@gmail.com',
        'university' => 'Otra cosa',
        'platform' => 'windows',
        'role' => 'pasajero',
    ])->assertStatus(422)->assertJsonValidationErrors(['university', 'platform', 'consent']);

    Mail::assertNothingSent();
});

test('el contacto de universidades se guarda y el aviso interno responde al remitente', function () {
    $this->postJson('/api/v1/university-contact', [
        'name' => 'Ana Gómez',
        'email' => 'bienestar@uis.edu.co',
        'university' => 'Universidad Industrial de Santander (UIS)',
        'position' => 'Directora de Bienestar',
        'message' => 'Queremos conocer el piloto.',
        'consent' => true,
    ])->assertOk();

    expect(UniversityContact::count())->toBe(1);
    Mail::assertSent(ConfirmacionFormularioMail::class, fn ($m) => $m->hasTo('bienestar@uis.edu.co'));
    Mail::assertSent(AvisoFormularioMail::class, fn ($m) => $m->hasTo(config('landing.inbox')) && $m->hasReplyTo('bienestar@uis.edu.co'));
});

test('el contacto de universidades exige mensaje', function () {
    $this->postJson('/api/v1/university-contact', [
        'name' => 'Ana',
        'email' => 'ana@uis.edu.co',
        'university' => 'Universidad Industrial de Santander (UIS)',
        'position' => 'Bienestar',
        'consent' => true,
    ])->assertStatus(422)->assertJsonValidationErrors('message');
});
