<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentAccessLog extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'auditor_user_id',
        'target_user_id',
        'vehicle_id',
        'document_id',
        'document_type',
        'access_purpose',
        'ip_address',
        'user_agent',
        'file_hash_sha256',
        'accessed_at',
    ];

    protected function casts(): array
    {
        return [
            'accessed_at' => 'datetime',
        ];
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id');
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(VehicleDocument::class, 'document_id');
    }
}
