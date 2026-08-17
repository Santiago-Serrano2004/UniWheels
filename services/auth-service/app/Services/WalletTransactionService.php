<?php

namespace App\Services;

use App\Models\UserWallet;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Servicio Financiero de Billeteras con Bloqueo Pesimista (Pessimistic Locking).
 * 
 * Previene condiciones de carrera (Race Conditions) y garantiza la integridad
 * contable mediante transacciones ACID y bloqueo de filas 'FOR UPDATE' en PostgreSQL.
 */
class WalletTransactionService
{
    const DEUDA_MAXIMA_COP = -5000.00; // Límite de crédito operativo (-$5.000 COP)

    /**
     * Recargar saldo en la billetera del usuario.
     *
     * @param string $userId UUID del usuario
     * @param float $monto Monto positivo en COP
     * @param string $tipoTransaccion 'recarga_nequi' | 'recarga_pse' | 'ajuste_administrativo'
     * @param string|null $referencia ID de transacción de pasarela
     * @return WalletTransaction
     */
    public function creditBalance(
        string $userId,
        float $monto,
        string $tipoTransaccion = 'recarga_nequi',
        ?string $referencia = null
    ): WalletTransaction {
        if ($monto <= 0) {
            throw new InvalidArgumentException('El monto de recarga debe ser estrictamente positivo.');
        }

        return DB::transaction(function () use ($userId, $monto, $tipoTransaccion, $referencia) {
            // Bloqueo pesimista de fila en PostgreSQL para evitar escrituras concurrentes
            $wallet = UserWallet::where('user_id', $userId)
                ->lockForUpdate()
                ->firstOrFail();

            $saldoAnterior = (float) $wallet->balance_cop;
            $saldoPosterior = round($saldoAnterior + $monto, 2);

            // Desbloquear si el saldo supera la deuda máxima
            $estaBloqueada = $saldoPosterior < self::DEUDA_MAXIMA_COP;

            $wallet->update([
                'balance_cop' => $saldoPosterior,
                'is_locked' => $estaBloqueada,
            ]);

            return WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'transaction_type' => $tipoTransaccion,
                'amount_cop' => $monto,
                'balance_before_cop' => $saldoAnterior,
                'balance_after_cop' => $saldoPosterior,
                'reference_id' => $referencia,
                'status' => 'completado',
                'notes' => 'Recarga procesada exitosamente.',
            ]);
        });
    }

    /**
     * Debitar comisión de viaje del conductor con bloqueo pesimista.
     *
     * @param string $userId UUID del conductor
     * @param float $montoComision Monto de la comisión en COP
     * @param string|null $tripId UUID del viaje asociado
     * @return WalletTransaction
     */
    public function debitTripCommission(
        string $userId,
        float $montoComision,
        ?string $tripId = null
    ): WalletTransaction {
        if ($montoComision <= 0) {
            throw new InvalidArgumentException('El monto de comisión debe ser mayor a 0.');
        }

        return DB::transaction(function () use ($userId, $montoComision, $tripId) {
            $wallet = UserWallet::where('user_id', $userId)
                ->lockForUpdate()
                ->firstOrFail();

            $saldoAnterior = (float) $wallet->balance_cop;
            $saldoPosterior = round($saldoAnterior - $montoComision, 2);

            // Bloquear conductor si excede la deuda máxima de -$5.000 COP
            $estaBloqueada = $saldoPosterior < self::DEUDA_MAXIMA_COP;

            $wallet->update([
                'balance_cop' => $saldoPosterior,
                'is_locked' => $estaBloqueada,
            ]);

            return WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'transaction_type' => 'cobro_comision_viaje',
                'amount_cop' => -$montoComision,
                'balance_before_cop' => $saldoAnterior,
                'balance_after_cop' => $saldoPosterior,
                'reference_id' => $tripId,
                'status' => 'completado',
                'notes' => 'Débito automático de comisión colaborativa.',
            ]);
        });
    }
}
