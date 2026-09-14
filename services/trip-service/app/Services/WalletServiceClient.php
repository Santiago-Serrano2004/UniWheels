<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cliente HTTP hacia auth-service para liquidar la parte financiera de un
 * viaje al completarse — auth-service es el único dueño de la billetera
 * (user_wallets/wallet_transactions), trip-service nunca las toca directo.
 */
class WalletServiceClient
{
    public function __construct(private JwtVerifier $jwtVerifier) {}

    private function client()
    {
        $token = $this->jwtVerifier->issueServiceToken('trip-service');
        $baseUrl = config('services.auth_service.url');

        return Http::withToken($token)->timeout(5)->baseUrl("{$baseUrl}/api/v1");
    }

    /**
     * Acreditar la ganancia del conductor tras un viaje pagado con tarjeta
     * (el cobro ya lo recibió la plataforma vía Wompi).
     */
    public function creditDriverPayout(string $driverId, float $amountCop, string $tripId): bool
    {
        try {
            $respuesta = $this->client()->post('/wallet/credit', [
                'user_id' => $driverId,
                'amount_cop' => $amountCop,
                'reference' => "trip:{$tripId}",
            ]);

            return $respuesta->successful();
        } catch (\Throwable $e) {
            Log::error('No se pudo acreditar la ganancia del conductor en auth-service.', [
                'trip_id' => $tripId,
                'exception_class' => get_class($e),
            ]);

            return false;
        }
    }

    /**
     * Debitar la comisión de plataforma de la billetera del conductor tras un
     * viaje pagado P2P (efectivo/Nequi/Daviplata directo).
     */
    public function debitPlatformCommission(string $driverId, float $amountCop, string $tripId): bool
    {
        try {
            $respuesta = $this->client()->post('/wallet/debit-commission', [
                'user_id' => $driverId,
                'amount_cop' => $amountCop,
                'trip_id' => $tripId,
            ]);

            return $respuesta->successful();
        } catch (\Throwable $e) {
            Log::error('No se pudo debitar la comisión del conductor en auth-service.', [
                'trip_id' => $tripId,
                'exception_class' => get_class($e),
            ]);

            return false;
        }
    }
}
