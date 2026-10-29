<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LateCancellationSuspensionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'late_cancellations_count' => ['required', 'integer', 'min:1'],
            'days' => ['required', 'integer', 'between:1,90'],
        ];
    }
}
