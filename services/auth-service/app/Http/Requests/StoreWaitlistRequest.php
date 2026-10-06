<?php

namespace App\Http\Requests;

use App\Models\InstitutionCampus;
use App\Models\WaitlistEntry;
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
            // Se acepta cualquier correo; la universidad se elige de la lista.
            'email' => ['required', 'string', 'email', 'max:255'],
            'university' => ['required', Rule::in(config('landing.universidades'))],
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
                $universidad = $this->input('university');
                if (! $campusId || ! is_string($universidad) || $validator->errors()->has('university')) {
                    return;
                }
                // La lista muestra "Nombre (SIGLA)"; la institución se guarda solo con el nombre.
                $nombre = trim(preg_replace('/\s*\([^)]*\)$/', '', $universidad));
                $belongs = InstitutionCampus::where('id', $campusId)
                    ->whereHas('institution', fn ($q) => $q->where('name', $nombre))
                    ->exists();
                if (! $belongs) {
                    $validator->errors()->add('campus_id', 'La sede no corresponde a la universidad elegida.');
                }
            },
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'El correo es obligatorio.',
            'email.email' => 'Escribe un correo válido.',
            'university.required' => 'Elige tu universidad.',
            'university.in' => 'Elige una universidad de la lista.',
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
