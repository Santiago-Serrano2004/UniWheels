<?php

namespace App\Services;

use App\Models\PushSubscription;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

/**
 * Entrega real de notificaciones push del navegador (Web Push estándar, sin
 * cuenta de terceros ni costo — funciona con las claves VAPID propias del
 * proyecto). Se invoca desde NotificationController::send() justo después de
 * persistir el registro en BD, para que además de aparecer en el historial
 * in-app, el usuario reciba un push real aunque tenga la pestaña cerrada.
 */
class WebPushService
{
    private function client(): ?WebPush
    {
        $public = config('services.vapid.public_key');
        $private = config('services.vapid.private_key');

        if (! $public || ! $private) {
            return null;
        }

        // La librería emite un E_USER_NOTICE informativo si no encuentra GMP/BCMath
        // (usa una implementación pura en PHP como respaldo, más lenta pero funcional
        // para el volumen de este proyecto) — se suprime para no romper en entornos
        // donde Laravel convierte notices en excepciones (tests).
        return @new WebPush([
            'VAPID' => [
                'subject' => config('services.vapid.subject'),
                'publicKey' => $public,
                'privateKey' => $private,
            ],
        ]);
    }

    /**
     * Enviar un push a todas las suscripciones activas de un usuario. Las
     * suscripciones que el navegador ya invalidó (410/404) se eliminan.
     */
    public function sendToUser(string $userId, string $title, string $body, array $payload = []): void
    {
        $webPush = $this->client();
        if (! $webPush) {
            Log::info('Push omitido: VAPID no configurado todavía.');

            return;
        }

        $suscripciones = PushSubscription::forUser($userId)->get();
        if ($suscripciones->isEmpty()) {
            return;
        }

        $mensaje = json_encode([
            'title' => $title,
            'body' => $body,
            'data' => $payload,
        ]);

        foreach ($suscripciones as $sub) {
            $webPush->queueNotification(
                Subscription::create([
                    'endpoint' => $sub->endpoint,
                    'keys' => [
                        'p256dh' => $sub->p256dh_key,
                        'auth' => $sub->auth_key,
                    ],
                ]),
                $mensaje
            );
        }

        foreach ($webPush->flush() as $reporte) {
            if ($reporte->isSuccess()) {
                continue;
            }

            $codigo = $reporte->getResponse()?->getStatusCode();
            if (in_array($codigo, [404, 410], true)) {
                PushSubscription::where('endpoint', $reporte->getEndpoint())->delete();
            } else {
                Log::warning('Fallo al entregar push.', [
                    'endpoint' => $reporte->getEndpoint(),
                    'reason' => $reporte->getReason(),
                ]);
            }
        }
    }
}
