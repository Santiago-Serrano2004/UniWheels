<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Retención: esta tabla crece con cada reporte de posición (aprox. cada 5s por
// viaje activo) y todavía no tiene una política de purga automática. En
// producción hace falta un job que borre puntos de viajes ya completados o
// cancelados con más de N días de antigüedad.
class TripTrackingPoint extends Model
{
    use HasUuids;

    // La migración no trae created_at/updated_at — solo recorded_at.
    public $timestamps = false;

    protected $fillable = [
        'trip_id',
        'latitude',
        'longitude',
        'speed_kmh',
        'heading_degrees',
        'accuracy_meters',
        'recorded_at',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'speed_kmh' => 'float',
            'heading_degrees' => 'float',
            'accuracy_meters' => 'float',
            'recorded_at' => 'datetime',
        ];
    }

    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }
}
