<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\InstitutionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — UniWheels Auth & Identity Service (Hardened Security)
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Rutas públicas institucionales
    Route::get('/institutions', [InstitutionController::class, 'index']);

    // Rutas públicas de autenticación con Rate Limiting (Anti Brute-Force y Anti-Spam SMTP)
    Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
    Route::post('/auth/send-verification-code', [AuthController::class, 'sendVerificationCode'])->middleware('throttle:5,1');

    // Rutas públicas de consulta de reputación y transacciones simuladas
    Route::get('/user/reputation-stats', [AuthController::class, 'reputationStats']);
    Route::get('/wallet/transactions', [AuthController::class, 'walletTransactions']);

    // Rutas protegidas estrictamente por Bearer Token (Sanctum)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/driver/register', [AuthController::class, 'registerDriver']);
        Route::delete('/auth/account', [AuthController::class, 'deleteAccount']);
        Route::post('/auth/delete-account', [AuthController::class, 'deleteAccount']);
    });
});
