<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class DevicePushToken extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'token',
        'platform',
        'device_name',
        'app_version',
        'is_active',
        'last_used_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_used_at' => 'datetime',
    ];

    public function scopeActiveForUser($query, string $userId)
    {
        return $query->where('user_id', $userId)->where('is_active', true);
    }
}
