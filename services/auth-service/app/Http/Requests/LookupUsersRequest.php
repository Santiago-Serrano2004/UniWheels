<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LookupUsersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'ids.required' => 'La lista de IDs es requerida.',
            'ids.array' => 'El campo ids debe ser un arreglo.',
            'ids.max' => 'No puedes consultar más de 100 usuarios en una sola petición.',
        ];
    }
}
