<?php

namespace App\Http\Requests;

use App\Models\InstitutionCampus;
use App\Models\WaitlistEntry;
use App\Rules\InstitutionalEmailRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWaitlistRequest extends FormRequest
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
            // Sin institution_id: la institución se deduce del dominio del correo.
            'email' => ['required', 'string', 'max:255', new InstitutionalEmailRule],
            'role' => ['required', Rule::in(WaitlistEntry::ROLES)],
            'neighborhood' => ['required', 'string', 'max:80'],
            'campus_id' => ['nullable', 'integer', 'exists:institution_campuses,id'],
            'usual_time' => ['required', Rule::in(WaitlistEntry::USUAL_TIMES)],
            'direction' => ['required', Rule::in(WaitlistEntry::DIRECTIONS)],
            'consent' => ['required', 'accepted'],
        ];
    }

    public function after(): array
    {
        return [
            function ($validator) {
                $campusId = $this->input('campus_id');
                $email = $this->input('email');
                if (! $campusId || ! is_string($email) || ! str_contains($email, '@') || $validator->errors()->has('email')) {
                    return;
                }
                $domain = substr(strrchr($email, '@'), 1);
                $belongs = InstitutionCampus::where('id', $campusId)
                    ->whereHas('institution', fn ($q) => $q->where('domain', $domain))
                    ->exists();
                if (! $belongs) {
                    $validator->errors()->add('campus_id', 'La sede no corresponde a la institución de tu correo.');
                }
            },
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'El correo institucional es obligatorio.',
            'role.required' => 'Indica cómo quieres usar UniWheels.',
            'role.in' => 'La opción seleccionada no es válida.',
            'neighborhood.required' => 'El barrio es obligatorio.',
            'neighborhood.max' => 'El barrio no puede superar 80 caracteres.',
            'campus_id.exists' => 'La sede seleccionada no existe.',
            'usual_time.required' => 'Selecciona tu franja horaria habitual.',
            'usual_time.in' => 'La franja horaria no es válida.',
            'direction.required' => 'Selecciona el sentido del viaje.',
            'direction.in' => 'El sentido seleccionado no es válido.',
            'consent.required' => 'Debes autorizar el tratamiento de tu correo para inscribirte.',
            'consent.accepted' => 'Debes autorizar el tratamiento de tu correo para inscribirte.',
        ];
    }
}
