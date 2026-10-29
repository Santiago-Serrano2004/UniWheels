<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ContributionSuggestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vehicle_id' => ['required', 'uuid'],
            'origin_lat' => ['required', 'numeric', 'between:6.80,7.35'],
            'origin_lng' => ['required', 'numeric', 'between:-73.35,-72.95'],
            'destination_lat' => ['required', 'numeric', 'between:6.80,7.35'],
            'destination_lng' => ['required', 'numeric', 'between:-73.35,-72.95'],
        ];
    }
}
