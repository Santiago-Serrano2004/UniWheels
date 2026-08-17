<?php

use App\Http\Controllers\Api\V1\RouteController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — UniWheels Geo & AI Route Matching Service
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Búsqueda y Emparejamiento Geoespacial (Pasajero)
    Route::post('/routes/search-match', [RouteController::class, 'searchMatches']);

    // Evaluación de Desvío Asistido por IA (Modalidad 2)
    Route::post('/routes/{id}/evaluate-detour', [RouteController::class, 'evaluateDetour']);
    Route::post('/routes/evaluate-detour', [RouteController::class, 'evaluateDetour']);

    // Rutas de Carpooling (Conductor y Pasajero)
    Route::get('/routes', [RouteController::class, 'index']);
    Route::post('/routes', [RouteController::class, 'store']);
    Route::get('/routes/{id}', [RouteController::class, 'show']);
});
