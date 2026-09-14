<?php

use App\Http\Controllers\Api\V1\RouteController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — UniWheels Geo & AI Route Matching Service
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->middleware('jwt.auth')->group(function () {
    // Búsqueda y Emparejamiento Geoespacial (Pasajero) — cálculo espacial costoso, limitado.
    Route::post('/routes/search-match', [RouteController::class, 'searchMatches'])
        ->middleware('throttle:30,1');

    // Evaluación de Desvío Asistido por IA (Modalidad 2)
    Route::post('/routes/{id}/evaluate-detour', [RouteController::class, 'evaluateDetour'])
        ->middleware('throttle:30,1');

    // Rutas de Carpooling (Conductor y Pasajero)
    Route::get('/routes', [RouteController::class, 'index']);
    Route::post('/routes', [RouteController::class, 'store']);
    Route::get('/routes/{id}', [RouteController::class, 'show']);

    // Optimización multi-pasajero (ALNS) del orden de paradas de una ruta activa.
    Route::post('/routes/{id}/optimize-passengers', [RouteController::class, 'optimizePassengers'])
        ->middleware('throttle:20,1');
});
