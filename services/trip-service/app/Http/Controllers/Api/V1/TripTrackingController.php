<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TripTrackingController extends Controller
{
    /**
     * Helper de autorización para prevenir vulnerabilidades BOLA / IDOR.
     * La identidad SIEMPRE viene del JWT verificado por el middleware jwt.auth
     * (request attribute 'user_id') — nunca de un header/parámetro del cliente.
     */
    private function checkTripAuthorization(Request $request, Trip $trip, ?string $requiredRole = null): ?JsonResponse
    {
        $userId = $request->attributes->get('user_id');

        if (! $userId) {
            return response()->json([
                'success' => false,
                'message' => 'No autenticado.',
            ], 401);
        }

        if ($requiredRole === 'driver' && $userId !== (string) $trip->driver_id) {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado. Solo el conductor asignado puede realizar esta acción en el trayecto.',
            ], 403);
        }

        if ($requiredRole === null && $userId !== (string) $trip->driver_id && $userId !== (string) $trip->passenger_id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes autorización para acceder o modificar los datos de este viaje.',
            ], 403);
        }

        return null;
    }

    /**
     * El conductor reporta su posición GPS actual mientras el viaje está en curso.
     */
    public function report(Request $request, string $id): JsonResponse
    {
        $trip = Trip::findOrFail($id);

        if ($authError = $this->checkTripAuthorization($request, $trip, 'driver')) {
            return $authError;
        }

        if (! in_array($trip->status, [Trip::STATUS_EN_CAMINO, Trip::STATUS_EN_PUNTO_ENCUENTRO, Trip::STATUS_RECOGIDO], true)) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede reportar posición: el viaje no está en curso.',
            ], 422);
        }

        $data = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'speed_kmh' => ['nullable', 'numeric', 'min:0'],
            'heading_degrees' => ['nullable', 'numeric', 'between:0,360'],
            'accuracy_meters' => ['nullable', 'numeric', 'min:0'],
        ]);

        $trip->trackingPoints()->create([
            ...$data,
            'recorded_at' => now(),
        ]);

        return response()->json(['success' => true], 201);
    }

    /**
     * Consultar la última posición conocida del conductor (conductor o pasajero del viaje).
     */
    public function latest(Request $request, string $id): JsonResponse
    {
        $trip = Trip::findOrFail($id);

        if ($authError = $this->checkTripAuthorization($request, $trip)) {
            return $authError;
        }

        $point = $trip->trackingPoints()->latest('recorded_at')->first();

        if (! $point) {
            return response()->json([
                'success' => true,
                'data' => null,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'latitude' => $point->latitude,
                'longitude' => $point->longitude,
                'speed_kmh' => $point->speed_kmh,
                'heading_degrees' => $point->heading_degrees,
                'recorded_at' => $point->recorded_at->toISOString(),
            ],
        ]);
    }

    /**
     * Registra la activación del botón de pánico SOS. No bloquea ni depende del
     * estado del viaje: si el usuario pulsa SOS, el evento se audita siempre que
     * pertenezca al viaje. El flujo real de emergencia (llamada, WhatsApp) ya
     * ocurre en el cliente de forma independiente a esta llamada.
     */
    public function sos(Request $request, string $id): JsonResponse
    {
        $trip = Trip::findOrFail($id);

        if ($authError = $this->checkTripAuthorization($request, $trip)) {
            return $authError;
        }

        $data = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'emergency_type' => ['nullable', 'string', 'max:50'],
        ]);

        $trip->sosEvents()->create([
            'triggered_by_user_id' => $request->attributes->get('user_id'),
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
            'emergency_type' => $data['emergency_type'] ?? 'panico_usuario',
            'triggered_at' => now(),
        ]);

        return response()->json(['success' => true], 201);
    }
}
