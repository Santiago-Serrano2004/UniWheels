<?php

namespace App\Http\Requests;

use App\Models\BetaSignup;
use App\Models\WaitlistEntry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBetaSignupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => strtolower(trim($this->input('email')))]);
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:80'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'university' => ['required', Rule::in(config('landing.universidades'))],
            'platform' => ['required', Rule::in(BetaSignup::PLATFORMS)],
            'role' => ['required', Rule::in(WaitlistEntry::ROLES)],
            'consent' => ['required', 'accepted'],
        ];
    }
}
