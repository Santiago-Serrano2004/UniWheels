<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\InstitutionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — UniWheels Auth & Identity Service
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Rutas públicas
    Route::get('/institutions', [InstitutionController::class, 'index']);
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/auth/send-verification-code', [AuthController::class, 'sendVerificationCode']);
    Route::post('/driver/register', [AuthController::class, 'registerDriver']);

    // Rutas protegidas por Bearer Token (Sanctum)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
    });
});
