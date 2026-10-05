<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\DeleteWaitlistRequest;
use App\Http\Requests\StoreWaitlistRequest;
use App\Models\WaitlistEntry;
use Illuminate\Http\JsonResponse;

class WaitlistController extends Controller
{
    private const SUCCESS_MESSAGE = 'Listo. Te avisaremos cuando UniWheels llegue a tu universidad. '
        .'Usaremos tu correo solo para avisarte del lanzamiento y puedes pedir que lo borremos cuando quieras.';

    public function store(StoreWaitlistRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Siempre 200 con el mismo mensaje: un correo repetido no revela que ya estaba inscrito.
        WaitlistEntry::firstOrCreate(
            ['email' => $data['email']],
            [
                'role' => $data['role'],
                'neighborhood' => $data['neighborhood'],
                'campus_id' => $data['campus_id'] ?? null,
                'usual_time' => $data['usual_time'],
                'direction' => $data['direction'],
                'consent_at' => now(),
                'created_at' => now(),
            ]
        );

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
