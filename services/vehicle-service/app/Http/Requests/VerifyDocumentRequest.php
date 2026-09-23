<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VerifyDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'is_verified' => ['required', 'boolean'],
            'rejection_notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'is_verified.required' => 'El campo is_verified es obligatorio.',
            'is_verified.boolean' => 'El campo is_verified debe ser booleano.',
            'rejection_notes.max' => 'Las notas de rechazo no pueden superar los 500 caracteres.',
        ];
    }
}
