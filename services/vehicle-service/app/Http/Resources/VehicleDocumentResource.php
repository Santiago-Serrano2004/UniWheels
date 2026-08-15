<?php

namespace App\Http\Resources;

use App\Services\HabeasDataAuditService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehicleDocumentResource extends JsonResource
{
    /**
     * Transformar el documento del vehículo en una respuesta JSON segura.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $servicioAuditoria = app(HabeasDataAuditService::class);

        return [
            'id' => $this->id,
            'document_type' => $this->document_type,
            'document_number' => $this->document_number,
            'issuer_entity' => $this->issuer_entity,
            'issued_at' => $this->issued_at?->format('Y-m-d'),
            'expires_at' => $this->expires_at?->format('Y-m-d'),
            'is_expired' => $this->isExpired(),
            'is_verified' => (bool) $this->is_verified,
            'verified_at' => $this->verified_at?->toISOString(),
            'secure_download_url' => $servicioAuditoria->generateSignedDownloadUrl($this->resource),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
