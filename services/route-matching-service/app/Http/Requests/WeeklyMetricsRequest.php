<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class WeeklyMetricsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'weeks' => ['nullable', 'integer', 'between:1,52'],
        ];
    }

    public function weeks(): int
    {
        return (int) ($this->validated('weeks') ?? 12);
    }
}
