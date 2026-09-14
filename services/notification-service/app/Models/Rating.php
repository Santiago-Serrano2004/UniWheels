<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Rating extends Model
{
    use HasUuids;

    protected $fillable = [
        'trip_id',
        'rater_user_id',
        'rated_user_id',
        'role_rated',
        'score',
        'optional_comment',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'integer',
        ];
    }
}
