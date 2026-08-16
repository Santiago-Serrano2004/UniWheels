<?php

use App\Http\Controllers\Api\V1\NotificationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — UniWheels Push Notifications & Alert Dispatcher
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Despacho de notificaciones
    Route::post('/notifications/send', [NotificationController::class, 'send']);

    // Consultas y acciones del usuario
    Route::get('/users/{userId}/notifications', [NotificationController::class, 'index']);
    Route::get('/users/{userId}/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/users/{userId}/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
});
