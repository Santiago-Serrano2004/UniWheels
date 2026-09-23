<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AttendSosEventRequest;
use App\Http\Requests\GetAdminSosEventsRequest;
use App\Http\Resources\AdminSosEventResource;
use App\Models\TripSosEvent;
use App\Services\SosEventService;
use Illuminate\Http\JsonResponse;

class AdminSosEventController extends Controller
{
    public function __construct(
        private readonly SosEventService $sosEventService
    ) {}

    public function index(GetAdminSosEventsRequest $request): JsonResponse
    {
        $query = TripSosEvent::with('trip');

        if ($request->input('status') === 'pending') {
            $query->whereNull('attended_at');
        } elseif ($request->input('status') === 'attended') {
            $query->whereNotNull('attended_at');
        }

        $perPage = min((int) ($request->input('per_page') ?: 15), 50);
        $events = $query->orderByDesc('triggered_at')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => AdminSosEventResource::collection($events->items()),
            'meta' => [
                'current_page' => $events->currentPage(),
                'last_page' => $events->lastPage(),
                'per_page' => $events->perPage(),
                'total' => $events->total(),
            ],
        ]);
    }

    public function attend(AttendSosEventRequest $request, string $id): JsonResponse
    {
        $event = TripSosEvent::with('trip')->findOrFail($id);
        $adminUserId = (string) $request->attributes->get('user_id');

        $updatedEvent = $this->sosEventService->attend(
            $event,
            $request->input('notes'),
            $adminUserId
        );

        return response()->json([
            'success' => true,
            'message' => 'Alerta SOS atendida y documentada exitosamente.',
            'data' => new AdminSosEventResource($updatedEvent),
        ]);
    }
}
