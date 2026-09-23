<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DevicePushToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceTokenController extends Controller
{
    /**
     * Registrar o actualizar el token push de un dispositivo móvil para el usuario autenticado.
     */
    public function store(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'token' => ['required', 'string', 'max:255'],
            'platform' => ['nullable', 'string', 'max:20'],
            'device_name' => ['nullable', 'string', 'max:100'],
            'app_version' => ['nullable', 'string', 'max:20'],
        ]);

        $userId = $request->attributes->get('user_id');

        if (! $userId) {
            return response()->json([
                'success' => false,
                'message' => 'No autenticado.',
            ], 401);
        }

        $deviceToken = DevicePushToken::updateOrCreate(
            ['token' => $datos['token']],
            [
                'user_id' => $userId,
                'platform' => $datos['platform'] ?? 'expo',
                'device_name' => $datos['device_name'] ?? null,
                'app_version' => $datos['app_version'] ?? null,
                'is_active' => true,
                'last_used_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Token de dispositivo registrado exitosamente.',
            'data' => [
                'id' => $deviceToken->id,
                'user_id' => $deviceToken->user_id,
                'token' => $deviceToken->token,
                'platform' => $deviceToken->platform,
                'device_name' => $deviceToken->device_name,
                'app_version' => $deviceToken->app_version,
                'is_active' => $deviceToken->is_active,
            ],
        ], 201);
    }

    /**
     * Desactivar el token push al cerrar sesión o desactivar notificaciones.
     */
    public function destroy(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'token' => ['required', 'string', 'max:255'],
        ]);

        $userId = $request->attributes->get('user_id');

        if (! $userId) {
            return response()->json([
                'success' => false,
                'message' => 'No autenticado.',
            ], 401);
        }

        DevicePushToken::where('user_id', $userId)
            ->where('token', $datos['token'])
            ->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Token de dispositivo desactivado exitosamente.',
        ]);
    }
}
