<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BetaSignup extends Model
{
    use HasUuids;

    public const PLATFORMS = ['ios', 'android'];

    public $timestamps = false;

    protected $fillable = ['name', 'email', 'university', 'platform', 'role', 'consent_at', 'created_at'];

    protected function casts(): array
    {
        return ['consent_at' => 'datetime', 'created_at' => 'datetime'];
    }
}
