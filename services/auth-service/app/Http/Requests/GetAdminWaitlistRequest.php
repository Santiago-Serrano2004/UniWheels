<?php

namespace App\Http\Requests;

use App\Models\WaitlistEntry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GetAdminWaitlistRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'role' => ['nullable', Rule::in(WaitlistEntry::ROLES)],
            'campus_id' => ['nullable', 'integer'],
            'direction' => ['nullable', Rule::in(WaitlistEntry::DIRECTIONS)],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
