<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WaitlistEntry extends Model
{
    use HasUuids;

    public const ROLES = ['pasajero', 'conductor', 'ambos'];

    public const USUAL_TIMES = ['06-08', '08-10', '10-12', '12-14', '14-16', '16-18', '18-20', '20-22'];

    public const DIRECTIONS = ['hacia_campus', 'desde_campus', 'ambas'];

    public $timestamps = false;

    protected $fillable = [
        'email',
        'university',
        'role',
        'neighborhood',
        'campus_id',
        'usual_time',
        'direction',
        'consent_at',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'consent_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function campus(): BelongsTo
    {
        return $this->belongsTo(InstitutionCampus::class, 'campus_id');
    }
}
