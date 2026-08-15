<?php

namespace App\Services;

use App\Models\DocumentAccessLog;
use App\Models\VehicleDocument;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

class HabeasDataAuditService
{
    /**
     * Registrar una consulta a un documento privado garantizando la trazabilidad exigida por la Ley 1581 de 2012.
     */
    public function logAccess(
        string $auditorUserId,
        string $targetUserId,
        VehicleDocument $document,
        string $purpose,
        string $ipAddress,
        string $userAgent
    ): DocumentAccessLog {
        $rutaPrivada = $document->file_path;
        $hashArchivo = '';

        if (Storage::disk('private')->exists($rutaPrivada)) {
            $hashArchivo = hash_file('sha256', Storage::disk('private')->path($rutaPrivada));
        }

        return DocumentAccessLog::create([
            'auditor_user_id' => $auditorUserId,
            'target_user_id' => $targetUserId,
            'vehicle_id' => $document->vehicle_id,
            'document_id' => $document->id,
            'document_type' => $document->document_type,
            'access_purpose' => $purpose,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'file_hash_sha256' => $hashArchivo ?: str_repeat('0', 64),
            'accessed_at' => now(),
        ]);
    }

    /**
     * Generar una URL firmada temporal de 10 minutos para descarga segura de documentos sensibles.
     */
    public function generateSignedDownloadUrl(VehicleDocument $document, array $extraParams = []): string
    {
        $parametros = array_merge([
            'vehicleId' => $document->vehicle_id,
            'documentId' => $document->id,
        ], $extraParams);

        return URL::temporarySignedRoute(
            'vehicles.documents.download',
            now()->addMinutes(10),
            $parametros
        );
    }
}
