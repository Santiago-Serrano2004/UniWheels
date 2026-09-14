<?php

namespace App\Services;

/**
 * Integración con Wompi para el cobro con tarjeta de un viaje — mismo esquema
 * que auth-service (que la usa para recargas de billetera); se duplica aquí
 * a propósito, siguiendo el mismo patrón de aislamiento por servicio que ya
 * usa JwtVerifier en cada microservicio del ecosistema.
 *
 * https://docs.wompi.co/docs/colombia/widget-checkout-web/
 * https://docs.wompi.co/docs/colombia/eventos/
 */
class WompiService
{
    public function buildWidgetParams(string $reference, float $amountCop): array
    {
        $amountInCents = (int) round($amountCop * 100);

        return [
            'public_key' => config('services.wompi.public_key'),
            'currency' => 'COP',
            'amount_in_cents' => $amountInCents,
            'reference' => $reference,
            'signature' => $this->buildIntegritySignature($reference, $amountInCents),
            'redirect_url' => config('services.wompi.redirect_url'),
        ];
    }

    public function buildIntegritySignature(string $reference, int $amountInCents, string $currency = 'COP'): string
    {
        $secretoIntegridad = config('services.wompi.integrity_secret');

        return hash('sha256', "{$reference}{$amountInCents}{$currency}{$secretoIntegridad}");
    }

    public function verifyWebhookSignature(array $payload): bool
    {
        $checksum = $payload['signature']['checksum'] ?? null;
        $propiedades = $payload['signature']['properties'] ?? null;
        $timestamp = $payload['timestamp'] ?? null;

        if (! $checksum || ! is_array($propiedades) || empty($propiedades) || ! $timestamp) {
            return false;
        }

        $secretoEventos = config('services.wompi.events_secret');
        $cadena = '';

        foreach ($propiedades as $ruta) {
            $cadena .= (string) $this->resolverValorPorRuta($payload['data'] ?? [], $ruta);
        }

        $cadena .= $timestamp.$secretoEventos;

        return hash_equals(hash('sha256', $cadena), (string) $checksum);
    }

    private function resolverValorPorRuta(array $data, string $ruta)
    {
        $valor = $data;
        foreach (explode('.', $ruta) as $segmento) {
            if (! is_array($valor) || ! array_key_exists($segmento, $valor)) {
                return null;
            }
            $valor = $valor[$segmento];
        }

        return $valor;
    }
}
