<?php

use App\Models\Vehicle;
use App\Models\VehicleDocument;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

test('rutas de administracion de vehiculos requieren rol administrador', function () {
    $userId = (string) Str::uuid();

    // Sin token -> 401
    $this->getJson('/api/v1/admin/vehicles')->assertStatus(401);

    // Con rol estudiante -> 403
    $this->withToken(jwtDePrueba($userId, ['estudiante']))
        ->getJson('/api/v1/admin/vehicles')
        ->assertStatus(403);
});

test('un administrador puede listar vehiculos con filtros y conteo de documentos', function () {
    $adminId = (string) Str::uuid();
    $userId = (string) Str::uuid();

    $v1 = Vehicle::create([
        'user_id' => $userId,
        'vehicle_type' => 'carro',
        'plate_number' => 'ADM111',
        'brand' => 'Mazda',
        'model_line' => 'CX-30',
        'year' => 2024,
        'color' => 'Rojo',
        'available_seats' => 4,
        'status' => 'pendiente_revision',
    ]);

    VehicleDocument::create([
        'vehicle_id' => $v1->id,
        'user_id' => $userId,
        'document_type' => 'soat',
        'file_path' => 'documents/soat.jpg',
        'is_verified' => true,
    ]);

    VehicleDocument::create([
        'vehicle_id' => $v1->id,
        'user_id' => $userId,
        'document_type' => 'licencia_conduccion',
        'file_path' => 'documents/licencia.jpg',
        'is_verified' => false,
    ]);

    $v2 = Vehicle::create([
        'user_id' => (string) Str::uuid(),
        'vehicle_type' => 'carro',
        'plate_number' => 'ZZZ999',
        'brand' => 'Toyota',
        'model_line' => 'Corolla',
        'year' => 2023,
        'color' => 'Blanco',
        'available_seats' => 4,
        'status' => 'aprobado',
    ]);

    $tokenAdmin = jwtDePrueba($adminId, ['administrador']);

    $response = $this->withToken($tokenAdmin)
        ->getJson('/api/v1/admin/vehicles?status=pendiente_revision&search=Mazda');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
        ])
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.plate_number', 'ADM111')
        ->assertJsonPath('data.0.documents_summary.total', 2)
        ->assertJsonPath('data.0.documents_summary.verified', 1)
        ->assertJsonPath('data.0.documents_summary.pending', 1);
});

test('un administrador puede consultar el detalle de un vehiculo con sus documentos', function () {
    $adminId = (string) Str::uuid();
    $userId = (string) Str::uuid();

    $v = Vehicle::create([
        'user_id' => $userId,
        'vehicle_type' => 'carro',
        'plate_number' => 'DET123',
        'brand' => 'Nissan',
        'model_line' => 'Versa',
        'year' => 2024,
        'color' => 'Plata',
        'available_seats' => 4,
        'status' => 'pendiente_revision',
    ]);

    VehicleDocument::create([
        'vehicle_id' => $v->id,
        'user_id' => $userId,
        'document_type' => 'soat',
        'file_path' => 'documents/soat.jpg',
        'is_verified' => true,
    ]);

    $tokenAdmin = jwtDePrueba($adminId, ['administrador']);

    $response = $this->withToken($tokenAdmin)
        ->getJson("/api/v1/admin/vehicles/{$v->id}");

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $v->id,
                'user_id' => $userId,
                'plate_number' => 'DET123',
            ],
        ])
        ->assertJsonCount(1, 'data.documents');
});

test('verificar documentos mediante el endpoint verify actualiza el estado del vehiculo', function () {
    $adminId = (string) Str::uuid();
    $userId = (string) Str::uuid();

    $v = Vehicle::create([
        'user_id' => $userId,
        'vehicle_type' => 'carro',
        'plate_number' => 'VRF123',
        'brand' => 'Renault',
        'model_line' => 'Kwid',
        'year' => 2024,
        'color' => 'Blanco',
        'available_seats' => 4,
        'status' => 'pendiente_revision',
    ]);

    $docSoat = VehicleDocument::create([
        'vehicle_id' => $v->id,
        'user_id' => $userId,
        'document_type' => 'soat',
        'file_path' => 'documents/soat.jpg',
        'is_verified' => false,
    ]);

    $docLicencia = VehicleDocument::create([
        'vehicle_id' => $v->id,
        'user_id' => $userId,
        'document_type' => 'licencia_conduccion',
        'file_path' => 'documents/licencia.jpg',
        'is_verified' => false,
    ]);

    $tokenAdmin = jwtDePrueba($adminId, ['administrador']);

    // Verificar SOAT
    $this->withToken($tokenAdmin)
        ->patchJson("/api/v1/vehicles/{$v->id}/documents/{$docSoat->id}/verify", [
            'is_verified' => true,
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.vehicle_status', 'pendiente_revision');

    // Verificar Licencia
    $this->withToken($tokenAdmin)
        ->patchJson("/api/v1/vehicles/{$v->id}/documents/{$docLicencia->id}/verify", [
            'is_verified' => true,
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.vehicle_status', 'aprobado');

    expect($v->fresh()->status)->toBe('aprobado');
});
