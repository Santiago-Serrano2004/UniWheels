<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUniversityContactRequest;
use App\Models\UniversityContact;
use App\Services\LandingMailer;
use Illuminate\Http\JsonResponse;

class UniversityContactController extends Controller
{
    public function store(StoreUniversityContactRequest $request, LandingMailer $mailer): JsonResponse
    {
        $data = $request->validated();

        $contacto = UniversityContact::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'university' => $data['university'],
            'position' => $data['position'],
            'phone' => $data['phone'] ?? null,
            'message' => $data['message'],
            'created_at' => now(),
        ]);

        $mailer->enviar(
            $contacto->email,
            'Recibimos tu mensaje sobre UniWheels',
            '¡Hola, '.$contacto->name.'!',
            [
                'Gracias por escribirnos sobre UniWheels para '.$contacto->university.'.',
                'Te responderemos en un plazo de dos días hábiles para contarte cómo funciona el piloto, qué necesita Bienestar y cómo se verifica a la comunidad.',
            ],
            'Contacto de universidad: '.$contacto->university,
            [
                'Nombre' => $contacto->name,
                'Cargo' => $contacto->position,
                'Universidad' => $contacto->university,
                'Correo' => $contacto->email,
                'Teléfono' => $contacto->phone ?? 'No lo dejó',
                'Mensaje' => $contacto->message,
            ],
        );

        return response()->json([
            'success' => true,
            'message' => 'Recibimos tu mensaje. Te responderemos en un plazo de dos días hábiles.',
        ]);
    }
}
