<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TripRequest extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'passenger_id',
        'route_id',
        'pickup_name',
        'dropoff_campus_id',
        'request_mode',
        'calculated_detour_minutes',
        'suggested_contribution_cop',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'calculated_detour_minutes' => 'float',
            'suggested_contribution_cop' => 'float',
        ];
    }

    public function route(): BelongsTo
    {
        return $this->belongsTo(Route::class, 'route_id');
    }
}
