<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateTripRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Solo el propio pasajero autenticado puede reservar un viaje a su nombre.
        return (string) $this->attributes->get('user_id') !== '';
    }

    public function rules(): array
    {
        return [
            'route_id' => ['required', 'string'],
            // driver_id ya no se acepta del cliente: se resuelve consultando route-matching-service.
            // passenger_id ya no se acepta del cliente: siempre es el usuario autenticado (JWT).
            // boarding_pin ya no se acepta del cliente: siempre se genera server-side.
            'vehicle_id' => ['nullable', 'string'],
            'driver_name' => ['nullable', 'string', 'max:120'],
            'passenger_name' => ['nullable', 'string', 'max:120'],
            'vehicle_plate' => ['nullable', 'string', 'max:10'],
            'vehicle_model' => ['nullable', 'string', 'max:80'],
            'pickup_address' => ['required', 'string', 'max:150'],
            'dropoff_address' => ['required', 'string', 'max:150'],
            'total_fare_cop' => ['required', 'numeric', 'min:0', 'max:100000'],
            // Opcional e ignorado: la hora de recogida sale de la ruta (SIM-009).
            'scheduled_pickup_time' => ['nullable', 'date'],
        ];
    }
}
