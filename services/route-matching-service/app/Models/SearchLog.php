<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SearchLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'passenger_id',
        'results_count',
        'modality_1_count',
        'modality_2_count',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'results_count' => 'integer',
            'modality_1_count' => 'integer',
            'modality_2_count' => 'integer',
            'created_at' => 'datetime',
        ];
    }
}
