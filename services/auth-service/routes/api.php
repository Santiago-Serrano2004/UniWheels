<?php

use App\Http\Controllers\Api\V1\Admin\AdminUserController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\InstitutionController;
use App\Http\Controllers\Api\V1\Internal\UserSuspensionController;
use App\Http\Controllers\Api\V1\PublicProfileController;
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
    Route::post('/auth/register', [AuthController::class, 'register'])->middleware(['throttle:10,1', 'throttle:pin-attempt']);
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
    Route::post('/auth/send-verification-code', [AuthController::class, 'sendVerificationCode'])->middleware('throttle:5,1');
    Route::post('/auth/send-sms-code', [AuthController::class, 'sendSmsCode'])->middleware('throttle:5,1');

    // Rutas protegidas estrictamente por Bearer Token (JWT compartido)
    Route::middleware('jwt.auth')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/refresh', [AuthController::class, 'refresh']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/driver/register', [AuthController::class, 'registerDriver']);
        Route::delete('/auth/account', [AuthController::class, 'deleteAccount']);

        // Reputación del usuario autenticado (antes pública y por query param)
        Route::get('/user/reputation-stats', [AuthController::class, 'reputationStats']);
    });

    // Enriquecimiento cross-service: perfil público mínimo, solo invocable por
    // otros microservicios del backend (nunca directamente por el navegador).
    Route::middleware('jwt.service')->group(function () {
        Route::get('/users/{id}/public-profile', [PublicProfileController::class, 'show']);
        Route::post('/internal/users/{id}/late-cancellation-suspension', [UserSuspensionController::class, 'lateCancellation']);
    });

    // Rutas de administración
    Route::prefix('admin')->middleware(['jwt.auth', 'admin'])->group(function () {
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::get('/users/{id}', [AdminUserController::class, 'show'])->whereUuid('id');
        Route::post('/users/lookup', [AdminUserController::class, 'lookup']);
        Route::patch('/users/{id}/suspension', [AdminUserController::class, 'updateSuspension'])->whereUuid('id');
    });
});
