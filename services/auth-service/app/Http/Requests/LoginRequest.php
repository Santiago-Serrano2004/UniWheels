<?php

namespace App\Http\Requests;

use App\Models\Institution;
use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Normalizar el identificador de usuario antes de validar.
     */
    protected function prepareForValidation(): void
    {
        $prefijoCorreo = trim($this->input('email_prefix', ''));
        $idInstitucion = $this->input('institution_id');

        if ($prefijoCorreo !== '' && $idInstitucion) {
            $institucion = Institution::find($idInstitucion);
            if ($institucion) {
                $prefijoLimpio = explode('@', $prefijoCorreo)[0];
                $this->merge([
                    'email' => strtolower($prefijoLimpio . '@' . $institucion->domain),
                ]);
            }
        } elseif ($this->has('email')) {
            $this->merge([
                'email' => strtolower(trim($this->input('email'))),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'El correo electrónico o prefijo institucional es obligatorio.',
            'password.required' => 'La contraseña es obligatoria.',
        ];
    }
}
