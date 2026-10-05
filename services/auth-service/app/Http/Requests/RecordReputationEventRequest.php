<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RecordReputationEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'string', 'in:rating,trip_completed'],
            'role' => ['required', 'string', 'in:conductor,pasajero'],
            'score' => ['required_if:type,rating', 'nullable', 'integer', 'between:1,5'],
        ];
    }
}
