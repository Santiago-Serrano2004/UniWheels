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
        $prefijoCorreo = trim($this->input('email_prefix', ''));

        // Si se suministra el prefijo, concatenar automáticamente el dominio institucional
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

        // Si no viene id_document_number pero viene student_code, usarlo como identificador
        if (!$this->has('id_document_number') && $this->has('student_code')) {
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
            'id_document_number' => ['nullable', 'string', 'max:30'],
            'id_document_type' => ['nullable', 'string', 'in:CC,CE,TI,PASAPORTE'],
            'phone_number' => ['nullable', 'string', 'max:20'],
            'student_code' => ['nullable', 'string', 'max:30', 'regex:/^U[0-9]{8}$/i'],
            'academic_program_or_department' => ['nullable', 'string', 'max:150'],
            'semester' => ['nullable', 'integer', 'min:1', 'max:12'],
            'password' => ['required', 'string', Password::min(8)->letters()->numbers()],
            'profile_photo' => ['nullable'],
            'profile_photo_path' => ['nullable', 'string'],
            'is_driver' => ['boolean'],
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
            'password.required' => 'La contraseña es obligatoria.',
        ];
    }
}
