<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    /**
     * Clave pública VAPID — el frontend la necesita para registrar la
     * suscripción push del navegador (PushManager.subscribe).
     */
    public function vapidPublicKey(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => ['public_key' => config('services.vapid.public_key')],
        ]);
    }

    /**
     * Registrar (o actualizar) la suscripción push del navegador del usuario autenticado.
     */
    public function store(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'endpoint' => ['required', 'string'],
            'keys.p256dh' => ['required', 'string'],
            'keys.auth' => ['required', 'string'],
        ]);

        $userId = $request->attributes->get('user_id');

        PushSubscription::updateOrCreate(
            ['user_id' => $userId, 'endpoint' => $datos['endpoint']],
            ['p256dh_key' => $datos['keys']['p256dh'], 'auth_key' => $datos['keys']['auth']]
        );

        return response()->json([
            'success' => true,
            'message' => 'Suscripción push registrada exitosamente.',
        ], 201);
    }

    /**
     * Eliminar la suscripción push (el usuario desactivó las notificaciones).
     */
    public function destroy(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'endpoint' => ['required', 'string'],
        ]);

        PushSubscription::forUser($request->attributes->get('user_id'))
            ->where('endpoint', $datos['endpoint'])
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Suscripción push eliminada.',
        ]);
    }
}
