<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('login con email de tipo array responde 422, no 500', function () {
    $this->postJson('/api/v1/auth/login', [
        'email' => ['a@unab.edu.co'],
        'password' => 'ClaveIncorrecta1!',
    ])->assertStatus(422)->assertJsonValidationErrors('email');
});

test('login con password o email_prefix de tipo array responde 422, no 500', function () {
    $this->postJson('/api/v1/auth/login', [
        'email' => 'a@unab.edu.co',
        'password' => ['x'],
    ])->assertStatus(422)->assertJsonValidationErrors('password');

    $this->postJson('/api/v1/auth/login', [
        'email_prefix' => ['a'],
        'institution_id' => ['1'],
        'password' => 'ClaveIncorrecta1!',
    ])->assertStatus(422);
});
