<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminTripResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'route_id' => $this->route_id,
            'driver_id' => $this->driver_id,
            'passenger_id' => $this->passenger_id,
            'vehicle_id' => $this->vehicle_id,
            'driver_name' => $this->driver_name,
            'passenger_name' => $this->passenger_name,
            'vehicle_plate' => $this->vehicle_plate,
            'vehicle_model' => $this->vehicle_model,
            'pickup_address' => $this->pickup_address,
            'dropoff_address' => $this->dropoff_address,
            'status' => $this->status,
            'total_fare_cop' => (float) $this->total_fare_cop,
            'is_pin_verified' => (bool) $this->is_pin_verified,
            'scheduled_pickup_time' => $this->scheduled_pickup_time?->toISOString(),
            'actual_pickup_time' => $this->actual_pickup_time?->toISOString(),
            'actual_dropoff_time' => $this->actual_dropoff_time?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
