<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SearchMatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'pickup_lat' => ['required', 'numeric', 'between:6.80,7.35'],
            'pickup_lng' => ['required', 'numeric', 'between:-73.35,-72.95'],
            'destination_campus_id' => ['required', 'integer'],
            'preferred_time' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'pickup_lat.required' => 'Debes indicar la latitud del punto de abordaje.',
            'pickup_lng.required' => 'Debes indicar la longitud del punto de abordaje.',
            'destination_campus_id.required' => 'Debes seleccionar el campus universitario de destino.',
        ];
    }
}
