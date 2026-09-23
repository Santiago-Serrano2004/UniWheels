<?php

namespace App\Services;

use App\Models\Vehicle;
use App\Models\VehicleDocument;

class VehicleDocumentVerificationService
{
    /**
     * Devuelve los tipos de documentos requeridos para un vehículo según la normativa colombiana.
     * SOAT y licencia siempre obligatorios; RTM obligatoria para carros >= 5 años o motos >= 2 años.
     *
     * @return array<int, string>
     */
    public function getRequiredDocumentTypes(Vehicle $vehicle): array
    {
        $types = ['soat', 'licencia_conduccion'];

        if ($vehicle->requiresRTM()) {
            $types[] = 'revision_tecnico_mecanica';
        }

        return $types;
    }

    /**
     * Procesa la verificación o rechazo de un documento y recalcula el estado general del vehículo.
     */
    public function verifyDocument(
        VehicleDocument $document,
        bool $isVerified,
        ?string $rejectionNotes,
        string $adminUserId
    ): VehicleDocument {
        $document->update([
            'is_verified' => $isVerified,
            'verified_at' => $isVerified ? now() : null,
            'verified_by_user_id' => $adminUserId,
            'rejection_notes' => $isVerified ? null : $rejectionNotes,
        ]);

        $vehicle = $document->vehicle->fresh(['documents']);
        $this->updateVehicleStatus($vehicle);

        return $document->fresh();
    }

    /**
     * Recalcula y persiste el estado del vehículo basado en el estado de sus documentos.
     * - Si algún documento está rechazado (con notas): estado 'rechazado' y rejection_reason armado.
     * - Si todos los documentos requeridos están verificados: estado 'aprobado'.
     * - En cualquier otro caso: estado 'pendiente_revision'.
     */
    public function updateVehicleStatus(Vehicle $vehicle): Vehicle
    {
        $documents = $vehicle->documents;

        $rejectedDocs = $documents->filter(
            fn (VehicleDocument $doc) => ! $doc->is_verified && ! empty($doc->rejection_notes)
        );

        if ($rejectedDocs->isNotEmpty()) {
            $reasons = $rejectedDocs->map(
                fn (VehicleDocument $doc) => "{$doc->document_type}: {$doc->rejection_notes}"
            )->implode(' | ');

            $vehicle->update([
                'status' => 'rechazado',
                'rejection_reason' => $reasons,
            ]);

            return $vehicle;
        }

        $requiredTypes = $this->getRequiredDocumentTypes($vehicle);
        $verifiedTypes = $documents->where('is_verified', true)->pluck('document_type')->all();

        $allRequiredVerified = count(array_diff($requiredTypes, $verifiedTypes)) === 0;

        if ($allRequiredVerified) {
            $vehicle->update([
                'status' => 'aprobado',
                'rejection_reason' => null,
            ]);
        } else {
            $vehicle->update([
                'status' => 'pendiente_revision',
                'rejection_reason' => null,
            ]);
        }

        return $vehicle;
    }
}
