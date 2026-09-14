<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TripCancellation extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'trip_id',
        'cancelled_by_user_id',
        'canceller_role',
        'reason_category',
        'detailed_reason',
        'minutes_before_departure',
        'had_penalty',
    ];

    protected function casts(): array
    {
        return [
            'minutes_before_departure' => 'integer',
            'had_penalty' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }
}
