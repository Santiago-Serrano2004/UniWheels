<?php

namespace App\Http\Controllers\Api\V1\Internal;

use App\Http\Controllers\Controller;
use App\Http\Requests\LateCancellationSuspensionRequest;
use App\Models\User;
use App\Services\UserSuspensionService;
use Illuminate\Http\JsonResponse;

class UserSuspensionController extends Controller
{
    /**
     * Suspensión automática solicitada por trip-service al detectar el umbral de
     * cancelaciones tardías. Solo invocable servicio-a-servicio (jwt.service).
     */
    public function lateCancellation(LateCancellationSuspensionRequest $request, string $id, UserSuspensionService $service): JsonResponse
    {
        $usuario = User::find($id);

        if (! $usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado.',
            ], 404);
        }

        $resultado = $service->suspendForLateCancellations(
            $usuario,
            $request->integer('late_cancellations_count'),
            $request->integer('days')
        );

        return response()->json([
            'success' => true,
            'data' => $resultado,
        ]);
    }
}
