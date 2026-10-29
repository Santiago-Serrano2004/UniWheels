<?php

namespace App\Http\Controllers\Api\V1\Internal;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use Illuminate\Http\JsonResponse;

class TripParticipationController extends Controller
{
    /**
     * SIM-020: quiénes participaron en un viaje y en qué estado quedó, para que
     * notification-service solo acepte calificaciones de participantes de viajes
     * completados. Solo servicio-a-servicio (jwt.service).
     */
    public function show(string $id): JsonResponse
    {
        $trip = Trip::find($id);

        if (! $trip) {
            return response()->json(['success' => false, 'message' => 'Viaje no encontrado.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $trip->id,
                'driver_id' => $trip->driver_id,
                'passenger_id' => $trip->passenger_id,
                'status' => $trip->status,
            ],
        ]);
    }
}
