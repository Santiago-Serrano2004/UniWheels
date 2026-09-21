<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WompiWebhookEvent extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'event_type',
        'transaction_id',
        'reference',
        'status',
        'amount_in_cents',
        'currency',
        'checksum',
        'signature_valid',
        'processed',
        'processed_at',
        'error_message',
        'payload',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'signature_valid' => 'boolean',
            'processed' => 'boolean',
            'processed_at' => 'datetime',
            'amount_in_cents' => 'integer',
        ];
    }
}
