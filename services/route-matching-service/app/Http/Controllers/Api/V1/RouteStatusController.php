<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateRouteStatusRequest;
use App\Models\Route;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * Ciclo de vida de una ruta publicada, controlado por su conductor. Al salir de
 * "publicada" la ruta deja de aparecer en búsquedas y ya no acepta reservas
 * (reserve-seat solo descuenta cupos de rutas publicadas).
 */
class RouteStatusController extends Controller
{
    /** Estado destino => estados desde los que se puede llegar. */
    public const TRANSICIONES = [
        'en_curso' => ['publicada'],
        // Desde "publicada" también: el conductor puede verificar PIN y llegar sin marcar el inicio.
        'finalizada' => ['publicada', 'en_curso'],
        'cancelada' => ['publicada', 'en_curso'],
    ];

    public function update(UpdateRouteStatusRequest $request, string $id): JsonResponse
    {
        $destino = $request->validated('status');
        $driverId = (string) $request->attributes->get('user_id');

        $ruta = Route::find($id);
        if (! $ruta || (string) $ruta->driver_id !== $driverId) {
            // 404 también si es de otro conductor: no revela que la ruta existe.
            return response()->json(['success' => false, 'message' => 'Ruta no encontrada.'], 404);
        }

        if ($ruta->status === $destino) {
            return response()->json(['success' => true, 'data' => ['id' => $ruta->id, 'status' => $ruta->status]]);
        }

        // Sentencia condicional: si otra petición cambió el estado entre la lectura y la escritura, no se pisa.
        $afectadas = DB::table('routes')
            ->where('id', $ruta->id)
            ->whereIn('status', self::TRANSICIONES[$destino])
            ->whereNull('deleted_at')
            ->update(['status' => $destino, 'updated_at' => now()]);

        if ($afectadas === 0) {
            return response()->json([
                'success' => false,
                'message' => "La ruta está {$ruta->status} y no puede pasar a {$destino}.",
            ], 409);
        }

        return response()->json(['success' => true, 'data' => ['id' => $ruta->id, 'status' => $destino]]);
    }
}
