<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InstitutionCampus extends Model
{
    use HasFactory;

    protected $fillable = [
        'institution_id',
        'name',
        'code',
        'address',
        'image_url',
        'latitude',
        'longitude',
        'is_main_campus',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'is_main_campus' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'campus_id');
    }
}
