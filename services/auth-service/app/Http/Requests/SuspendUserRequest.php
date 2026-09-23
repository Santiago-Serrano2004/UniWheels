<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SuspendUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'suspended' => ['required', 'boolean'],
            'reason' => ['required_if:suspended,true', 'nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'suspended.required' => 'El campo suspended es obligatorio.',
            'suspended.boolean' => 'El campo suspended debe ser booleano.',
            'reason.required_if' => 'La razón es obligatoria al suspender a un usuario.',
        ];
    }
}
