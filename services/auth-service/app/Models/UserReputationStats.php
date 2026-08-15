<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserReputationStats extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'total_trips_as_driver',
        'total_trips_as_passenger',
        'rating_count_as_driver',
        'rating_count_as_passenger',
        'rating_sum_as_driver',
        'rating_sum_as_passenger',
    ];

    protected function casts(): array
    {
        return [
            'total_trips_as_driver' => 'integer',
            'total_trips_as_passenger' => 'integer',
            'rating_count_as_driver' => 'integer',
            'rating_count_as_passenger' => 'integer',
            'rating_sum_as_driver' => 'float',
            'rating_sum_as_passenger' => 'float',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Promedio de calificación como conductor (visible solo si supera el umbral de 3 viajes).
     */
    public function getAverageRatingAsDriverAttribute(): ?float
    {
        if ($this->rating_count_as_driver < 3) {
            return null; // No visible aún para nuevos usuarios
        }

        return round($this->rating_sum_as_driver / $this->rating_count_as_driver, 2);
    }

    /**
     * Promedio de calificación como pasajero (visible solo si supera el umbral de 3 viajes).
     */
    public function getAverageRatingAsPassengerAttribute(): ?float
    {
        if ($this->rating_count_as_passenger < 3) {
            return null; // No visible aún
        }

        return round($this->rating_sum_as_passenger / $this->rating_count_as_passenger, 2);
    }
}
