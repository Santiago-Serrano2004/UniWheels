<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PublishRouteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // driver_id ya no se acepta del cliente: se toma del JWT verificado (ver RouteController::store).
            'vehicle_id' => ['required', 'uuid'],
            'origin_name' => ['required', 'string', 'max:150'],
            'origin_lat' => ['required', 'numeric', 'between:6.80,7.35'],
            'origin_lng' => ['required', 'numeric', 'between:-73.35,-72.95'],
            'destination_campus_id' => ['required', 'integer'],
            'destination_campus_name' => ['required', 'string', 'max:100'],
            'destination_lat' => ['required', 'numeric', 'between:6.80,7.35'],
            'destination_lng' => ['required', 'numeric', 'between:-73.35,-72.95'],
            'scheduled_departure_time' => ['required', 'date', 'after:now'],
            'target_arrival_time' => ['required', 'date', 'after:scheduled_departure_time'],
            'available_seats' => ['required', 'integer', 'min:1', 'max:6'],
            'base_contribution_cop' => ['required', 'integer', 'min:0'],
            'max_detour_minutes' => ['nullable', 'integer', 'min:5', 'max:30'],
            'coordinates' => ['nullable', 'array', 'min:2'],
            'coordinates.*' => ['array', 'size:2'],
            'coordinates.*.0' => ['numeric'], // latitud
            'coordinates.*.1' => ['numeric'], // longitud
        ];
    }

    public function messages(): array
    {
        return [
            'scheduled_departure_time.after' => 'La hora de salida debe ser futura.',
            'target_arrival_time.after' => 'La hora límite de llegada a clase debe ser posterior a la hora de salida programada.',
            'available_seats.min' => 'Debes ofertar al menos 1 cupo disponible.',
        ];
    }
}
