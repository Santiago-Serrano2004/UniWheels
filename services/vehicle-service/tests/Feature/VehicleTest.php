<?php

use App\Models\Vehicle;
use App\Models\VehicleDocument;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
    Storage::fake('private');
});

test('puede consultar el catalogo de marcas de vehiculos', function () {
    $response = $this->getJson('/api/v1/vehicles/catalog/brands?type=carro');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
        ])
        ->assertJsonStructure([
            'data',
        ]);
});

test('un conductor puede registrar un automovil con placa colombiana valida', function () {
    $userId = (string) Str::uuid();

    $payload = [
        'user_id' => $userId,
        'vehicle_type' => 'carro',
        'plate_number' => 'ABC123',
        'brand' => 'Mazda',
        'model_line' => 'Mazda 3',
        'year' => 2022,
        'color' => 'Rojo Diamante',
        'available_seats' => 4,
        'has_ac' => true,
        'has_trunk' => true,
    ];

    $response = $this->postJson('/api/v1/vehicles', $payload);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
            'message' => 'Vehículo registrado exitosamente. Por favor adjunta los documentos requeridos para su validación.',
        ])
        ->assertJsonPath('data.plate_number', 'ABC123')
        ->assertJsonPath('data.status', 'pendiente_revision')
        ->assertJsonPath('data.legal_compliance.requires_rtm', false); // 2022 carro < 5 años

    $this->assertDatabaseHas('vehicles', [
        'plate_number' => 'ABC123',
        'brand' => 'Mazda',
    ]);
});

test('un conductor puede registrar una moto confirmando casco adicional reglamentario', function () {
    $userId = (string) Str::uuid();

    $payload = [
        'user_id' => $userId,
        'vehicle_type' => 'moto',
        'plate_number' => 'XYZ99D',
        'brand' => 'Yamaha',
        'model_line' => 'FZ-25',
        'year' => 2024,
        'color' => 'Negro Mate',
        'available_seats' => 1,
        'has_extra_helmet' => true,
    ];

    $response = $this->postJson('/api/v1/vehicles', $payload);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
        ])
        ->assertJsonPath('data.plate_number', 'XYZ99D')
        ->assertJsonPath('data.features.has_extra_helmet', true);
});

test('rechaza registro de moto si no confirma casco adicional', function () {
    $userId = (string) Str::uuid();

    $payload = [
        'user_id' => $userId,
        'vehicle_type' => 'moto',
        'plate_number' => 'XYZ88E',
        'brand' => 'Bajaj',
        'model_line' => 'Pulsar NS 200',
        'year' => 2023,
        'color' => 'Azul',
        'available_seats' => 1,
        'has_extra_helmet' => false,
    ];

    $response = $this->postJson('/api/v1/vehicles', $payload);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['has_extra_helmet']);
});

test('un conductor puede subir documentos privados como SOAT y Licencia', function () {
    $userId = (string) Str::uuid();

    $vehiculo = Vehicle::create([
        'user_id' => $userId,
        'vehicle_type' => 'carro',
        'plate_number' => 'KLR456',
        'brand' => 'Renault',
        'model_line' => 'Sandero',
        'year' => 2020,
        'color' => 'Gris Estrella',
        'available_seats' => 4,
        'status' => 'pendiente_revision',
    ]);

    $archivoSoat = UploadedFile::fake()->create('soat_digital.pdf', 500, 'application/pdf');

    $response = $this->postJson("/api/v1/vehicles/{$vehiculo->id}/documents", [
        'document_type' => 'soat',
        'document_number' => 'POL-99887766',
        'issuer_entity' => 'Seguros Bolivar',
        'issued_at' => '2026-01-01',
        'expires_at' => '2027-01-01',
        'document_file' => $archivoSoat,
    ]);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
        ])
        ->assertJsonPath('data.document_type', 'soat')
        ->assertJsonPath('data.is_verified', false);

    $this->assertDatabaseHas('vehicle_documents', [
        'vehicle_id' => $vehiculo->id,
        'document_type' => 'soat',
    ]);
});

test('descargar un documento privado genera un registro inmutable de auditoria Habeas Data', function () {
    $userId = (string) Str::uuid();
    $auditorId = (string) Str::uuid();

    $vehiculo = Vehicle::create([
        'user_id' => $userId,
        'vehicle_type' => 'carro',
        'plate_number' => 'MNO789',
        'brand' => 'Chevrolet',
        'model_line' => 'Onix',
        'year' => 2023,
        'color' => 'Blanco',
        'available_seats' => 4,
    ]);

    $rutaArchivo = "documents/{$vehiculo->id}/soat_test.pdf";
    Storage::disk('private')->put($rutaArchivo, 'CONTENIDO_SEGURO_SOAT');

    $documento = VehicleDocument::create([
        'vehicle_id' => $vehiculo->id,
        'user_id' => $userId,
        'document_type' => 'soat',
        'document_number' => 'SOAT-112233',
        'file_path' => $rutaArchivo,
        'expires_at' => '2027-05-01',
    ]);

    // Generar URL firmada
    $urlFirmada = app(\App\Services\HabeasDataAuditService::class)->generateSignedDownloadUrl($documento, [
        'auditor_id' => $auditorId,
        'purpose' => 'verificacion_inicial',
    ]);

    // Ejecutar descarga
    $response = $this->get($urlFirmada);

    $response->assertStatus(200);

    // Verificar registro en document_access_logs
    $this->assertDatabaseHas('document_access_logs', [
        'auditor_user_id' => $auditorId,
        'target_user_id' => $userId,
        'document_id' => $documento->id,
        'access_purpose' => 'verificacion_inicial',
    ]);
});

test('la verificacion de documentos actualiza el estado del vehiculo a aprobado si cumple todos los requisitos', function () {
    $userId = (string) Str::uuid();
    $adminId = (string) Str::uuid();

    $vehiculo = Vehicle::create([
        'user_id' => $userId,
        'vehicle_type' => 'carro',
        'plate_number' => 'QWE123',
        'brand' => 'Toyota',
        'model_line' => 'Corolla',
        'year' => 2024,
        'color' => 'Plata',
        'available_seats' => 4,
        'status' => 'pendiente_revision',
    ]);

    $documentos = ['licencia_conduccion', 'soat', 'tarjeta_propiedad'];
    foreach ($documentos as $tipo) {
        $doc = VehicleDocument::create([
            'vehicle_id' => $vehiculo->id,
            'user_id' => $userId,
            'document_type' => $tipo,
            'file_path' => "documents/{$vehiculo->id}/{$tipo}.pdf",
            'expires_at' => '2027-12-31',
            'is_verified' => false,
        ]);

        $this->patchJson("/api/v1/vehicles/{$vehiculo->id}/documents/{$doc->id}/verify", [
            'is_verified' => true,
            'verified_by_user_id' => $adminId,
        ]);
    }

    $this->assertEquals('aprobado', $vehiculo->fresh()->status);
});
