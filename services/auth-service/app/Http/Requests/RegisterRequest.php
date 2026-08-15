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

        // Limpiar código estudiantil si existe
        if ($this->has('student_code') && $this->input('student_code')) {
            $this->merge([
                'student_code' => strtoupper(trim($this->input('student_code'))),
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
            'id_document_number' => ['required', 'string', 'max:30', 'unique:users,id_document_number'],
            'id_document_type' => ['required', 'string', 'in:CC,CE,TI,PASAPORTE'],
            'phone_number' => ['required', 'string', 'max:20'],
            'member_type' => ['required', 'string', 'in:estudiante,docente,administrativo'],
            'student_code' => [
                'nullable',
                'required_if:member_type,estudiante',
                'string',
                'regex:/^U\d{8}$/',
                'unique:users,student_code',
            ],
            'academic_program_or_department' => ['required', 'string', 'max:150'],
            'semester' => ['nullable', 'required_if:member_type,estudiante', 'integer', 'min:1', 'max:12'],
            'password' => ['required', 'string', Password::min(8)->letters()->numbers()],
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
            'id_document_number.required' => 'El número de documento de identidad es obligatorio.',
            'id_document_number.unique' => 'Ya existe un usuario registrado con este documento de identidad.',
            'phone_number.required' => 'El número de teléfono móvil es obligatorio.',
            'member_type.required' => 'Debes indicar si eres estudiante, docente o administrativo.',
            'student_code.required_if' => 'El código estudiantil es obligatorio para estudiantes.',
            'student_code.regex' => 'El código estudiantil debe iniciar con la letra U seguida de 8 dígitos numéricos (Ej: U00123456).',
            'student_code.unique' => 'Este código estudiantil ya se encuentra registrado.',
            'academic_program_or_department.required' => 'El programa académico o departamento es obligatorio.',
            'semester.required_if' => 'El semestre académico es obligatorio para estudiantes.',
            'password.required' => 'La contraseña es obligatoria.',
        ];
    }
}
