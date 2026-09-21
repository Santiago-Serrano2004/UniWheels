<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\WalletTransaction;
use App\Models\WompiWebhookEvent;
use App\Services\WalletTransactionService;
use App\Services\WompiService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WalletController extends Controller
{
    public function __construct(
        private WalletTransactionService $walletService,
        private WompiService $wompiService
    ) {}

    /**
     * Iniciar una recarga de billetera vía Wompi — el saldo NUNCA se acredita
     * aquí, solo cuando llegue el webhook confirmando el pago real.
     */
    public function initRecharge(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'amount_cop' => ['required', 'numeric', 'min:5000', 'max:500000'],
        ]);

        $userId = $request->attributes->get('user_id');
        // Referencia autodescriptiva: el webhook la usa para saber a quién
        // acreditar sin necesitar una tabla aparte de "intents" de pago.
        $referencia = 'WR-'.$userId.'-'.now()->format('YmdHis').'-'.Str::random(6);

        return response()->json([
            'success' => true,
            'data' => $this->wompiService->buildWidgetParams($referencia, (float) $datos['amount_cop']),
        ]);
    }

    /**
     * Acreditar la ganancia de un conductor tras un viaje pagado con tarjeta.
     * Solo invocable por trip-service, después de confirmar el cobro real.
     */
    public function credit(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'user_id' => ['required', 'uuid'],
            'amount_cop' => ['required', 'numeric', 'min:0.01'],
            'reference' => ['nullable', 'string', 'max:100'],
        ]);

        try {
            $transaccion = $this->walletService->creditBalance(
                $datos['user_id'],
                (float) $datos['amount_cop'],
                'pago_recibido_billetera',
                $datos['reference'] ?? null
            );

            return response()->json(['success' => true, 'data' => $transaccion]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'El usuario no tiene una billetera registrada.'], 404);
        }
    }

    /**
     * Debitar la comisión de plataforma de la billetera del conductor tras un
     * viaje pagado P2P (efectivo/Nequi/Daviplata directo). Solo trip-service.
     */
    public function debitCommission(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'user_id' => ['required', 'uuid'],
            'amount_cop' => ['required', 'numeric', 'min:0.01'],
            'trip_id' => ['nullable', 'string', 'max:100'],
        ]);

        try {
            $transaccion = $this->walletService->debitTripCommission(
                $datos['user_id'],
                (float) $datos['amount_cop'],
                $datos['trip_id'] ?? null
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'wallet_locked' => $transaccion->wallet->fresh()->is_locked,
                    'transaction' => $transaccion,
                ],
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'El conductor no tiene una billetera registrada.'], 404);
        } catch (UniqueConstraintViolationException $e) {
            // reference_id (trip_id) ya tiene una comisión debitada — un reintento
            // de trip-service para el mismo viaje no debe duplicar el cobro.
            $transaccionExistente = WalletTransaction::where('reference_id', $datos['trip_id'] ?? null)->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'wallet_locked' => $transaccionExistente?->wallet?->fresh()?->is_locked,
                    'transaction' => $transaccionExistente,
                ],
            ]);
        }
    }

    /**
     * Webhook público de Wompi — verificado por firma propia (no JWT, Wompi no
     * puede firmar nuestros tokens). Idempotente: si la referencia ya fue
     * procesada, responde 200 sin volver a acreditar (Wompi reintenta eventos).
     *
     * Persiste el payload de CADA evento recibido (APPROVED, DECLINED, VOIDED, etc.)
     * para trazabilidad contable y conciliación diaria.
     */
    public function wompiWebhook(Request $request): JsonResponse
    {
        $payload = $request->all();
        $isValid = $this->wompiService->verifyWebhookSignature($payload);

        $transaccion = $payload['data']['transaction'] ?? null;
        $referencia = $transaccion['reference'] ?? null;
        $estado = $transaccion['status'] ?? null;
        $transactionId = $transaccion['id'] ?? null;
        $amountInCents = isset($transaccion['amount_in_cents']) ? (int) $transaccion['amount_in_cents'] : null;
        $currency = $transaccion['currency'] ?? 'COP';
        $eventType = $payload['event'] ?? 'transaction.updated';
        $checksum = $payload['signature']['checksum'] ?? null;

        // Persistir el evento completo de CADA webhook recibido
        $webhookEvent = WompiWebhookEvent::create([
            'event_type' => $eventType,
            'transaction_id' => $transactionId,
            'reference' => $referencia,
            'status' => $estado,
            'amount_in_cents' => $amountInCents,
            'currency' => $currency,
            'checksum' => $checksum,
            'signature_valid' => $isValid,
            'payload' => $payload,
        ]);

        if (! $isValid) {
            Log::warning('Webhook de Wompi con firma inválida recibido.', ['reference' => $referencia]);
            $webhookEvent->update(['error_message' => 'Firma inválida']);

            return response()->json(['success' => false, 'message' => 'Firma inválida.'], 403);
        }

        // Solo nos interesan las recargas de billetera (prefijo WR-) — los pagos
        // con tarjeta de un viaje (prefijo TP-) los procesa trip-service en su
        // propio webhook.
        if (! $referencia || ! str_starts_with($referencia, 'WR-')) {
            return response()->json(['success' => true, 'message' => 'Evento recibido, sin acción para esta referencia.']);
        }

        // Si no está aprobado, ya quedó persistido para auditoría y conciliación
        if ($estado !== 'APPROVED') {
            return response()->json(['success' => true, 'message' => 'Evento recibido con estado: '.$estado]);
        }

        if (WalletTransaction::where('reference_id', $referencia)->exists()) {
            $webhookEvent->update(['processed' => true, 'processed_at' => now()]);

            return response()->json(['success' => true, 'message' => 'Evento ya procesado previamente.']);
        }

        // WR-{userId}-{fecha}-{random} — el userId es un UUID (36 caracteres).
        $partes = explode('-', $referencia);
        $userId = implode('-', array_slice($partes, 1, 5));
        $montoCop = ($amountInCents ?? 0) / 100;

        try {
            $this->walletService->creditBalance($userId, (float) $montoCop, 'recarga_tarjeta', $referencia);
            $webhookEvent->update(['processed' => true, 'processed_at' => now()]);
        } catch (UniqueConstraintViolationException $e) {
            // Protección contra reintentos concurrentes a nivel de base de datos
            $webhookEvent->update(['processed' => true, 'processed_at' => now()]);
            Log::info('Webhook de Wompi: referencia ya procesada concurrentemente.', ['reference' => $referencia]);
        } catch (ModelNotFoundException $e) {
            $webhookEvent->update(['error_message' => 'Usuario no encontrado para recarga']);
            Log::error('Webhook de Wompi: usuario no encontrado para recarga.', ['reference' => $referencia]);
        } catch (\Throwable $e) {
            $webhookEvent->update(['error_message' => $e->getMessage()]);
            Log::error('Webhook de Wompi: error procesando recarga.', ['reference' => $referencia, 'error' => $e->getMessage()]);
            throw $e;
        }

        return response()->json(['success' => true]);
    }
}
