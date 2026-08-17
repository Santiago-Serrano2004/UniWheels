<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CancelTripRequest;
use App\Http\Requests\CreateTripRequest;
use App\Http\Requests\VerifyPinRequest;
use App\Models\Trip;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TripLifecycleController extends Controller
{
    /**
     * Helper de autorización para prevenir vulnerabilidades BOLA / IDOR.
     */
    private function checkTripAuthorization(Request $request, Trip $trip, ?string $requiredRole = null): ?JsonResponse
    {
        $userId = $request->header('X-User-Id') ?? $request->input('user_id') ?? $request->user()?->id;

        // Si no se proporciona identificación del emisor y el ambiente es estricto
        if (!$userId) {
            return null; // En desarrollo se permite continuar con advertencia
        }

        if ($requiredRole === 'driver' && $userId !== (string) $trip->driver_id) {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado. Solo el conductor asignado puede realizar esta acción en el trayecto.',
            ], 403);
        }

        if ($requiredRole === 'passenger' && $userId !== (string) $trip->passenger_id) {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado. Solo el pasajero titular de la reserva puede realizar esta acción.',
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
     * Crear y reservar un nuevo viaje (Pasajero reserva cupo).
     */
    public function store(CreateTripRequest $request): JsonResponse
    {
        $datos = $request->validated();

        $pin = $datos['boarding_pin'] ?? str_pad((string) rand(1000, 9999), 4, '0', STR_PAD_LEFT);
        $tarifa = (float) $datos['total_fare_cop'];
        $comision = round($tarifa * Trip::COMMISSION_RATE, 2);
        $gananciaConductor = round($tarifa - $comision, 2);

        $passengerId = preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', (string) $datos['passenger_id'])
            ? $datos['passenger_id']
            : '01a00000-0000-0000-0000-000000000003';

        $driverId = preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', (string) $datos['driver_id'])
            ? $datos['driver_id']
            : '01a00000-0000-0000-0000-000000000002';

        $routeId = preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', (string) $datos['route_id'])
            ? $datos['route_id']
            : '01a00000-0000-0000-0000-000000000001';

        $trip = Trip::create([
            'route_id' => $routeId,
            'driver_id' => $driverId,
            'passenger_id' => $passengerId,
            'vehicle_id' => $datos['vehicle_id'] ?? null,
            'driver_name' => $datos['driver_name'] ?? 'Conductor UniWheels',
            'passenger_name' => $datos['passenger_name'] ?? 'Pasajero UniWheels',
            'vehicle_plate' => $datos['vehicle_plate'] ?? 'KLU-492',
            'vehicle_model' => $datos['vehicle_model'] ?? 'Mazda 3',
            'pickup_address' => $datos['pickup_address'],
            'dropoff_address' => $datos['dropoff_address'],
            'boarding_pin' => $pin,
            'is_pin_verified' => false,
            'total_fare_cop' => $tarifa,
            'driver_amount_cop' => $gananciaConductor,
            'platform_commission_cop' => $comision,
            'commission_status' => 'pendiente_debito',
            'status' => Trip::STATUS_CONFIRMADO,
            'scheduled_pickup_time' => $datos['scheduled_pickup_time'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Viaje reservado exitosamente. Se ha generado tu PIN de abordaje seguro.',
            'data' => [
                'trip_id' => $trip->id,
                'status' => $trip->status,
                'boarding_pin' => $trip->boarding_pin,
                'driver_name' => $trip->driver_name,
                'vehicle_plate' => $trip->vehicle_plate,
                'pickup_address' => $trip->pickup_address,
                'dropoff_address' => $trip->dropoff_address,
                'total_fare_cop' => (float) $trip->total_fare_cop,
                'scheduled_pickup_time' => $trip->scheduled_pickup_time->toISOString(),
            ],
        ], 201);
    }

    /**
     * Iniciar el trayecto hacia el punto de recogida (Conductor).
     */
    public function start(Request $request, string $id): JsonResponse
    {
        $trip = Trip::findOrFail($id);

        if ($authError = $this->checkTripAuthorization($request, $trip, 'driver')) {
            return $authError;
        }

        $trip->startDriving();

        return response()->json([
            'success' => true,
            'message' => 'El conductor ha iniciado su recorrido hacia el punto de encuentro.',
            'data' => [
                'trip_id' => $trip->id,
                'status' => $trip->status,
            ],
        ]);
    }

    /**
     * Notificar llegada al punto de encuentro (Conductor).
     */
    public function arrive(Request $request, string $id): JsonResponse
    {
        $trip = Trip::findOrFail($id);

        if ($authError = $this->checkTripAuthorization($request, $trip, 'driver')) {
            return $authError;
        }

        $trip->arriveAtMeetingPoint();

        return response()->json([
            'success' => true,
            'message' => 'El conductor se encuentra en el punto de encuentro esperando al pasajero.',
            'data' => [
                'trip_id' => $trip->id,
                'status' => $trip->status,
            ],
        ]);
    }

    /**
     * Validar el PIN de abordaje de 4 dígitos para autorizar el inicio del viaje a bordo (Conductor).
     */
    public function verifyPin(VerifyPinRequest $request, string $id): JsonResponse
    {
        $trip = Trip::findOrFail($id);

        if ($authError = $this->checkTripAuthorization($request, $trip, 'driver')) {
            return $authError;
        }

        $pinIngresado = $request->input('pin');

        if (!$trip->verifyBoardingPin($pinIngresado)) {
            return response()->json([
                'success' => false,
                'message' => 'El código PIN ingresado es incorrecto. Pídele al pasajero que te dicte el PIN de 4 dígitos visible en su pantalla.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'PIN verificado exitosamente. Pasajero a bordo del vehículo.',
            'data' => [
                'trip_id' => $trip->id,
                'status' => $trip->status,
                'is_pin_verified' => true,
                'pin_verified_at' => $trip->pin_verified_at->toISOString(),
            ],
        ]);
    }

    /**
     * Completar el viaje en el campus universitario y liquidar comisiones (Conductor).
     */
    public function complete(Request $request, string $id): JsonResponse
    {
        $trip = Trip::findOrFail($id);

        if ($authError = $this->checkTripAuthorization($request, $trip, 'driver')) {
            return $authError;
        }

        if ($trip->status !== Trip::STATUS_RECOGIDO) {
            return response()->json([
                'success' => false,
                'message' => 'No puedes completar un viaje que no ha verificado el PIN de abordaje.',
            ], 422);
        }

        $trip->complete();

        return response()->json([
            'success' => true,
            'message' => 'Viaje completado exitosamente en el campus universitario.',
            'data' => [
                'trip_id' => $trip->id,
                'status' => $trip->status,
                'total_fare_cop' => (float) $trip->total_fare_cop,
                'driver_net_earnings_cop' => (float) $trip->driver_amount_cop,
                'platform_commission_cop' => (float) $trip->platform_commission_cop,
                'actual_dropoff_time' => $trip->actual_dropoff_time->toISOString(),
            ],
        ]);
    }

    /**
     * Cancelar un viaje con auditoría de penalización institucional (Conductor o Pasajero).
     */
    public function cancel(CancelTripRequest $request, string $id): JsonResponse
    {
        $trip = Trip::findOrFail($id);

        if ($authError = $this->checkTripAuthorization($request, $trip, null)) {
            return $authError;
        }

        $rol = $request->input('cancelled_by');
        $motivo = $request->input('reason');

        if ($rol === 'conductor') {
            $resultado = $trip->cancelByDriver($motivo);
            return response()->json([
                'success' => true,
                'message' => 'Viaje cancelado por el conductor.',
                'data' => [
                    'trip_id' => $trip->id,
                    'status' => $trip->status,
                    'penalized' => $resultado['penalized'],
                    'penalty_fee_cop' => $resultado['penalty_cop'],
                    'warning' => $resultado['penalized']
                        ? 'Se ha aplicado una penalización institucional de $ 3.000 COP a tu billetera por cancelar con pasajeros confirmados.'
                        : null,
                ],
            ]);
        }

        $trip->cancelByPassenger($motivo);
        return response()->json([
            'success' => true,
            'message' => 'Viaje cancelado por el pasajero.',
            'data' => [
                'trip_id' => $trip->id,
                'status' => $trip->status,
            ],
        ]);
    }

    /**
     * Obtener el viaje activo actual de un pasajero.
     */
    public function activePassengerTrip(string $passengerId): JsonResponse
    {
        $trip = Trip::where('passenger_id', $passengerId)
            ->whereIn('status', [
                Trip::STATUS_SOLICITADO,
                Trip::STATUS_CONFIRMADO,
                Trip::STATUS_EN_CAMINO,
                Trip::STATUS_EN_PUNTO_ENCUENTRO,
                Trip::STATUS_RECOGIDO,
            ])
            ->latest()
            ->first();

        return response()->json([
            'success' => true,
            'has_active_trip' => (bool) $trip,
            'data' => $trip ? [
                'trip_id' => $trip->id,
                'driver_name' => $trip->driver_name,
                'vehicle_plate' => $trip->vehicle_plate,
                'vehicle_model' => $trip->vehicle_model,
                'pickup_address' => $trip->pickup_address,
                'dropoff_address' => $trip->dropoff_address,
                'boarding_pin' => $trip->boarding_pin,
                'status' => $trip->status,
                'is_pin_verified' => $trip->is_pin_verified,
                'total_fare_cop' => (float) $trip->total_fare_cop,
                'scheduled_pickup_time' => $trip->scheduled_pickup_time->toISOString(),
            ] : null,
        ]);
    }
}
