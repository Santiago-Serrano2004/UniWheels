<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transformar el modelo de usuario en un arreglo JSON estandarizado.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $reputacion = $this->reputationStats;
        $billetera = $this->wallet;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'id_document_number' => $this->id_document_number,
            'id_document_type' => $this->id_document_type,
            'phone_number' => $this->phone_number,
            'profile_photo_url' => $this->profile_photo_path ? asset('storage/' . $this->profile_photo_path) : null,
            'institution' => new InstitutionResource($this->whenLoaded('institution')),
            'campus' => $this->campus ? [
                'id' => $this->campus->id,
                'name' => $this->campus->name,
                'code' => $this->campus->code,
            ] : null,
            'academic_profile' => [
                'member_type' => $this->member_type,
                'student_code' => $this->student_code,
                'academic_program_or_department' => $this->academic_program_or_department,
                'semester' => $this->semester,
            ],
            'reputation' => [
                'total_trips_as_driver' => $reputacion?->total_trips_as_driver ?? 0,
                'total_trips_as_passenger' => $reputacion?->total_trips_as_passenger ?? 0,
                'average_rating_as_driver' => $reputacion?->average_rating_as_driver, // null si < 3 viajes
                'average_rating_as_passenger' => $reputacion?->average_rating_as_passenger, // null si < 3 viajes
                'has_public_rating' => ($reputacion?->rating_count_as_driver >= 3 || $reputacion?->rating_count_as_passenger >= 3),
            ],
            'wallet' => [
                'balance_cop' => (float) ($billetera?->balance_cop ?? 0.00),
                'is_locked' => (bool) ($billetera?->is_locked ?? false),
            ],
            'is_driver' => (bool) $this->is_driver,
            'is_active' => (bool) $this->is_active,
            'verification' => [
                'is_email_verified' => (bool) $this->email_verified_at,
                'verification_expires_at' => $this->verification_expires_at?->toISOString(),
                'is_verification_active' => $this->hasValidInstitutionalVerification(),
            ],
            'roles' => $this->getRoleNames(),
            'permissions' => $this->getAllPermissions()->pluck('name'),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
