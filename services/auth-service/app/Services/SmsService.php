<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Envío de SMS con driver intercambiable — 'log' por defecto (escribe el mensaje
 * en el log de Laravel, sin costo ni cuenta externa, útil en desarrollo/pruebas)
 * y 'twilio' para producción una vez se configuren credenciales reales. Mismo
 * patrón defensivo que el resto de integraciones externas del proyecto: si el
 * proveedor real falla, se registra el error pero no se rompe el flujo de registro.
 */
class SmsService
{
    public function send(string $telefono, string $mensaje): bool
    {
        $driver = config('services.sms.driver', 'log');

        return match ($driver) {
            'twilio' => $this->enviarPorTwilio($telefono, $mensaje),
            default => $this->enviarPorLog($telefono, $mensaje),
        };
    }

    private function enviarPorLog(string $telefono, string $mensaje): bool
    {
        Log::info("[SMS simulado -> {$telefono}]: {$mensaje}");

        return true;
    }

    private function enviarPorTwilio(string $telefono, string $mensaje): bool
    {
        $sid = config('services.sms.twilio_sid');
        $token = config('services.sms.twilio_token');
        $from = config('services.sms.twilio_from');

        if (! $sid || ! $token || ! $from) {
            Log::warning('SMS_DRIVER=twilio pero faltan credenciales; usando fallback de log.');

            return $this->enviarPorLog($telefono, $mensaje);
        }

        try {
            $respuesta = Http::asForm()
                ->withBasicAuth($sid, $token)
                ->timeout(5)
                ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                    'From' => $from,
                    'To' => $this->formatearNumeroE164($telefono),
                    'Body' => $mensaje,
                ]);

            if (! $respuesta->successful()) {
                Log::error('Twilio rechazó el envío del SMS.', ['status' => $respuesta->status(), 'body' => $respuesta->body()]);
            }

            return $respuesta->successful();
        } catch (\Throwable $e) {
            Log::error('Error al enviar SMS vía Twilio: '.$e->getMessage());

            return false;
        }
    }

    private function formatearNumeroE164(string $telefono): string
    {
        $limpio = preg_replace('/\D/', '', $telefono);
        // Celulares colombianos: 10 dígitos empezando en 3 -> anteponer +57
        if (strlen($limpio) === 10 && str_starts_with($limpio, '3')) {
            return '+57'.$limpio;
        }

        return str_starts_with($telefono, '+') ? $telefono : '+'.$limpio;
    }
}
