<?php

use App\Http\Controllers\Api\V1\RouteController;
use App\Http\Controllers\Api\V1\RouteSeatController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — UniWheels Geo & AI Route Matching Service
|--------------------------------------------------------------------------
*/

// Control atómico de cupos — solo servicio-a-servicio (trip-service). route-matching
// es la dueña de routes.available_seats.
Route::prefix('v1/internal')->middleware('jwt.service')->group(function () {
    Route::post('/routes/{id}/reserve-seat', [RouteSeatController::class, 'reserve'])->whereUuid('id');
    Route::post('/routes/{id}/release-seat', [RouteSeatController::class, 'release'])->whereUuid('id');
});

Route::prefix('v1')->middleware('jwt.auth')->group(function () {
    // Búsqueda y Emparejamiento Geoespacial (Pasajero) — cálculo espacial costoso, limitado.
    Route::post('/routes/search-match', [RouteController::class, 'searchMatches'])
        ->middleware('throttle:30,1');

    // Evaluación de Desvío Asistido por IA (Modalidad 2)
    Route::post('/routes/{id}/evaluate-detour', [RouteController::class, 'evaluateDetour'])
        ->whereUuid('id')
        ->middleware('throttle:30,1');

    // Aporte sugerido y tope para el conductor — declarada antes de /routes/{id}.
    Route::get('/routes/contribution-suggestion', [RouteController::class, 'contributionSuggestion']);

    // Rutas de Carpooling (Conductor y Pasajero)
    Route::get('/routes', [RouteController::class, 'index']);
    Route::post('/routes', [RouteController::class, 'store']);
    Route::get('/routes/{id}', [RouteController::class, 'show'])->whereUuid('id');

    // Optimización multi-pasajero (ALNS) del orden de paradas de una ruta activa.
    Route::post('/routes/{id}/optimize-passengers', [RouteController::class, 'optimizePassengers'])
        ->whereUuid('id')
        ->middleware('throttle:20,1');
});
