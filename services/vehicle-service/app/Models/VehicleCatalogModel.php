<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VehicleCatalogModel extends Model
{
    use HasFactory;

    protected $fillable = [
        'brand_id',
        'line_name',
        'default_seats',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'default_seats' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(VehicleCatalogBrand::class, 'brand_id');
    }
}
