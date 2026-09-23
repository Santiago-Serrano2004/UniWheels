<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminVehicleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $docs = $this->relationLoaded('documents') ? $this->documents : $this->documents()->get();

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'vehicle_type' => $this->vehicle_type,
            'plate_number' => $this->plate_number,
            'brand' => $this->brand,
            'model_line' => $this->model_line,
            'year' => $this->year,
            'color' => $this->color,
            'available_seats' => $this->available_seats,
            'features' => [
                'has_ac' => (bool) $this->has_ac,
                'has_trunk' => (bool) $this->has_trunk,
                'has_extra_helmet' => (bool) $this->has_extra_helmet,
            ],
            'perspective_photo_url' => $this->perspective_photo_path ? asset('storage/'.$this->perspective_photo_path) : null,
            'status' => $this->status,
            'rejection_reason' => $this->rejection_reason,
            'documents_summary' => [
                'total' => $docs->count(),
                'verified' => $docs->where('is_verified', true)->count(),
                'rejected' => $docs->filter(fn ($d) => ! $d->is_verified && ! empty($d->rejection_notes))->count(),
                'pending' => $docs->filter(fn ($d) => ! $d->is_verified && empty($d->rejection_notes))->count(),
            ],
            'legal_compliance' => [
                'requires_rtm' => $this->requiresRTM(),
            ],
            'documents' => VehicleDocumentResource::collection($this->whenLoaded('documents')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
