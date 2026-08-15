<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RouteStop extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'route_id',
        'stop_order',
        'stop_type',
        'stop_name',
        'passenger_id',
        'is_detour',
        'detour_minutes_added',
        'extra_fee_cop',
        'estimated_arrival_time',
    ];

    protected function casts(): array
    {
        return [
            'stop_order' => 'integer',
            'is_detour' => 'boolean',
            'detour_minutes_added' => 'float',
            'extra_fee_cop' => 'float',
            'estimated_arrival_time' => 'datetime',
        ];
    }

    public function route(): BelongsTo
    {
        return $this->belongsTo(Route::class, 'route_id');
    }
}
