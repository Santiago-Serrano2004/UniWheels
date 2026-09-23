<?php

use App\Models\Vehicle;
use App\Models\VehicleDocument;
use App\Services\VehicleDocumentVerificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('determina los documentos requeridos segun tipo y antiguedad del vehiculo', function () {
    $service = new VehicleDocumentVerificationService;

    // Carro reciente (ej: 2024 -> < 5 años): soat y licencia
    $carroNuevo = Vehicle::create([
        'user_id' => (string) Str::uuid(),
        'vehicle_type' => 'carro',
        'plate_number' => 'NEW123',
        'brand' => 'Mazda',
        'model_line' => '2',
        'year' => 2024,
        'color' => 'Blanco',
        'available_seats' => 4,
    ]);

    expect($service->getRequiredDocumentTypes($carroNuevo))
        ->toBe(['soat', 'licencia_conduccion']);

    // Carro antiguo (ej: 2018 -> >= 5 años): soat, licencia y revision_tecnico_mecanica
    $carroViejo = Vehicle::create([
        'user_id' => (string) Str::uuid(),
        'vehicle_type' => 'carro',
        'plate_number' => 'OLD123',
        'brand' => 'Renault',
        'model_line' => 'Logan',
        'year' => 2018,
        'color' => 'Gris',
        'available_seats' => 4,
    ]);

    expect($service->getRequiredDocumentTypes($carroViejo))
        ->toBe(['soat', 'licencia_conduccion', 'revision_tecnico_mecanica']);

    // Moto de 2 o más años (ej: 2022): requiere revision_tecnico_mecanica
    $moto = Vehicle::create([
        'user_id' => (string) Str::uuid(),
        'vehicle_type' => 'moto',
        'plate_number' => 'MOT12A',
        'brand' => 'Yamaha',
        'model_line' => 'FZ',
        'year' => 2022,
        'color' => 'Azul',
        'available_seats' => 1,
    ]);

    expect($service->getRequiredDocumentTypes($moto))
        ->toBe(['soat', 'licencia_conduccion', 'revision_tecnico_mecanica']);
});

test('si todos los documentos requeridos estan verificados el vehiculo queda aprobado', function () {
    $service = new VehicleDocumentVerificationService;
    $adminId = (string) Str::uuid();

    $vehiculo = Vehicle::create([
        'user_id' => (string) Str::uuid(),
        'vehicle_type' => 'carro',
        'plate_number' => 'APV123',
        'brand' => 'Chevrolet',
        'model_line' => 'Onix',
        'year' => 2024,
        'color' => 'Rojo',
        'available_seats' => 4,
        'status' => 'pendiente_revision',
    ]);

    $docSoat = VehicleDocument::create([
        'vehicle_id' => $vehiculo->id,
        'user_id' => $vehiculo->user_id,
        'document_type' => 'soat',
        'file_path' => 'documents/soat.jpg',
        'is_verified' => false,
    ]);

    $docLicencia = VehicleDocument::create([
        'vehicle_id' => $vehiculo->id,
        'user_id' => $vehiculo->user_id,
        'document_type' => 'licencia_conduccion',
        'file_path' => 'documents/licencia.jpg',
        'is_verified' => false,
    ]);

    // Verificar solo SOAT -> debe seguir pendiente_revision
    $service->verifyDocument($docSoat, true, null, $adminId);
    expect($vehiculo->fresh()->status)->toBe('pendiente_revision');

    // Verificar Licencia -> ahora ambos requeridos están listos -> aprobado
    $service->verifyDocument($docLicencia, true, null, $adminId);
    expect($vehiculo->fresh()->status)->toBe('aprobado');
    expect($vehiculo->fresh()->rejection_reason)->toBeNull();
});

test('si algun documento es rechazado el vehiculo queda rechazado con notas', function () {
    $service = new VehicleDocumentVerificationService;
    $adminId = (string) Str::uuid();

    $vehiculo = Vehicle::create([
        'user_id' => (string) Str::uuid(),
        'vehicle_type' => 'carro',
        'plate_number' => 'REJ123',
        'brand' => 'Kia',
        'model_line' => 'Picanto',
        'year' => 2024,
        'color' => 'Negro',
        'available_seats' => 4,
        'status' => 'pendiente_revision',
    ]);

    $docSoat = VehicleDocument::create([
        'vehicle_id' => $vehiculo->id,
        'user_id' => $vehiculo->user_id,
        'document_type' => 'soat',
        'file_path' => 'documents/soat.jpg',
        'is_verified' => true,
    ]);

    $docLicencia = VehicleDocument::create([
        'vehicle_id' => $vehiculo->id,
        'user_id' => $vehiculo->user_id,
        'document_type' => 'licencia_conduccion',
        'file_path' => 'documents/licencia.jpg',
        'is_verified' => false,
    ]);

    $service->verifyDocument($docLicencia, false, 'Foto borrosa e ilegible', $adminId);

    $vehiculoActualizado = $vehiculo->fresh();
    expect($vehiculoActualizado->status)->toBe('rechazado');
    expect($vehiculoActualizado->rejection_reason)->toContain('Foto borrosa e ilegible');
});
