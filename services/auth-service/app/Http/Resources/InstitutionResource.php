<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InstitutionResource extends JsonResource
{
    /**
     * Transformar el recurso de institución y sus sedes en un arreglo estructurado.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'domain' => $this->domain,
            'logo_url' => $this->logo_url,
            'welcome_image_url' => $this->welcome_image_url,
            'is_active' => (bool) $this->is_active,
            'campuses' => $this->campuses ? $this->campuses->map(fn ($campus) => [
                'id' => $campus->id,
                'name' => $campus->name,
                'code' => $campus->code,
                'address' => $campus->address,
                'latitude' => (float) $campus->latitude,
                'longitude' => (float) $campus->longitude,
            ]) : [],
        ];
    }
}
