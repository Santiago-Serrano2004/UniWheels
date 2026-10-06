<?php

namespace App\Http\Controllers\Api\V1\Internal;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use App\Models\TripCancellation;
use App\Models\TripTrackingPoint;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PersonalDataController extends Controller
{
    private const ANONIMO = 'Usuario eliminado';

    private const DIRECCION_ANONIMA = 'Dirección eliminada';

    /**
     * Anonimización de datos personales (Habeas Data, Ley 1581), pedida por auth-service
     * al eliminar la cuenta. Conserva ids y estados de los viajes para las estadísticas
     * agregadas; solo se anulan nombres, direcciones, placa y puntos de seguimiento.
     */
    public function destroy(string $id): JsonResponse
    {
        DB::transaction(function () use ($id) {
            $viajesDelUsuario = Trip::withTrashed()
                ->where(fn ($q) => $q->where('driver_id', $id)->orWhere('passenger_id', $id))
                ->pluck('id');

            foreach ($viajesDelUsuario->chunk(500) as $lote) {
                TripTrackingPoint::whereIn('trip_id', $lote)->delete();
            }

            Trip::withTrashed()->where('driver_id', $id)->update([
                'driver_name' => self::ANONIMO,
                'vehicle_plate' => null,
                'vehicle_model' => null,
            ]);

            Trip::withTrashed()->where('passenger_id', $id)->update([
                'passenger_name' => self::ANONIMO,
                'pickup_address' => self::DIRECCION_ANONIMA,
                'dropoff_address' => self::DIRECCION_ANONIMA,
            ]);

            TripCancellation::where('cancelled_by_user_id', $id)->update(['detailed_reason' => null]);
        });

        return response()->json(['success' => true]);
    }
}
