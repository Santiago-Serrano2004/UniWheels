<?php

namespace App\Services;

use App\Models\DevicePushToken;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExpoPushService
{
    /**
     * Enviar notificaciones push a los dispositivos móviles registrados y activos de un usuario.
     */
    public function sendToUser(string $userId, string $title, string $body, array $payload = []): void
    {
        $tokens = DevicePushToken::activeForUser($userId)->pluck('token')->toArray();
        if (empty($tokens)) {
            return;
        }

        $messages = array_map(fn (string $t) => [
            'to' => $t,
            'sound' => 'default',
            'title' => $title,
            'body' => $body,
            'data' => $payload,
            'priority' => 'high',
            'channelId' => 'trip_alerts',
        ], $tokens);

        try {
            $response = Http::timeout(5)->post('https://exp.host/--/api/v2/push/send', $messages);

            if ($response->successful()) {
                $results = $response->json('data') ?? [];
                foreach ($results as $index => $result) {
                    $token = $tokens[$index] ?? null;
                    if (! $token) {
                        continue;
                    }

                    if (($result['status'] ?? '') === 'error') {
                        $errorCode = $result['details']['error'] ?? null;
                        if ($errorCode === 'DeviceNotRegistered') {
                            DevicePushToken::where('token', $token)->update(['is_active' => false]);
                        } else {
                            Log::warning('Error en ticket de Expo Push.', [
                                'token' => $token,
                                'result' => $result,
                            ]);
                        }
                    } else {
                        DevicePushToken::where('token', $token)->update(['last_used_at' => now()]);
                    }
                }
            } else {
                Log::warning('Fallo HTTP al contactar Expo Push API.', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('Excepción al enviar Expo push.', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}
