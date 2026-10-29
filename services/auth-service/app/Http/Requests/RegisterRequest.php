<?php

namespace App\Http\Requests;

use App\Models\Institution;
use App\Rules\InstitutionalEmailRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Preparar y normalizar los datos de entrada antes de la validación.
     */
    protected function prepareForValidation(): void
    {
        $idInstitucion = $this->input('institution_id');
        $prefijoCorreo = $this->input('email_prefix');
        $prefijoCorreo = is_string($prefijoCorreo) ? trim($prefijoCorreo) : '';

        // Si se suministra el prefijo, concatenar automáticamente el dominio institucional
        if ($prefijoCorreo !== '' && is_scalar($idInstitucion) && $idInstitucion) {
            $institucion = Institution::find($idInstitucion);
            if ($institucion) {
                $prefijoLimpio = explode('@', $prefijoCorreo)[0];
                $this->merge([
                    'email' => strtolower($prefijoLimpio.'@'.$institucion->domain),
                ]);
            }
        } elseif (is_string($this->input('email'))) {
            $this->merge([
                'email' => strtolower(trim($this->input('email'))),
            ]);
        }

        // Si no viene id_document_number pero viene student_code, usarlo como identificador
        if (! $this->has('id_document_number') && $this->has('student_code')) {
            $this->merge([
                'id_document_number' => $this->input('student_code'),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'institution_id' => ['required', 'exists:institutions,id'],
            'campus_id' => ['nullable', 'exists:institution_campuses,id'],
            'email' => [
                'required',
                'string',
                'max:150',
                'unique:users,email',
                new InstitutionalEmailRule($this->input('institution_id')),
            ],
            'id_document_number' => ['nullable', 'string', 'max:30', 'unique:users,id_document_number'],
            'id_document_type' => ['nullable', 'string', 'in:CC,CE,TI,PASAPORTE'],
            'phone_number' => ['required', 'string', 'regex:/^3[0-9]{9}$/'],
            'student_code' => ['nullable', 'string', 'max:30', 'regex:/^U[0-9]{8}$/i'],
            'academic_program_or_department' => ['nullable', 'string', 'max:150'],
            'semester' => ['nullable', 'integer', 'min:1', 'max:12'],
            'password' => ['required', 'string', Password::min(8)->letters()->mixedCase()->numbers()->symbols()],
            'verification_code' => ['required', 'string', 'size:6'],
            'phone_verification_code' => ['nullable', 'string', 'size:6'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'El nombre completo es obligatorio.',
            'institution_id.required' => 'Debes seleccionar tu universidad.',
            'institution_id.exists' => 'La institución seleccionada no es válida.',
            'campus_id.exists' => 'La sede universitaria seleccionada no es válida.',
            'email.required' => 'El correo o prefijo institucional es obligatorio.',
            'email.unique' => 'Ya existe una cuenta registrada con este correo institucional.',
            'id_document_number.unique' => 'Ya existe una cuenta registrada con ese código estudiantil o número de documento.',
            'password.required' => 'La contraseña es obligatoria.',
            'verification_code.required' => 'El código de verificación PIN es obligatorio.',
            'verification_code.size' => 'El código de verificación debe tener exactamente 6 dígitos.',
            'phone_number.required' => 'Tu número de celular es obligatorio.',
            'phone_number.regex' => 'Ingresa un celular colombiano válido de 10 dígitos (ej: 3151234567).',
            'phone_verification_code.size' => 'El código de verificación SMS debe tener exactamente 6 dígitos.',
        ];
    }
}
