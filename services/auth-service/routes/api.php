<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\InstitutionController;
use App\Http\Controllers\Api\V1\TripController;
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

    // Rutas dinámicas de viajes, historial y calificaciones
    Route::get('/trips/available', [TripController::class, 'getAvailableTrips']);
    Route::get('/driver/history', [TripController::class, 'getDriverHistory']);
    Route::get('/passenger/history', [TripController::class, 'getPassengerHistory']);
    Route::get('/wallet/transactions', [TripController::class, 'getWalletTransactions']);
    Route::get('/user/reputation-stats', [TripController::class, 'getUserReputationStats']);
    Route::post('/ratings', [TripController::class, 'submitRating']);

    // Rutas protegidas por Bearer Token (Sanctum)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
    });
});
