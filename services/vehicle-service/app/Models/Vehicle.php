<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vehicle extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'user_id',
        'vehicle_type',
        'plate_number',
        'brand',
        'model_line',
        'year',
        'color',
        'available_seats',
        'has_ac',
        'has_trunk',
        'has_extra_helmet',
        'perspective_photo_path',
        'status',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'available_seats' => 'integer',
            'has_ac' => 'boolean',
            'has_trunk' => 'boolean',
            'has_extra_helmet' => 'boolean',
        ];
    }

    public function documents(): HasMany
    {
        return $this->hasMany(VehicleDocument::class, 'vehicle_id');
    }

    public function accessLogs(): HasMany
    {
        return $this->hasMany(DocumentAccessLog::class, 'vehicle_id');
    }

    /**
     * Determina si el vehículo requiere Revisión Técnico-Mecánica según la legislación colombiana (Ley 2294 de 2023).
     */
    public function requiresRTM(): bool
    {
        $edadVehiculo = (int) date('Y') - $this->year;

        if ($this->vehicle_type === 'moto') {
            return $edadVehiculo >= 2; // Motos: a partir del 2º año
        }

        return $edadVehiculo >= 5; // Carros particulares: a partir del 5º año
    }

    /**
     * Verifica si el vehículo tiene todos sus documentos obligatorios aprobados y vigentes.
     */
    public function isFullyCompliant(): bool
    {
        $documentosRequeridos = ['licencia_conduccion', 'soat', 'tarjeta_propiedad'];

        if ($this->requiresRTM()) {
            $documentosRequeridos[] = 'revision_tecnico_mecanica';
        }

        $documentosAprobados = $this->documents()
            ->whereIn('document_type', $documentosRequeridos)
            ->where('is_verified', true)
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>=', now()->toDateString());
            })
            ->pluck('document_type')
            ->toArray();

        return count(array_intersect($documentosRequeridos, $documentosAprobados)) === count($documentosRequeridos);
    }
}
