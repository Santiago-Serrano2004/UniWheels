<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminUserListResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'student_code' => $this->student_code,
            'role' => $this->getRoleNames()->first() ?? 'estudiante',
            'roles' => $this->getRoleNames(),
            'is_active' => (bool) $this->is_active,
            'suspended_until' => $this->suspended_until?->toISOString(),
            'is_driver' => (bool) $this->is_driver,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
