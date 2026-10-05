<?php

use App\Models\DocumentAccessLog;
use App\Models\Vehicle;
use App\Models\VehicleDocument;
use App\Services\HabeasDataAuditService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('private');
});

function documentoParaDescargar(string $duenoId): VehicleDocument
{
    $vehiculo = Vehicle::create([
        'user_id' => $duenoId,
        'vehicle_type' => 'carro',
        'plate_number' => 'DWN123',
        'brand' => 'Kia',
        'model_line' => 'Rio',
        'year' => 2023,
        'color' => 'Negro',
        'available_seats' => 4,
        'status' => 'aprobado',
    ]);

    $documento = VehicleDocument::create([
        'vehicle_id' => $vehiculo->id,
        'user_id' => $duenoId,
        'document_type' => 'soat',
        'file_path' => "documents/{$vehiculo->id}/soat.pdf",
    ]);
    Storage::disk('private')->put($documento->file_path, 'contenido-del-pdf');

    return $documento;
}

function urlDeDescarga(VehicleDocument $documento, array $extra = []): string
{
    return app(HabeasDataAuditService::class)->generateSignedDownloadUrl($documento, $extra);
}

test('el auditor de la bitacora sale del JWT, no del query string', function () {
    $dueno = (string) Str::uuid();
    $admin = (string) Str::uuid();
    $falsificado = (string) Str::uuid();
    $documento = documentoParaDescargar($dueno);

    // Aunque la URL firmada traiga un auditor_id ajeno, la bitácora registra a quien descarga.
    $url = urlDeDescarga($documento, ['auditor_id' => $falsificado, 'purpose' => 'auditoria']);

    test()->withToken(jwtDePrueba($admin, ['administrador']))->get($url)->assertOk();

    $log = DocumentAccessLog::where('document_id', $documento->id)->firstOrFail();
    expect($log->auditor_user_id)->toBe($admin)
        ->and($log->auditor_user_id)->not->toBe($falsificado)
        ->and($log->target_user_id)->toBe($dueno)
        ->and($log->access_purpose)->toBe('auditoria');
});

test('sin purpose se registra verificacion', function () {
    $dueno = (string) Str::uuid();
    $documento = documentoParaDescargar($dueno);

    test()->withToken(jwtDePrueba($dueno))->get(urlDeDescarga($documento))->assertOk();

    expect(DocumentAccessLog::where('document_id', $documento->id)->value('access_purpose'))->toBe('verificacion');
});

test('un purpose fuera de la lista fija se rechaza con 422 y no deja bitacora', function () {
    $dueno = (string) Str::uuid();
    $documento = documentoParaDescargar($dueno);

    test()->withToken(jwtDePrueba($dueno))
        ->getJson(urlDeDescarga($documento, ['purpose' => 'curiosidad']))
        ->assertStatus(422);

    expect(DocumentAccessLog::count())->toBe(0);
});
