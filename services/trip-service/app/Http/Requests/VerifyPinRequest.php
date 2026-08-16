<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VerifyPinRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'pin' => ['required', 'string', 'regex:/^[0-9]{4}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'pin.required' => 'El código PIN de 4 dígitos es obligatorio.',
            'pin.regex' => 'El PIN debe ser un código numérico exacto de 4 dígitos (ej. 4829).',
        ];
    }
}
