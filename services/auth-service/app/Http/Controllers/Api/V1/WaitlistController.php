<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\DeleteWaitlistRequest;
use App\Http\Requests\StoreWaitlistRequest;
use App\Models\WaitlistEntry;
use App\Services\LandingMailer;
use Illuminate\Http\JsonResponse;

class WaitlistController extends Controller
{
    private const SUCCESS_MESSAGE = 'Listo. Te avisaremos cuando UniWheels llegue a tu universidad. '
        .'Usaremos tu correo solo para avisarte del lanzamiento y puedes pedir que lo borremos cuando quieras.';

    public function store(StoreWaitlistRequest $request, LandingMailer $mailer): JsonResponse
    {
        $data = $request->validated();

        // Siempre 200 con el mismo mensaje: un correo repetido no revela que ya estaba inscrito.
        $entrada = WaitlistEntry::firstOrCreate(
            ['email' => $data['email']],
            [
                'university' => $data['university'],
                'role' => $data['role'],
                'neighborhood' => $data['neighborhood'],
                'campus_id' => $data['campus_id'] ?? null,
                'usual_time' => $data['usual_time'],
                'direction' => $data['direction'],
                'consent_at' => now(),
                'created_at' => now(),
            ]
        );

        // Solo la primera vez: reenviar el formulario no vuelve a mandar correos.
        if ($entrada->wasRecentlyCreated) {
            $entrada->load('campus');
            $mailer->enviar(
                $entrada->email,
                'Te avisaremos cuando UniWheels llegue',
                '¡Hola!',
                [
                    'Quedaste en la lista de espera de UniWheels para '.$entrada->university.'.',
                    'Te escribiremos una sola vez, cuando abramos tu universidad. Usaremos tus respuestas para abrir primero los barrios y horarios con más demanda.',
                    'Si quieres salir de la lista, responde a este correo y borramos tus datos.',
                ],
                'Nueva inscripción en la lista de espera',
                [
                    'Correo' => $entrada->email,
                    'Universidad' => $entrada->university,
                    'Sede' => $entrada->campus?->name ?? 'Sin sede',
                    'Quiere' => $entrada->role,
                    'Barrio' => $entrada->neighborhood,
                    'Franja' => $entrada->usual_time,
                    'Sentido' => $entrada->direction,
                ],
            );
        }

        return response()->json([
            'success' => true,
            'message' => self::SUCCESS_MESSAGE,
        ]);
    }

    /**
     * Ley 1581: baja de la lista por correo. Siempre 200 para no revelar inscripciones.
     */
    public function destroy(DeleteWaitlistRequest $request): JsonResponse
    {
        WaitlistEntry::where('email', strtolower(trim($request->validated('email'))))->delete();

        return response()->json([
            'success' => true,
            'message' => 'Si tu correo estaba en la lista, ya fue eliminado.',
        ]);
    }
}
