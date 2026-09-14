<?php

namespace App\Http\Requests;

use App\Models\Notification;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SendNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        // La restricción real (solo servicios internos) la aplica el middleware jwt.service.
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'uuid'],
            'title' => ['required', 'string', 'max:150'],
            'body' => ['required', 'string', 'max:500'],
            'type' => ['required', 'string', Rule::in([
                Notification::TYPE_VIAJE_RESERVADO,
                Notification::TYPE_CONDUCTOR_EN_CAMINO,
                Notification::TYPE_CONDUCTOR_LLEGA,
                Notification::TYPE_ABORDAJE_PIN,
                Notification::TYPE_VIAJE_FINALIZADO,
                Notification::TYPE_CANCELACION,
                Notification::TYPE_SEGURIDAD,
            ])],
            'payload_json' => ['nullable', 'array'],
        ];
    }
}
