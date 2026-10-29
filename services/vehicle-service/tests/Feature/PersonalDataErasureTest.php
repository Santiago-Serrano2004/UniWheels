<?php

use App\Models\Vehicle;
use App\Models\VehicleDocument;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

function tokenDeServicioParaBorrado(): string
{
    $ahora = time();

    return JWT::encode([
        'iss' => 'uniwheels-auth-service',
        'sub' => 'auth-service',
        'type' => 'service',
        'jti' => (string) Str::uuid(),
        'iat' => $ahora,
        'exp' => $ahora + 60,
    ], config('jwt.secret'), config('jwt.algo'));
}

function vehiculoConDocumento(string $userId, string $placa): array
{
    $vehiculo = Vehicle::create([
        'user_id' => $userId,
        'vehicle_type' => 'carro',
        'plate_number' => $placa,
        'brand' => 'Kia',
        'model_line' => 'Rio',
        'year' => 2023,
        'color' => 'Negro',
        'available_seats' => 4,
        'status' => 'aprobado',
        'perspective_photo_path' => "vehicles/photos/{$placa}.jpg",
    ]);

    $documento = VehicleDocument::create([
        'vehicle_id' => $vehiculo->id,
        'user_id' => $userId,
        'document_type' => 'licencia_conduccion',
        'document_number' => '1098765432',
        'file_path' => "documents/{$vehiculo->id}/licencia.pdf",
    ]);

    return [$vehiculo, $documento];
}

test('el endpoint interno de borrado exige token de servicio', function () {
    $userId = (string) Str::uuid();

    $this->deleteJson("/api/v1/internal/users/{$userId}/personal-data")->assertStatus(401);
    $this->withToken(jwtDePrueba($userId))
        ->deleteJson("/api/v1/internal/users/{$userId}/personal-data")
        ->assertStatus(403);
});

test('borra archivos, documentos y da de baja los vehiculos del usuario', function () {
    Storage::fake('private');
    Storage::fake('public');
    $userId = (string) Str::uuid();
    [$vehiculo, $documento] = vehiculoConDocumento($userId, 'ABC123');
    Storage::disk('private')->put($documento->file_path, 'pdf');
    Storage::disk('public')->put($vehiculo->perspective_photo_path, 'img');
    [$ajeno] = vehiculoConDocumento((string) Str::uuid(), 'ZZZ999');

    $this->withToken(tokenDeServicioParaBorrado())
        ->deleteJson("/api/v1/internal/users/{$userId}/personal-data")
        ->assertOk();

    Storage::disk('private')->assertMissing($documento->file_path);
    Storage::disk('public')->assertMissing($vehiculo->perspective_photo_path);
    expect(VehicleDocument::where('user_id', $userId)->count())->toBe(0)
        ->and(Vehicle::where('user_id', $userId)->count())->toBe(0)
        ->and(Vehicle::withTrashed()->find($vehiculo->id)->plate_number)->not->toBe('ABC123')
        ->and(Vehicle::find($ajeno->id))->not->toBeNull();
});
