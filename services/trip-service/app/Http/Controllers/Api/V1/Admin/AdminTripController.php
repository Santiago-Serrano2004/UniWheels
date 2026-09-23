<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\GetAdminTripsRequest;
use App\Http\Resources\AdminTripResource;
use App\Models\Trip;
use Illuminate\Http\JsonResponse;

class AdminTripController extends Controller
{
    public function index(GetAdminTripsRequest $request): JsonResponse
    {
        $query = Trip::query();

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
        $trips = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => AdminTripResource::collection($trips->items()),
            'meta' => [
                'current_page' => $trips->currentPage(),
                'last_page' => $trips->lastPage(),
                'per_page' => $trips->perPage(),
                'total' => $trips->total(),
            ],
        ]);
    }
}
