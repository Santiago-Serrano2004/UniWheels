<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateTripRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'route_id' => ['required', 'uuid'],
            'driver_id' => ['required', 'uuid'],
            'passenger_id' => ['required', 'uuid'],
            'vehicle_id' => ['nullable', 'uuid'],
            'driver_name' => ['nullable', 'string', 'max:120'],
            'passenger_name' => ['nullable', 'string', 'max:120'],
            'vehicle_plate' => ['nullable', 'string', 'max:10'],
            'vehicle_model' => ['nullable', 'string', 'max:80'],
            'pickup_address' => ['required', 'string', 'max:150'],
            'dropoff_address' => ['required', 'string', 'max:150'],
            'total_fare_cop' => ['required', 'numeric', 'min:2000'],
            'scheduled_pickup_time' => ['required', 'date'],
            'boarding_pin' => ['nullable', 'string', 'regex:/^[0-9]{4}$/'],
        ];
    }
}
