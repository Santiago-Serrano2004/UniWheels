<?php

use App\Http\Controllers\Api\V1\DeviceTokenController;
use App\Http\Controllers\Api\V1\Internal\PersonalDataController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\PushSubscriptionController;
use App\Http\Controllers\Api\V1\RatingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — UniWheels Push Notifications & Alert Dispatcher
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Despacho de notificaciones — solo servicio-a-servicio (nunca desde la app cliente).
    Route::post('/notifications/send', [NotificationController::class, 'send'])
        ->middleware('jwt.service');

    // Clave pública VAPID — necesaria para suscribirse, sin datos sensibles.
    // Borrado de datos personales (Ley 1581), solo servicio-a-servicio desde auth-service.
    Route::delete('/internal/users/{id}/personal-data', [PersonalDataController::class, 'destroy'])
        ->whereUuid('id')
        ->middleware('jwt.service');

    Route::get('/push/vapid-public-key', [PushSubscriptionController::class, 'vapidPublicKey']);

    Route::middleware('jwt.auth')->group(function () {
        Route::post('/push/subscribe', [PushSubscriptionController::class, 'store']);
        Route::delete('/push/unsubscribe', [PushSubscriptionController::class, 'destroy']);
        Route::post('/push/device-tokens', [DeviceTokenController::class, 'store']);
        Route::post('/push/device-tokens/remove', [DeviceTokenController::class, 'destroy']);

        // Consultas y acciones del usuario autenticado (identidad siempre desde el JWT).
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

        // Calificaciones bidireccionales 1-5 estrellas.
        Route::post('/ratings', [RatingController::class, 'store']);
        Route::get('/ratings/received', [RatingController::class, 'received']);
    });
});
