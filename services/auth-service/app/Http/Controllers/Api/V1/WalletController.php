<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\WalletTransaction;
use App\Services\WalletTransactionService;
use App\Services\WompiService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
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
        }
    }

    /**
     * Webhook público de Wompi — verificado por firma propia (no JWT, Wompi no
     * puede firmar nuestros tokens). Idempotente: si la referencia ya fue
     * procesada, responde 200 sin volver a acreditar (Wompi reintenta eventos).
     */
    public function wompiWebhook(Request $request): JsonResponse
    {
        $payload = $request->all();

        if (! $this->wompiService->verifyWebhookSignature($payload)) {
            Log::warning('Webhook de Wompi con firma inválida recibido.');

            return response()->json(['success' => false, 'message' => 'Firma inválida.'], 403);
        }

        $transaccion = $payload['data']['transaction'] ?? null;
        $referencia = $transaccion['reference'] ?? null;
        $estado = $transaccion['status'] ?? null;

        // Solo nos interesan las recargas de billetera (prefijo WR-) — los pagos
        // con tarjeta de un viaje (prefijo TP-) los procesa trip-service en su
        // propio webhook.
        if (! $referencia || ! str_starts_with($referencia, 'WR-') || $estado !== 'APPROVED') {
            return response()->json(['success' => true, 'message' => 'Evento recibido, sin acción para esta referencia.']);
        }

        if (WalletTransaction::where('reference_id', $referencia)->exists()) {
            return response()->json(['success' => true, 'message' => 'Evento ya procesado previamente.']);
        }

        // WR-{userId}-{fecha}-{random} — el userId es un UUID (36 caracteres).
        $partes = explode('-', $referencia);
        $userId = implode('-', array_slice($partes, 1, 5));
        $montoCop = ($transaccion['amount_in_cents'] ?? 0) / 100;

        try {
            $this->walletService->creditBalance($userId, (float) $montoCop, 'recarga_tarjeta', $referencia);
        } catch (ModelNotFoundException $e) {
            Log::error('Webhook de Wompi: usuario no encontrado para recarga.', ['reference' => $referencia]);
        }

        return response()->json(['success' => true]);
    }
}
