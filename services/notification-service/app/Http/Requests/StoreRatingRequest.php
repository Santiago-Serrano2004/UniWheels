<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRatingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (string) $this->attributes->get('user_id') !== '';
    }

    public function rules(): array
    {
        return [
            'trip_id' => ['required', 'uuid'],
            'rated_user_id' => ['required', 'uuid'],
            'role_rated' => ['required', 'string', 'in:conductor,pasajero'],
            'score' => ['required', 'integer', 'min:1', 'max:5'],
            'optional_comment' => ['nullable', 'string', 'max:500'],
        ];
    }
}
