<?php

namespace App\Http\Controllers\Api\V1\Internal;

use App\Http\Controllers\Controller;
use App\Models\Route;
use App\Models\SearchLog;
use App\Models\TripRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PersonalDataController extends Controller
{
    /**
     * Eliminación de datos personales (Habeas Data, Ley 1581), pedida por auth-service al
     * eliminar la cuenta: cancela las rutas futuras publicadas por el usuario y las solicitudes
     * de viaje abiertas, y borra la dirección de recogida de sus solicitudes.
     */
    public function destroy(string $id): JsonResponse
    {
        DB::transaction(function () use ($id) {
            Route::where('driver_id', $id)
                ->where('status', 'publicada')
                ->where('scheduled_departure_time', '>', now())
                ->update(['status' => 'cancelada']);

            TripRequest::where('passenger_id', $id)
                ->whereIn('status', ['solicitado', 'aceptado'])
                ->update(['status' => 'cancelado']);

            SearchLog::where('passenger_id', $id)->delete();

            TripRequest::where('passenger_id', $id)->update(['pickup_name' => 'Dirección eliminada']);
        });

        return response()->json(['success' => true]);
    }
}
