<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TripSosEvent extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'trip_id',
        'triggered_by_user_id',
        'latitude',
        'longitude',
        'emergency_type',
        'triggered_at',
        'attended_at',
        'attended_by_user_id',
        'attention_notes',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'triggered_at' => 'datetime',
            'attended_at' => 'datetime',
        ];
    }

    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }
}
