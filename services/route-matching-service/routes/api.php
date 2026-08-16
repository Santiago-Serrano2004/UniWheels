<?php

use App\Http\Controllers\Api\V1\RouteController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — UniWheels Geo & AI Route Matching Service
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Rutas de Carpooling (Conductor)
    Route::post('/routes', [RouteController::class, 'store']);
    Route::get('/routes/{id}', [RouteController::class, 'show']);

    // Búsqueda y Emparejamiento Geoespacial (Pasajero)
    Route::post('/routes/search-match', [RouteController::class, 'searchMatches']);

    // Evaluación de Desvío Asistido por IA (Modalidad 2)
    Route::post('/routes/{id}/evaluate-detour', [RouteController::class, 'evaluateDetour']);
});
