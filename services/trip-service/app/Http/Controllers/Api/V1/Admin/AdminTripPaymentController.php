<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\GetAdminTripPaymentsRequest;
use App\Http\Resources\AdminTripPaymentResource;
use App\Models\Trip;
use App\Models\WompiWebhookEvent;
use Illuminate\Http\JsonResponse;

class AdminTripPaymentController extends Controller
{
    public function index(GetAdminTripPaymentsRequest $request): JsonResponse
    {
        $eventsQuery = WompiWebhookEvent::where('reference', 'like', 'TP-%');

        if ($status = $request->input('status')) {
            $eventsQuery->where('status', $status);
        }

        if ($from = $request->input('from')) {
            $eventsQuery->whereDate('created_at', '>=', $from);
        }

        if ($to = $request->input('to')) {
            $eventsQuery->whereDate('created_at', '<=', $to);
        }

        $perPage = min((int) ($request->input('per_page') ?: 15), 50);
        $events = $eventsQuery->orderByDesc('created_at')->paginate($perPage);

        // Preload associated trips by reference
        $references = collect($events->items())->pluck('reference')->filter()->unique();
        $tripsByRef = Trip::whereIn('payment_reference', $references)->get()->keyBy('payment_reference');

        $items = collect($events->items())->map(function ($event) use ($tripsByRef) {
            $resource = new AdminTripPaymentResource($event);
            if ($event->reference && isset($tripsByRef[$event->reference])) {
                $resource->additional(['trip' => $tripsByRef[$event->reference]]);
            }

            return $resource;
        });

        // Totales del período
        $tripsQuery = Trip::query();
        if ($from = $request->input('from')) {
            $tripsQuery->whereDate('created_at', '>=', $from);
        }
        if ($to = $request->input('to')) {
            $tripsQuery->whereDate('created_at', '<=', $to);
        }

        $totalRecaudado = (float) (clone $tripsQuery)
            ->whereIn('status', [Trip::STATUS_COMPLETADO, Trip::STATUS_RECOGIDO])
            ->sum('total_fare_cop');

        $comisionPlataforma = (float) (clone $tripsQuery)
            ->where('status', Trip::STATUS_COMPLETADO)
            ->sum('platform_commission_cop');

        $comisionesPendientes = (float) (clone $tripsQuery)
            ->where('commission_status', 'pendiente_debito')
            ->sum('platform_commission_cop');

        return response()->json([
            'success' => true,
            'summary' => [
                'total_collected_cop' => $totalRecaudado,
                'platform_commission_cop' => $comisionPlataforma,
                'pending_commission_cop' => $comisionesPendientes,
            ],
            'data' => $items,
            'meta' => [
                'current_page' => $events->currentPage(),
                'last_page' => $events->lastPage(),
                'per_page' => $events->perPage(),
                'total' => $events->total(),
            ],
        ]);
    }
}
