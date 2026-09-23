<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminSosEventResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $trip = $this->trip;

        return [
            'id' => $this->id,
            'trip_id' => $this->trip_id,
            'triggered_by_user_id' => $this->triggered_by_user_id,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'emergency_type' => $this->emergency_type,
            'triggered_at' => $this->triggered_at?->toISOString(),
            'attended_at' => $this->attended_at?->toISOString(),
            'attended_by_user_id' => $this->attended_by_user_id,
            'attention_notes' => $this->attention_notes,
            'is_attended' => $this->attended_at !== null,
            'trip' => $trip ? [
                'id' => $trip->id,
                'driver_id' => $trip->driver_id,
                'driver_name' => $trip->driver_name,
                'passenger_id' => $trip->passenger_id,
                'passenger_name' => $trip->passenger_name,
                'vehicle_plate' => $trip->vehicle_plate,
                'vehicle_model' => $trip->vehicle_model,
                'pickup_address' => $trip->pickup_address,
                'dropoff_address' => $trip->dropoff_address,
                'status' => $trip->status,
                'payment_method' => $trip->payment_method,
                'total_fare_cop' => $trip->total_fare_cop,
                'scheduled_pickup_time' => $trip->scheduled_pickup_time?->toISOString(),
            ] : null,
        ];
    }
}
