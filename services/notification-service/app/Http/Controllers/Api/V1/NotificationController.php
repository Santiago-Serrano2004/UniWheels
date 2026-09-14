<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SendNotificationRequest;
use App\Models\Notification;
use App\Services\WebPushService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private WebPushService $webPushService) {}

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

        // Entrega real al dispositivo (Web Push) además del registro in-app — si el
        // usuario no tiene suscripciones activas o VAPID no está configurado, esto
        // es un no-op silencioso (ver WebPushService).
        $this->webPushService->sendToUser(
            $datos['user_id'],
            $datos['title'],
            $datos['body'],
            $datos['payload_json'] ?? []
        );

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
    public function index(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('user_id');

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
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $userId = $request->attributes->get('user_id');

        $notificacion = null;
        if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id)) {
            $notificacion = Notification::find($id);
        }

        if (! $notificacion) {
            return response()->json([
                'success' => false,
                'message' => 'Notificación no encontrada.',
            ], 404);
        }

        if ((string) $notificacion->user_id !== (string) $userId) {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado para modificar esta notificación.',
            ], 403);
        }

        $notificacion->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notificación marcada como leída.',
            'data' => [
                'id' => $id,
                'is_read' => true,
                'read_at' => now()->toISOString(),
            ],
        ]);
    }

    /**
     * Marcar todas las notificaciones del usuario autenticado como leídas.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('user_id');

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
     * Obtener solo el contador de no leídas del usuario autenticado.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('user_id');
        $count = Notification::forUser($userId)->unread()->count();

        return response()->json([
            'success' => true,
            'unread_count' => $count,
        ]);
    }
}
