<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletTransaction extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'wallet_id',
        'transaction_type',
        'amount_cop',
        'balance_before_cop',
        'balance_after_cop',
        'reference_id',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount_cop' => 'float',
            'balance_before_cop' => 'float',
            'balance_after_cop' => 'float',
        ];
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(UserWallet::class, 'wallet_id');
    }
}
