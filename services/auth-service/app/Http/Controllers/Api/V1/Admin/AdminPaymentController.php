<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\GetAdminTopupsRequest;
use App\Http\Resources\AdminTopupResource;
use App\Models\WalletTransaction;
use App\Models\WompiWebhookEvent;
use Illuminate\Http\JsonResponse;

class AdminPaymentController extends Controller
{
    public function topups(GetAdminTopupsRequest $request): JsonResponse
    {
        $query = WompiWebhookEvent::where('reference', 'like', 'WR-%');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($from = $request->input('from')) {
            $query->whereDate('created_at', '>=', $from);
        }

        if ($to = $request->input('to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        $perPage = min((int) ($request->input('per_page') ?: 15), 50);
        $events = $query->orderByDesc('created_at')->paginate($perPage);

        // Preload associated transactions by reference
        $references = collect($events->items())->pluck('reference')->filter()->unique();
        $transactionsByRef = WalletTransaction::whereIn('reference_id', $references)->get()->keyBy('reference_id');

        $items = collect($events->items())->map(function ($event) use ($transactionsByRef) {
            $resource = new AdminTopupResource($event);
            if ($event->reference && isset($transactionsByRef[$event->reference])) {
                $resource->additional(['transaction' => $transactionsByRef[$event->reference]]);
            }

            return $resource;
        });

        return response()->json([
            'success' => true,
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
