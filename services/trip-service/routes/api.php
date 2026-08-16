<?php

use App\Http\Controllers\Api\V1\TripLifecycleController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — UniWheels Trip Lifecycle & Live Telemetry Service
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Ciclo de vida del viaje
    Route::post('/trips', [TripLifecycleController::class, 'store']);
    Route::post('/trips/{id}/start', [TripLifecycleController::class, 'start']);
    Route::post('/trips/{id}/arrive', [TripLifecycleController::class, 'arrive']);
    Route::post('/trips/{id}/verify-pin', [TripLifecycleController::class, 'verifyPin']);
    Route::post('/trips/{id}/complete', [TripLifecycleController::class, 'complete']);
    Route::post('/trips/{id}/cancel', [TripLifecycleController::class, 'cancel']);

    // Consultas de estado activo
    Route::get('/passenger/{passengerId}/active-trip', [TripLifecycleController::class, 'activePassengerTrip']);
});
