<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class PublicProfileController extends Controller
{
    /**
     * Perfil público mínimo de un usuario (nombre, foto, calificación como
     * conductor) para que otros microservicios enriquezcan listados visibles
     * al pasajero sin exponer datos sensibles (correo, documento, teléfono).
     * Restringido a llamadas servicio-a-servicio (ver middleware jwt.service).
     */
    public function show(string $id): JsonResponse
    {
        $usuario = User::with('reputationStats')->find($id);

        if (! $usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado.',
            ], 404);
        }

        $iniciales = collect(explode(' ', trim($usuario->name)))
            ->filter()
            ->take(2)
            ->map(fn ($palabra) => mb_strtoupper(mb_substr($palabra, 0, 1)))
            ->implode('');

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $usuario->id,
                'name' => $usuario->name,
                'avatar_initials' => $iniciales ?: '??',
                'profile_photo_url' => $usuario->profile_photo_path
                    ? asset('storage/'.$usuario->profile_photo_path)
                    : null,
                'rating' => $usuario->reputationStats?->average_rating_as_driver,
                'total_trips_as_driver' => $usuario->reputationStats?->total_trips_as_driver ?? 0,
            ],
        ]);
    }
}
