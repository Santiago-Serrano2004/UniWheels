<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class UniversityContact extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = ['name', 'email', 'university', 'position', 'phone', 'message', 'created_at'];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }
}
