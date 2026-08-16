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
            'cancelled_by' => ['required', 'in:conductor,pasajero'],
            'reason' => ['required', 'string', 'min:5', 'max:250'],
        ];
    }

    public function messages(): array
    {
        return [
            'cancelled_by.required' => 'Debes indicar el rol del usuario que cancela.',
            'reason.required' => 'El motivo de cancelación es obligatorio.',
            'reason.min' => 'El motivo debe contener al menos 5 caracteres.',
        ];
    }
}
