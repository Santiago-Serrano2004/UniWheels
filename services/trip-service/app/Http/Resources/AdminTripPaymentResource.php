<?php

namespace App\Http\Resources;

use App\Models\Trip;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminTripPaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $trip = $this->additional['trip'] ?? Trip::where('payment_reference', $this->reference)->first();

        return [
            'id' => $this->id,
            'event_type' => $this->event_type,
            'transaction_id' => $this->transaction_id,
            'reference' => $this->reference,
            'status' => $this->status,
            'amount_in_cents' => $this->amount_in_cents,
            'amount_cop' => $this->amount_in_cents ? round($this->amount_in_cents / 100, 2) : 0,
            'currency' => $this->currency,
            'signature_valid' => (bool) $this->signature_valid,
            'processed' => (bool) $this->processed,
            'processed_at' => $this->processed_at?->toISOString(),
            'error_message' => $this->error_message,
            'created_at' => $this->created_at?->toISOString(),
            'trip' => $trip ? [
                'id' => $trip->id,
                'driver_id' => $trip->driver_id,
                'driver_name' => $trip->driver_name,
                'passenger_id' => $trip->passenger_id,
                'passenger_name' => $trip->passenger_name,
                'vehicle_plate' => $trip->vehicle_plate,
                'status' => $trip->status,
                'payment_method' => $trip->payment_method,
                'total_fare_cop' => (float) $trip->total_fare_cop,
                'platform_commission_cop' => (float) $trip->platform_commission_cop,
                'commission_status' => $trip->commission_status,
                'payment_confirmed_at' => $trip->payment_confirmed_at?->toISOString(),
            ] : null,
        ];
    }
}
