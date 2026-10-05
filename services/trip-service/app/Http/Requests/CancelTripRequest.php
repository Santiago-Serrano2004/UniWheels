<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CancelTripRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Opcional e ignorado: el rol lo decide el servidor según el JWT (SIM-010).
            'cancelled_by' => ['nullable', 'string'],
            'reason' => ['required', 'string', 'min:5', 'max:250'],
        ];
    }

    public function messages(): array
    {
        return [
            'reason.required' => 'El motivo de cancelación es obligatorio.',
            'reason.min' => 'El motivo debe contener al menos 5 caracteres.',
        ];
    }
}
