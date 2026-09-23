<?php

namespace App\Http\Resources;

use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminTopupResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $tx = $this->additional['transaction'] ?? WalletTransaction::where('reference_id', $this->reference)->first();

        // Extraer user_id de la referencia si tiene formato WR-{userId}-{fecha}-{random}
        $userId = null;
        if ($this->reference && str_starts_with($this->reference, 'WR-')) {
            $parts = explode('-', $this->reference);
            if (count($parts) >= 6) {
                $userId = implode('-', array_slice($parts, 1, 5));
            }
        }

        return [
            'id' => $this->id,
            'event_type' => $this->event_type,
            'transaction_id' => $this->transaction_id,
            'reference' => $this->reference,
            'user_id' => $userId,
            'status' => $this->status,
            'amount_in_cents' => $this->amount_in_cents,
            'amount_cop' => $this->amount_in_cents ? round($this->amount_in_cents / 100, 2) : 0,
            'currency' => $this->currency,
            'signature_valid' => (bool) $this->signature_valid,
            'processed' => (bool) $this->processed,
            'processed_at' => $this->processed_at?->toISOString(),
            'error_message' => $this->error_message,
            'transaction' => $tx ? [
                'id' => $tx->id,
                'wallet_id' => $tx->wallet_id,
                'transaction_type' => $tx->transaction_type,
                'amount_cop' => (float) $tx->amount_cop,
                'balance_before_cop' => (float) $tx->balance_before_cop,
                'balance_after_cop' => (float) $tx->balance_after_cop,
                'status' => $tx->status,
                'notes' => $tx->notes,
                'created_at' => $tx->created_at?->toISOString(),
            ] : null,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
