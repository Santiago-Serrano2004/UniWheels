<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use App\Services\WompiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class TripPaymentController extends Controller
{
    public function __construct(private WompiService $wompiService) {}

    /**
     * Iniciar el cobro con tarjeta de un viaje — solo el pasajero dueño del
     * viaje, y solo si eligió 'tarjeta' como método de pago al reservar.
     */
    public function initCardPayment(Request $request, string $id): JsonResponse
    {
        $trip = Trip::findOrFail($id);

        if ((string) $trip->passenger_id !== (string) $request->attributes->get('user_id')) {
            return response()->json(['success' => false, 'message' => 'No autorizado para pagar este viaje.'], 403);
        }

        if (! $trip->isPaymentByCard()) {
            return response()->json([
                'success' => false,
                'message' => 'Este viaje no está configurado para pago con tarjeta.',
            ], 422);
        }

        if ($trip->payment_confirmed_at) {
            return response()->json(['success' => false, 'message' => 'Este viaje ya tiene el pago confirmado.'], 422);
        }

        // Referencia autodescriptiva (prefijo TP- = Trip Payment) — el webhook
        // la usa para encontrar el viaje sin necesitar una tabla aparte.
        $referencia = 'TP-'.$trip->id.'-'.Str::random(6);
        $trip->update(['payment_reference' => $referencia]);

        return response()->json([
            'success' => true,
            'data' => $this->wompiService->buildWidgetParams($referencia, (float) $trip->total_fare_cop),
        ]);
    }

    /**
     * Webhook público de Wompi para pagos de viaje (prefijo TP-). Los eventos
     * de recarga de billetera (prefijo WR-) los procesa auth-service en el suyo.
     */
    public function wompiWebhook(Request $request): JsonResponse
    {
        $payload = $request->all();

        if (! $this->wompiService->verifyWebhookSignature($payload)) {
            Log::warning('Webhook de Wompi con firma inválida recibido en trip-service.');

            return response()->json(['success' => false, 'message' => 'Firma inválida.'], 403);
        }

        $transaccion = $payload['data']['transaction'] ?? null;
        $referencia = $transaccion['reference'] ?? null;
        $estado = $transaccion['status'] ?? null;

        if (! $referencia || ! str_starts_with($referencia, 'TP-')) {
            return response()->json(['success' => true, 'message' => 'Evento recibido, sin acción para esta referencia.']);
        }

        $trip = Trip::where('payment_reference', $referencia)->first();

        if (! $trip) {
            Log::warning('Webhook de Wompi: no se encontró un viaje para la referencia.', ['reference' => $referencia]);

            return response()->json(['success' => true, 'message' => 'Referencia no reconocida.']);
        }

        if ($trip->payment_confirmed_at) {
            return response()->json(['success' => true, 'message' => 'Evento ya procesado previamente.']);
        }

        if ($estado === 'APPROVED') {
            $trip->update(['payment_confirmed_at' => now()]);
        }

        return response()->json(['success' => true]);
    }
}
