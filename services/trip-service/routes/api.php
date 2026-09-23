<?php

use App\Http\Controllers\Api\V1\TrainingDataController;
use App\Http\Controllers\Api\V1\TripLifecycleController;
use App\Http\Controllers\Api\V1\TripPaymentController;
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

    // Webhook público de Wompi para pagos con tarjeta de un viaje — verificado
    // por firma propia (Wompi no puede firmar nuestros JWT).
    Route::post('/webhooks/wompi', [TripPaymentController::class, 'wompiWebhook']);
});

Route::prefix('v1')->middleware('jwt.auth')->group(function () {
    // Ciclo de vida del viaje
    Route::post('/trips', [TripLifecycleController::class, 'store']);
    Route::post('/trips/{id}/start', [TripLifecycleController::class, 'start']);
    Route::post('/trips/{id}/arrive', [TripLifecycleController::class, 'arrive']);
    Route::post('/trips/{id}/verify-pin', [TripLifecycleController::class, 'verifyPin'])
        ->middleware('throttle:5,1');
    Route::post('/trips/{id}/complete', [TripLifecycleController::class, 'complete']);
    Route::post('/trips/{id}/cancel', [TripLifecycleController::class, 'cancel']);
    Route::post('/trips/{id}/payment/card/init', [TripPaymentController::class, 'initCardPayment']);

    // Telemetría GPS en vivo del conductor durante el viaje
    Route::post('/trips/{id}/tracking', [TripTrackingController::class, 'report'])
        ->middleware('throttle:30,1');
    Route::get('/trips/{id}/tracking/latest', [TripTrackingController::class, 'latest']);

    // Botón de pánico SOS — auditoría server-side de cada activación
    Route::post('/trips/{id}/sos', [TripTrackingController::class, 'sos'])
        ->middleware('throttle:10,1');

    // Consultas de estado activo e historial — el usuario siempre se toma del JWT, no de la URL.
    Route::get('/passenger/active-trip', [TripLifecycleController::class, 'activePassengerTrip']);
    Route::get('/passenger/history', [TripLifecycleController::class, 'passengerHistory']);
    Route::get('/driver/history', [TripLifecycleController::class, 'driverHistory']);
});
