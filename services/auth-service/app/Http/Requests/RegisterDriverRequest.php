<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterDriverRequest extends FormRequest
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
        if ($this->has('plate_number')) {
            $this->merge([
                'plate_number' => strtoupper(str_replace([' ', '-', '·', '.'], '', trim($this->input('plate_number')))),
            ]);
        }

        if ($this->has('soat_number')) {
            $this->merge([
                'soat_number' => strtoupper(trim($this->input('soat_number'))),
            ]);
        }

        if ($this->has('rtm_number')) {
            $this->merge([
                'rtm_number' => strtoupper(trim($this->input('rtm_number'))),
            ]);
        }

        if ($this->has('license_number')) {
            $this->merge([
                'license_number' => preg_replace('/\D/', '', (string) $this->input('license_number')),
            ]);
        }
    }

    public function rules(): array
    {
        $anioMaximo = (int) date('Y') + 1;
        $anioActual = (int) date('Y');
        $anioVehiculo = (int) $this->input('year');
        $tipoVehiculo = $this->input('vehicle_type', 'carro');

        // Evaluación de Ley 2294 de 2023 para RTM
        $antiguedad = $anioActual - $anioVehiculo;
        $requiereRtm = ($tipoVehiculo === 'carro' && $antiguedad >= 5) || ($tipoVehiculo === 'moto' && $antiguedad >= 2);

        $rules = [
            'vehicle_type' => ['required', 'string', 'in:carro,moto'],
            'plate_number' => [
                'required',
                'string',
                'min:5',
                'max:7',
                function ($attribute, $value, $fail) use ($tipoVehiculo) {
                    if ($tipoVehiculo === 'carro') {
                        if (!preg_match('/^[A-Z]{3}\d{3}$/', $value)) {
                            $fail('La placa de automóvil debe tener el formato colombiano de 3 letras y 3 números (Ej: KLU492).');
                        }
                    } else {
                        if (!preg_match('/^[A-Z]{3}\d{2}[A-Z]$|^[A-Z]{3}\d{3}$/', $value)) {
                            $fail('La placa de motocicleta debe tener 3 letras, 2 números y 1 letra (Ej: WYX81D).');
                        }
                    }
                },
            ],
            'brand' => ['required', 'string', 'max:80'],
            'model_line' => ['required', 'string', 'max:100'],
            'year' => ['required', 'integer', 'min:1990', "max:{$anioMaximo}"],
            'color' => ['required', 'string', 'max:40'],
            'propulsion_type' => ['required', 'string', 'in:gasolina,hibrido,electrico,diesel'],
            'available_seats' => [
                'required',
                'integer',
                'min:1',
                function ($attribute, $value, $fail) use ($tipoVehiculo) {
                    if ($tipoVehiculo === 'moto' && $value > 1) {
                        $fail('Las motocicletas solo pueden registrar un cupo disponible de pasajero.');
                    }
                    if ($tipoVehiculo === 'carro' && ($value < 1 || $value > 6)) {
                        $fail('Los automóviles deben registrar entre 1 y 6 cupos disponibles.');
                    }
                },
            ],
            // Validaciones SOAT
            'soat_number' => ['required', 'string', 'min:6', 'max:20', 'regex:/^[A-Z0-9-]{6,20}$/i'],
            'soat_expires_at' => ['required', 'date', 'after:today'],
            'soat_photo' => ['required'],

            // Validaciones Licencia de Conducción
            'license_number' => ['required', 'string', 'min:6', 'max:12', 'regex:/^\d{6,12}$/'],
            'license_category' => [
                'required',
                'string',
                function ($attribute, $value, $fail) use ($tipoVehiculo) {
                    if ($tipoVehiculo === 'moto' && !in_array($value, ['A1', 'A2'])) {
                        $fail('Para motocicletas se requiere licencia de conducción de categoría A1 o A2.');
                    }
                    if ($tipoVehiculo === 'carro' && !in_array($value, ['B1', 'B2', 'C1', 'C2', 'C3'])) {
                        $fail('Para automóviles se requiere licencia de categoría B1, B2, C1, C2 o C3.');
                    }
                },
            ],
            'license_expires_at' => ['required', 'date', 'after:today'],
            'license_photo' => ['required'],

            // Declaración y Consentimiento Ley 1581
            'habeas_data_accepted' => ['required'],
        ];

        // Validaciones condicionales de Revisión Técnico-Mecánica (RTM)
        if ($requiereRtm) {
            $rules['rtm_number'] = ['required', 'string', 'min:6', 'max:20', 'regex:/^[A-Z0-9-]{6,20}$/i'];
            $rules['rtm_expires_at'] = ['required', 'date', 'after:today'];
            $rules['rtm_photo'] = ['required'];
        } else {
            $rules['rtm_number'] = ['nullable', 'string'];
            $rules['rtm_expires_at'] = ['nullable', 'date'];
            $rules['rtm_photo'] = ['nullable'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'vehicle_type.required' => 'El tipo de vehículo (carro o moto) es obligatorio.',
            'plate_number.required' => 'La placa del vehículo es obligatoria.',
            'brand.required' => 'La marca del vehículo es obligatoria.',
            'model_line.required' => 'El modelo o línea del vehículo es obligatorio.',
            'year.required' => 'El año del modelo es obligatorio.',
            'color.required' => 'El color del vehículo es obligatorio.',
            'available_seats.required' => 'Debes indicar el número de cupos disponibles.',
            'soat_number.required' => 'El número de póliza SOAT es obligatorio.',
            'soat_number.regex' => 'El número de póliza SOAT debe contener entre 6 y 20 caracteres alfanuméricos.',
            'soat_expires_at.required' => 'La fecha de vencimiento del SOAT es obligatoria.',
            'soat_expires_at.after' => 'La póliza SOAT se encuentra vencida. Debe tener fecha de vigencia futura.',
            'soat_photo.required' => 'Debes adjuntar la foto o copia digital de tu póliza SOAT.',
            'rtm_number.required' => 'Por antigüedad de tu vehículo, el número de certificado de Tecnomecánica (RTM) es obligatorio.',
            'rtm_expires_at.required' => 'La fecha de vencimiento de la Revisión Técnico-Mecánica es obligatoria.',
            'rtm_expires_at.after' => 'El certificado de Revisión Técnico-Mecánica se encuentra vencido.',
            'rtm_photo.required' => 'Debes adjuntar la foto del Certificado de Revisión Técnico-Mecánica (RTM).',
            'license_number.required' => 'El número de licencia de conducción es obligatorio.',
            'license_number.regex' => 'El número de licencia de conducción debe contener entre 6 y 12 dígitos numéricos.',
            'license_category.required' => 'Debes seleccionar la categoría de tu licencia de conducción.',
            'license_expires_at.required' => 'La fecha de vencimiento de la licencia es obligatoria.',
            'license_expires_at.after' => 'Tu licencia de conducción se encuentra vencida.',
            'license_photo.required' => 'Debes adjuntar la foto frontal de tu licencia de conducción.',
            'habeas_data_accepted.required' => 'Debes autorizar la verificación de documentos bajo la Ley 1581 de 2012.',
        ];
    }
}
