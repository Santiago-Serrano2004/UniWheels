<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Route;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * Descuento y devolución atómicos de cupos (SIM-001). Solo servicio-a-servicio:
 * trip-service reserva antes de crear el viaje y libera al cancelar o fallar.
 */
class RouteSeatController extends Controller
{
    public function reserve(string $id): JsonResponse
    {
        // Una sola sentencia: sin lectura previa, no hay carrera entre reservas simultáneas.
        $afectadas = DB::table('routes')
            ->where('id', $id)
            ->where('status', 'publicada')
            ->where('available_seats', '>', 0)
            ->whereNull('deleted_at')
            ->update(['available_seats' => DB::raw('available_seats - 1'), 'updated_at' => now()]);

        if ($afectadas === 0) {
            return response()->json([
                'success' => false,
                'message' => 'La ruta ya no tiene cupos disponibles.',
            ], 409);
        }

        return response()->json([
            'success' => true,
            'data' => ['available_seats' => (int) Route::whereKey($id)->value('available_seats')],
        ]);
    }

    public function release(string $id): JsonResponse
    {
        // Nunca supera la capacidad publicada (total_seats).
        $afectadas = DB::table('routes')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->whereColumn('available_seats', '<', 'total_seats')
            ->update(['available_seats' => DB::raw('available_seats + 1'), 'updated_at' => now()]);

        $ruta = Route::whereKey($id)->first(['id', 'available_seats']);

        if (! $ruta) {
            return response()->json(['success' => false, 'message' => 'Ruta no encontrada.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => ['available_seats' => (int) $ruta->available_seats, 'released' => $afectadas > 0],
        ]);
    }
}
