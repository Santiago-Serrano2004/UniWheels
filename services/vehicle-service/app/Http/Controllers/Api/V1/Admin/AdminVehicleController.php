<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\GetAdminVehiclesRequest;
use App\Http\Resources\AdminVehicleResource;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;

class AdminVehicleController extends Controller
{
    public function index(GetAdminVehiclesRequest $request): JsonResponse
    {
        $query = Vehicle::with('documents');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('plate_number', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%")
                    ->orWhere('model_line', 'like', "%{$search}%");
            });
        }

        $perPage = min((int) ($request->input('per_page') ?: 15), 50);
        $vehicles = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => AdminVehicleResource::collection($vehicles->items()),
            'meta' => [
                'current_page' => $vehicles->currentPage(),
                'last_page' => $vehicles->lastPage(),
                'per_page' => $vehicles->perPage(),
                'total' => $vehicles->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $vehicle = Vehicle::with('documents')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new AdminVehicleResource($vehicle),
        ]);
    }
}
