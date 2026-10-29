<?php

namespace App\Http\Requests;

use App\Http\Controllers\Api\V1\RouteStatusController;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRouteStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(array_keys(RouteStatusController::TRANSICIONES))],
        ];
    }
}
