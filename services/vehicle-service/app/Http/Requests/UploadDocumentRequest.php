<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'document_type' => [
                'required',
                'string',
                'in:licencia_conduccion,soat,tarjeta_propiedad,revision_tecnico_mecanica',
            ],
            'document_number' => ['nullable', 'string', 'max:50'],
            'issuer_entity' => ['nullable', 'string', 'max:100'],
            'issued_at' => ['nullable', 'date'],
            'expires_at' => [
                'nullable',
                'date',
                function ($attribute, $value, $fail) {
                    $tipo = $this->input('document_type');
                    if (in_array($tipo, ['soat', 'revision_tecnico_mecanica']) && empty($value)) {
                        $fail('La fecha de vencimiento es obligatoria para el SOAT y la Revisión Técnico-Mecánica.');
                    }
                    if (!empty($value) && strtotime($value) < strtotime(date('Y-m-d'))) {
                        $fail('El documento que intentas adjuntar ya se encuentra vencido.');
                    }
                },
            ],
            'document_file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'], // Máximo 5MB
        ];
    }

    public function messages(): array
    {
        return [
            'document_type.required' => 'El tipo de documento es obligatorio.',
            'document_type.in' => 'El tipo de documento no es válido.',
            'document_file.required' => 'Debes adjuntar el archivo del documento escaneado o en foto legible.',
            'document_file.max' => 'El archivo no debe exceder 5 MB.',
            'document_file.mimes' => 'El archivo debe estar en formato PDF, JPG, JPEG o PNG.',
        ];
    }
}
