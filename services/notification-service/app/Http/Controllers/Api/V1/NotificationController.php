<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SendNotificationRequest;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Enviar y registrar una nueva notificación para un usuario.
     */
    public function send(SendNotificationRequest $request): JsonResponse
    {
        $datos = $request->validated();

        $notificacion = Notification::create([
            'user_id' => $datos['user_id'],
            'title' => $datos['title'],
            'body' => $datos['body'],
            'type' => $datos['type'],
            'payload_json' => $datos['payload_json'] ?? null,
            'is_read' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Notificación despachada y registrada exitosamente.',
            'data' => [
                'id' => $notificacion->id,
                'user_id' => $notificacion->user_id,
                'title' => $notificacion->title,
                'body' => $notificacion->body,
                'type' => $notificacion->type,
                'is_read' => $notificacion->is_read,
                'created_at' => $notificacion->created_at->toISOString(),
            ],
        ], 201);
    }

    /**
     * Obtener el listado de notificaciones de un usuario con contador de no leídas.
     */
    public function index(string $userId): JsonResponse
    {
        $notificaciones = Notification::forUser($userId)
            ->latest()
            ->take(30)
            ->get();

        $unreadCount = Notification::forUser($userId)->unread()->count();

        return response()->json([
            'success' => true,
            'unread_count' => $unreadCount,
            'data' => $notificaciones->map(fn (Notification $n) => [
                'id' => $n->id,
                'title' => $n->title,
                'body' => $n->body,
                'type' => $n->type,
                'payload' => $n->payload_json,
                'is_read' => $n->is_read,
                'read_at' => $n->read_at ? $n->read_at->toISOString() : null,
                'created_at' => $n->created_at->toISOString(),
            ]),
        ]);
    }

    /**
     * Marcar una notificación específica como leída.
     */
    public function markAsRead(string $id): JsonResponse
    {
        $notificacion = Notification::findOrFail($id);
        $notificacion->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notificación marcada como leída.',
            'data' => [
                'id' => $notificacion->id,
                'is_read' => true,
                'read_at' => $notificacion->read_at->toISOString(),
            ],
        ]);
    }

    /**
     * Marcar todas las notificaciones de un usuario como leídas.
     */
    public function markAllAsRead(string $userId): JsonResponse
    {
        Notification::forUser($userId)
            ->unread()
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Todas las notificaciones han sido marcadas como leídas.',
        ]);
    }

    /**
     * Obtener solo el contador de no leídas.
     */
    public function unreadCount(string $userId): JsonResponse
    {
        $count = Notification::forUser($userId)->unread()->count();

        return response()->json([
            'success' => true,
            'unread_count' => $count,
        ]);
    }
}
