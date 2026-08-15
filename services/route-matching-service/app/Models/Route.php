<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Route extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'driver_id',
        'vehicle_id',
        'origin_name',
        'destination_campus_id',
        'destination_campus_name',
        'scheduled_departure_time',
        'target_arrival_time',
        'estimated_duration_minutes',
        'max_detour_minutes',
        'accumulated_detour_minutes',
        'available_seats',
        'base_contribution_cop',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_departure_time' => 'datetime',
            'target_arrival_time' => 'datetime',
            'estimated_duration_minutes' => 'float',
            'max_detour_minutes' => 'integer',
            'accumulated_detour_minutes' => 'float',
            'available_seats' => 'integer',
            'base_contribution_cop' => 'float',
        ];
    }

    public function stops(): HasMany
    {
        return $this->hasMany(RouteStop::class, 'route_id')->orderBy('stop_order');
    }

    public function tripRequests(): HasMany
    {
        return $this->hasMany(TripRequest::class, 'route_id');
    }

    /**
     * Consultar rutas activas que pasen a menos de $radioMetros del punto de recogida del pasajero (Modalidad 1).
     */
    public static function findNearbyDirectRoutes(float $lat, float $lng, int $radioMetros = 500)
    {
        return self::where('status', 'publicada')
            ->where('available_seats', '>', 0)
            ->where('scheduled_departure_time', '>', now())
            ->whereRaw(
                'ST_DWithin(path_geometry::geography, ST_SetSRID(ST_Point(?, ?), 4326)::geography, ?)',
                [$lng, $lat, $radioMetros]
            )
            ->get();
    }
}
