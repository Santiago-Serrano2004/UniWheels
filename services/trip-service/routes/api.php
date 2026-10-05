<?php

use App\Http\Controllers\Api\V1\Admin\AdminSosEventController;
use App\Http\Controllers\Api\V1\Admin\AdminTripController;
use App\Http\Controllers\Api\V1\Internal\PersonalDataController;
use App\Http\Controllers\Api\V1\Internal\TripParticipationController;
use App\Http\Controllers\Api\V1\TrainingDataController;
use App\Http\Controllers\Api\V1\TripLifecycleController;
use App\Http\Controllers\Api\V1\TripTrackingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — UniWheels Trip Lifecycle & Live Telemetry Service
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Exportación de datos reales de viajes completados para reentrenar el
    // modelo XGBoost de ETA en ai-route-service — solo servicio-a-servicio.
    Route::get('/trips/training-data/completed', [TrainingDataController::class, 'completedTrips'])
        ->middleware('jwt.service');

    // Participantes y estado de un viaje (para validar calificaciones), solo servicio-a-servicio.
    Route::get('/internal/trips/{id}', [TripParticipationController::class, 'show'])
        ->whereUuid('id')
        ->middleware('jwt.service');

    // Borrado de datos personales (Ley 1581), solo servicio-a-servicio desde auth-service.
    Route::delete('/internal/users/{id}/personal-data', [PersonalDataController::class, 'destroy'])
        ->whereUuid('id')
        ->middleware('jwt.service');
});

Route::prefix('v1')->middleware('jwt.auth')->group(function () {
    // Ciclo de vida del viaje
    Route::post('/trips', [TripLifecycleController::class, 'store']);
    Route::post('/trips/{id}/start', [TripLifecycleController::class, 'start'])->whereUuid('id');
    Route::post('/trips/{id}/arrive', [TripLifecycleController::class, 'arrive'])->whereUuid('id');
    Route::post('/trips/{id}/verify-pin', [TripLifecycleController::class, 'verifyPin'])->whereUuid('id')
        ->middleware('throttle:5,1');
    Route::post('/trips/{id}/complete', [TripLifecycleController::class, 'complete'])->whereUuid('id');
    Route::post('/trips/{id}/cancel', [TripLifecycleController::class, 'cancel'])->whereUuid('id');

    // Telemetría GPS en vivo del conductor durante el viaje
    Route::post('/trips/{id}/tracking', [TripTrackingController::class, 'report'])->whereUuid('id')
        ->middleware('throttle:30,1');
    Route::get('/trips/{id}/tracking/latest', [TripTrackingController::class, 'latest'])->whereUuid('id');

    // Botón de pánico SOS — auditoría server-side de cada activación
    Route::post('/trips/{id}/sos', [TripTrackingController::class, 'sos'])->whereUuid('id')
        ->middleware('throttle:10,1');

    // Consultas de estado activo e historial — el usuario siempre se toma del JWT, no de la URL.
    Route::get('/passenger/active-trip', [TripLifecycleController::class, 'activePassengerTrip']);
    Route::get('/passenger/history', [TripLifecycleController::class, 'passengerHistory']);
    Route::get('/driver/history', [TripLifecycleController::class, 'driverHistory']);

    // Rutas de administración
    Route::prefix('admin')->middleware('admin')->group(function () {
        Route::get('/sos-events', [AdminSosEventController::class, 'index']);
        Route::patch('/sos-events/{id}/attend', [AdminSosEventController::class, 'attend'])->whereUuid('id');
        Route::get('/trips', [AdminTripController::class, 'index']);
    });
});
