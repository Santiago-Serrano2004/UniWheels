<?php

use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

test('el backdoor test_approve ya no autoriza la aprobacion de un vehiculo', function () {
    $vehiculo = Vehicle::create([
        'user_id' => (string) Str::uuid(),
        'vehicle_type' => 'carro',
        'plate_number' => 'BCK123',
        'brand' => 'Kia',
        'model_line' => 'Rio',
        'year' => 2023,
        'color' => 'Negro',
        'available_seats' => 4,
        'status' => 'pendiente_revision',
    ]);

    $this->get("/api/v1/vehicles/{$vehiculo->id}/status?action=approve&token=test_approve")
        ->assertStatus(403);

    expect($vehiculo->fresh()->status)->toBe('pendiente_revision');
});

test('no se puede secuestrar el vehiculo de otro usuario reenviando su placa', function () {
    $duenoOriginal = (string) Str::uuid();
    $atacante = (string) Str::uuid();

    Vehicle::create([
        'user_id' => $duenoOriginal,
        'vehicle_type' => 'carro',
        'plate_number' => 'HCK123',
        'brand' => 'Mazda',
        'model_line' => '3',
        'year' => 2023,
        'color' => 'Azul',
        'available_seats' => 4,
        'status' => 'aprobado',
    ]);

    $response = $this->withToken(jwtDePrueba($atacante))->postJson('/api/v1/vehicles', [
        'user_id' => $atacante, // ignorado: el user_id real viene del JWT igualmente
        'vehicle_type' => 'carro',
        'plate_number' => 'HCK123',
        'brand' => 'Mazda',
        'model_line' => '3',
        'year' => 2023,
        'color' => 'Azul',
        'available_seats' => 4,
    ]);

    $response->assertStatus(409);

    $this->assertDatabaseHas('vehicles', [
        'plate_number' => 'HCK123',
        'user_id' => $duenoOriginal,
    ]);
});

test('rutas de vehiculos rechazan peticiones sin token', function () {
    $this->getJson('/api/v1/vehicles')->assertStatus(401);
    $this->postJson('/api/v1/vehicles', [])->assertStatus(401);
});
