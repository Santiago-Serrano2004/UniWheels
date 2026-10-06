<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBetaSignupRequest;
use App\Models\BetaSignup;
use App\Services\LandingMailer;
use Illuminate\Http\JsonResponse;

class BetaSignupController extends Controller
{
    public function store(StoreBetaSignupRequest $request, LandingMailer $mailer): JsonResponse
    {
        $data = $request->validated();

        // Siempre 200 con el mismo mensaje: un correo repetido no revela que ya estaba inscrito.
        $inscripcion = BetaSignup::firstOrCreate(
            ['email' => $data['email']],
            [
                'name' => $data['name'],
                'university' => $data['university'],
                'platform' => $data['platform'],
                'role' => $data['role'],
                'consent_at' => now(),
                'created_at' => now(),
            ]
        );

        if ($inscripcion->wasRecentlyCreated) {
            $plataforma = $inscripcion->platform === 'ios' ? 'iPhone' : 'Android';
            $mailer->enviar(
                $inscripcion->email,
                'Recibimos tu inscripción a la beta de UniWheels',
                '¡Hola, '.$inscripcion->name.'!',
                [
                    'Gracias por querer probar UniWheels antes que nadie.',
                    'Revisamos las inscripciones a mano. Cuando haya un cupo para tu universidad te enviaremos a este correo las instrucciones para instalar la app en tu '.$plataforma.'.',
                    'En la beta te pediremos que nos cuentes qué funciona y qué no: tu opinión decide qué arreglamos primero.',
                ],
                'Nueva inscripción a la beta',
                [
                    'Nombre' => $inscripcion->name,
                    'Correo' => $inscripcion->email,
                    'Universidad' => $inscripcion->university,
                    'Teléfono' => $plataforma,
                    'Quiere' => $inscripcion->role,
                ],
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Listo. Te escribiremos cuando haya un cupo en la beta para tu universidad.',
        ]);
    }
}
