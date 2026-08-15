<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterVehicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Preparar y normalizar la placa vehicular.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('plate_number')) {
            $this->merge([
                'plate_number' => strtoupper(str_replace([' ', '-'], '', trim($this->input('plate_number')))),
            ]);
        }
    }

    public function rules(): array
    {
        $anioMaximo = (int) date('Y') + 1;

        return [
            'vehicle_type' => ['required', 'string', 'in:carro,moto'],
            'plate_number' => [
                'required',
                'string',
                'min:5',
                'max:7',
                'regex:/^[A-Z]{3}\d{2}[A-Z\d]$/', // Formatos válidos: AAA123 (Carros) o AAA12D (Motos)
                'unique:vehicles,plate_number',
            ],
            'brand' => ['required', 'string', 'max:80'],
            'model_line' => ['required', 'string', 'max:100'],
            'year' => ['required', 'integer', 'min:1990', "max:{$anioMaximo}"],
            'color' => ['required', 'string', 'max:40'],
            'available_seats' => [
                'required',
                'integer',
                'min:1',
                function ($attribute, $value, $fail) {
                    if ($this->input('vehicle_type') === 'moto' && $value > 1) {
                        $fail('Las motocicletas solo pueden tener un cupo disponible de pasajero.');
                    }
                    if ($this->input('vehicle_type') === 'carro' && ($value < 1 || $value > 6)) {
                        $fail('Los automóviles deben tener entre 1 y 6 cupos disponibles.');
                    }
                },
            ],
            'has_ac' => ['boolean'],
            'has_trunk' => ['boolean'],
            'has_extra_helmet' => [
                'boolean',
                function ($attribute, $value, $fail) {
                    if ($this->input('vehicle_type') === 'moto' && !$value) {
                        $fail('Para registrar una motocicleta debes confirmar que dispones de un casco adicional reglamentario.');
                    }
                },
            ],
            'perspective_photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:5120'], // Foto 3/4 max 5MB
        ];
    }

    public function messages(): array
    {
        return [
            'vehicle_type.required' => 'El tipo de vehículo (carro o moto) es obligatorio.',
            'plate_number.required' => 'La placa del vehículo es obligatoria.',
            'plate_number.regex' => 'El formato de placa ingresado no es válido para Colombia (Ej: ABC123 para carros o ABC12D para motos).',
            'plate_number.unique' => 'Este número de placa ya se encuentra registrado en el sistema.',
            'brand.required' => 'La marca del vehículo es obligatoria.',
            'model_line.required' => 'El modelo o línea del vehículo es obligatorio.',
            'year.required' => 'El año del modelo es obligatorio.',
            'color.required' => 'El color del vehículo es obligatorio.',
            'available_seats.required' => 'Debes indicar el número de cupos disponibles.',
        ];
    }
}
