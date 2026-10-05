<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CancelTripRequest;
use App\Http\Requests\CreateTripRequest;
use App\Http\Requests\VerifyPinRequest;
use App\Models\Trip;
use App\Models\TripCompletedSummary;
use App\Services\LateCancellationPolicy;
use App\Services\RouteMatchingClient;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TripLifecycleController extends Controller
{
    public function __construct(
        private RouteMatchingClient $routeMatchingClient,
        private LateCancellationPolicy $lateCancellationPolicy
    ) {}

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
        $passengerId = $request->attributes->get('user_id');

        $routeId = preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', (string) $datos['route_id'])
            ? $datos['route_id']
            : null;

        if (! $routeId) {
            return response()->json([
                'success' => false,
                'message' => 'El identificador de ruta (route_id) no es válido.',
            ], 422);
        }

        // Validación server-side contra route-matching-service: el conductor real de la
        // ruta y un rango de tarifa tolerable (nunca se confía en driver_id/total_fare_cop
        // enviados directamente por el cliente).
        $ruta = $this->routeMatchingClient->getRoute($routeId);

        if (! $ruta) {
            return response()->json([
                'success' => false,
                'message' => 'No fue posible validar la ruta seleccionada. Intenta nuevamente.',
            ], 422);
        }

        $driverId = $ruta['driver_id'];
        $tarifaBase = (float) $ruta['base_contribution_cop'];
        $tarifa = (float) $datos['total_fare_cop'];

        // La reserva usa exactamente el aporte publicado en la ruta (puede ser 0).
        if (round($tarifa, 2) !== round($tarifaBase, 2)) {
            return response()->json([
                'success' => false,
                'message' => 'La tarifa indicada no corresponde a un valor válido para esta ruta.',
            ], 422);
        }

        // SIM-008: no se reserva la ruta propia ni se duplica una reserva activa.
        if ((string) $driverId === (string) $passengerId) {
            return response()->json([
                'success' => false,
                'message' => 'No puedes reservar tu propia ruta.',
            ], 422);
        }

        $yaReservada = Trip::where('passenger_id', $passengerId)
            ->where('route_id', $routeId)
            ->whereNotIn('status', [
                Trip::STATUS_CANCELADO_CONDUCTOR,
                Trip::STATUS_CANCELADO_PASAJERO,
                Trip::STATUS_COMPLETADO,
            ])
            ->exists();

        if ($yaReservada) {
            return response()->json([
                'success' => false,
                'message' => 'Ya tienes una reserva en esta ruta.',
            ], 409);
        }

        // SIM-009: la hora de recogida es la salida de la ruta (fuente: route-matching),
        // nunca la que envía el cliente.
        $salidaProgramada = isset($ruta['scheduled_departure_time'])
            ? Carbon::parse($ruta['scheduled_departure_time'])->utc()
            : null;

        if (! $salidaProgramada) {
            return response()->json([
                'success' => false,
                'message' => 'No fue posible validar la ruta seleccionada. Intenta nuevamente.',
            ], 422);
        }

        $pin = str_pad((string) random_int(1000, 9999), 4, '0', STR_PAD_LEFT);

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
            'status' => Trip::STATUS_CONFIRMADO,
            'scheduled_pickup_time' => $salidaProgramada,
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

        if (! $trip->verifyBoardingPin($pinIngresado)) {
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
     * Completar el viaje en el campus universitario (Conductor).
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
        $this->registrarResumenParaEntrenamiento($trip);

        return response()->json([
            'success' => true,
            'message' => 'Viaje completado exitosamente en el campus universitario.',
            'data' => [
                'trip_id' => $trip->id,
                'status' => $trip->status,
                'total_fare_cop' => (float) $trip->total_fare_cop,
                'actual_dropoff_time' => $trip->actual_dropoff_time->toISOString(),
            ],
        ]);
    }

    /**
     * Guardar el resumen comprimido del viaje (distancia real + duración real)
     * usado como dato de entrenamiento real del modelo XGBoost de ETA — sin
     * distancia confiable (route-matching-service no respondió) se omite en vez
     * de insertar un valor fabricado que contaminaría el set de entrenamiento.
     */
    private function registrarResumenParaEntrenamiento(Trip $trip): void
    {
        try {
            $distanciaKm = $this->routeMatchingClient->getRouteDistanceKm($trip->route_id);

            if ($distanciaKm === null || ! $trip->actual_pickup_time || ! $trip->actual_dropoff_time) {
                return;
            }

            $duracionMinutos = $trip->actual_pickup_time->diffInSeconds($trip->actual_dropoff_time) / 60.0;

            TripCompletedSummary::updateOrCreate(
                ['trip_id' => $trip->id],
                [
                    'actual_duration_minutes' => round($duracionMinutos, 2),
                    'total_distance_km' => $distanciaKm,
                    'completed_at' => $trip->actual_dropoff_time,
                ]
            );
        } catch (\Throwable $e) {
            Log::warning('No se pudo registrar el resumen de entrenamiento del viaje.', [
                'trip_id' => $trip->id,
                'exception_class' => get_class($e),
            ]);
        }
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

        $motivo = $request->input('reason');
        $userId = $request->attributes->get('user_id');

        // El rol sale del JWT, nunca del cuerpo (`cancelled_by` se ignora): el
        // conductor del viaje cancela como conductor, el pasajero como pasajero.
        $rol = $userId === (string) $trip->driver_id ? 'conductor' : 'pasajero';

        if ($rol === 'conductor') {
            $resultado = $trip->cancelByDriver($motivo, $userId);

            return response()->json([
                'success' => true,
                'message' => 'Viaje cancelado por el conductor.',
                'data' => [
                    'trip_id' => $trip->id,
                    'status' => $trip->status,
                    'late_cancellation' => $resultado['penalized'],
                ] + $this->lateCancellationOutcome($resultado['penalized'], $userId),
            ]);
        }

        $resultado = $trip->cancelByPassenger($motivo, $userId);

        return response()->json([
            'success' => true,
            'message' => 'Viaje cancelado por el pasajero.',
            'data' => [
                'trip_id' => $trip->id,
                'status' => $trip->status,
                'late_cancellation' => $resultado['penalized'],
            ] + $this->lateCancellationOutcome($resultado['penalized'], $userId),
        ]);
    }

    /**
     * Si la cancelación fue tardía, evalúa el umbral de suspensión automática y arma
     * los campos de la respuesta. Un fallo de auth-service nunca hace fallar la cancelación.
     *
     * @return array<string, mixed>
     */
    private function lateCancellationOutcome(bool $esTardia, string $userId): array
    {
        if (! $esTardia) {
            return ['warning' => null];
        }

        $umbral = config('uniwheels.late_cancellations.threshold');
        $ventana = config('uniwheels.late_cancellations.window_days');
        $dias = config('uniwheels.late_cancellations.suspension_days');

        $estado = $this->lateCancellationPolicy->evaluate($userId);

        if ($estado['suspended']) {
            $hasta = $estado['suspended_until']
                ? Carbon::parse($estado['suspended_until'])->setTimezone('America/Bogota')->format('d/m/Y')
                : null;
            $warning = "Acumulaste {$umbral} cancelaciones tardías en {$ventana} días. Tu cuenta quedó suspendida"
                .($hasta ? " hasta el {$hasta}." : '.');
        } else {
            $warning = "Se registró una cancelación tardía ({$estado['late_cancellations_30d']} de {$umbral} en {$ventana} días). Al llegar a {$umbral} tu cuenta se suspende por {$dias} días.";
        }

        return $estado + ['warning' => $warning];
    }

    /**
     * Obtener el viaje activo actual de un pasajero.
     */
    public function activePassengerTrip(Request $request): JsonResponse
    {
        $passengerId = $request->attributes->get('user_id');

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
                'scheduled_pickup_time' => $trip->scheduled_pickup_time?->toISOString() ?? now()->toISOString(),
            ] : null,
        ]);
    }

    /**
     * Obtener el historial de viajes como pasajero.
     */
    public function passengerHistory(Request $request): JsonResponse
    {
        $passengerId = $request->attributes->get('user_id');

        $history = Trip::where('passenger_id', $passengerId)
            ->latest()
            ->limit(20)
            ->get()
            ->map(function ($trip) {
                return [
                    'id' => $trip->id,
                    'route_id' => $trip->route_id,
                    'driver_id' => $trip->driver_id,
                    'driver_name' => $trip->driver_name,
                    'vehicle_model' => $trip->vehicle_model,
                    'vehicle_plate' => $trip->vehicle_plate,
                    'origin' => $trip->pickup_address,
                    'pickup_address' => $trip->pickup_address,
                    'destination' => $trip->dropoff_address,
                    'dropoff_address' => $trip->dropoff_address,
                    'fare_cop' => (float) $trip->total_fare_cop,
                    'is_pin_verified' => (bool) $trip->is_pin_verified,
                    'status' => $trip->status,
                    'scheduled_pickup_time' => $trip->scheduled_pickup_time?->toISOString(),
                    'date' => $trip->created_at?->clone()->setTimezone('America/Bogota')->format('d/m/Y') ?? 'Hoy',
                    'time' => $trip->created_at?->clone()->setTimezone('America/Bogota')->format('h:i A') ?? '07:00 AM',
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }

    /**
     * Obtener el historial de viajes como conductor.
     */
    public function driverHistory(Request $request): JsonResponse
    {
        $driverId = $request->attributes->get('user_id');

        $history = Trip::where('driver_id', $driverId)
            ->latest()
            ->limit(20)
            ->get()
            ->map(function ($trip) {
                return [
                    'id' => $trip->id,
                    'route_id' => $trip->route_id,
                    'passenger_id' => $trip->passenger_id,
                    'passenger_name' => $trip->passenger_name,
                    'driver_name' => $trip->driver_name,
                    'vehicle_plate' => $trip->vehicle_plate,
                    'vehicle_model' => $trip->vehicle_model,
                    'origin' => $trip->pickup_address,
                    'pickup_address' => $trip->pickup_address,
                    'destination' => $trip->dropoff_address,
                    'dropoff_address' => $trip->dropoff_address,
                    'fare_cop' => (float) $trip->total_fare_cop,
                    'is_pin_verified' => (bool) $trip->is_pin_verified,
                    'status' => $trip->status,
                    'scheduled_pickup_time' => $trip->scheduled_pickup_time?->toISOString(),
                    'date' => $trip->created_at?->clone()->setTimezone('America/Bogota')->format('d/m/Y') ?? 'Hoy',
                    'time' => $trip->created_at?->clone()->setTimezone('America/Bogota')->format('h:i A') ?? '07:00 AM',
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }
}
