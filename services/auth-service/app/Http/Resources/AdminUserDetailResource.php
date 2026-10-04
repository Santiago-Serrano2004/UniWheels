<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminUserDetailResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $reputacion = $this->reputationStats;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'id_document_number' => $this->id_document_number,
            'id_document_type' => $this->id_document_type,
            'phone_number' => $this->phone_number,
            'profile_photo_url' => $this->profile_photo_path ? asset('storage/'.$this->profile_photo_path) : null,
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
                'rating_count_as_driver' => $reputacion?->rating_count_as_driver ?? 0,
                'rating_count_as_passenger' => $reputacion?->rating_count_as_passenger ?? 0,
                'average_rating_as_driver' => $reputacion?->average_rating_as_driver,
                'average_rating_as_passenger' => $reputacion?->average_rating_as_passenger,
                'has_public_rating' => ($reputacion?->rating_count_as_driver >= 3 || $reputacion?->rating_count_as_passenger >= 3),
            ],
            'is_driver' => (bool) $this->is_driver,
            'is_active' => (bool) $this->is_active,
            'roles' => $this->getRoleNames(),
            'suspension_logs' => $this->suspensionLogs->map(fn ($log) => [
                'id' => $log->id,
                'action' => $log->action,
                'reason' => $log->reason,
                'admin_user_id' => $log->admin_user_id,
                'admin_name' => $log->admin?->name,
                'created_at' => $log->created_at?->toISOString(),
            ]),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
