<?php

namespace App\Rules;

use App\Models\Institution;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class InstitutionalEmailRule implements ValidationRule
{
    protected ?int $institutionId;

    public function __construct(?int $institutionId = null)
    {
        $this->institutionId = $institutionId;
    }

    /**
     * Ejecutar la regla de validación institucional.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $fail('El correo electrónico no tiene un formato válido.');
            return;
        }

        $partesCorreo = explode('@', $value);
        if (count($partesCorreo) !== 2) {
            $fail('El correo institucional no es válido.');
            return;
        }

        $dominio = strtolower($partesCorreo[1]);

        $consulta = Institution::where('domain', $dominio)->where('is_active', true);
        if ($this->institutionId) {
            $consulta->where('id', $this->institutionId);
        }

        if (!$consulta->exists()) {
            $fail("El dominio @{$dominio} no pertenece a una institución universitaria autorizada o activa en UniWheels.");
        }
    }
}
