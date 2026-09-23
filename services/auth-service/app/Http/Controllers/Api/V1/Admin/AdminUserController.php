<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\GetAdminUsersRequest;
use App\Http\Requests\LookupUsersRequest;
use App\Http\Requests\SuspendUserRequest;
use App\Http\Resources\AdminUserDetailResource;
use App\Http\Resources\AdminUserListResource;
use App\Models\User;
use App\Services\UserSuspensionService;
use Illuminate\Http\JsonResponse;

class AdminUserController extends Controller
{
    public function __construct(
        private readonly UserSuspensionService $suspensionService
    ) {}

    public function index(GetAdminUsersRequest $request): JsonResponse
    {
        $query = User::with('roles');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('student_code', 'like', "%{$search}%");
            });
        }

        if ($role = $request->input('role')) {
            $query->whereHas('roles', function ($q) use ($role) {
                $q->where('name', $role);
            });
        }

        if ($request->has('active') && $request->input('active') !== null && $request->input('active') !== '') {
            $isActive = filter_var($request->input('active'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($isActive !== null) {
                $query->where('is_active', $isActive);
            }
        }

        $perPage = min((int) ($request->input('per_page') ?: 15), 50);
        $users = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => AdminUserListResource::collection($users->items()),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $user = User::with(['institution', 'campus', 'reputationStats', 'wallet', 'suspensionLogs.admin'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new AdminUserDetailResource($user),
        ]);
    }

    public function lookup(LookupUsersRequest $request): JsonResponse
    {
        $ids = $request->validated('ids');
        $users = User::whereIn('id', $ids)->get(['id', 'name', 'email']);

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    public function updateSuspension(SuspendUserRequest $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $adminUserId = (string) $request->attributes->get('user_id');

        $validated = $request->validated();
        $updatedUser = $this->suspensionService->setSuspension(
            $user,
            (bool) $validated['suspended'],
            $validated['reason'] ?? null,
            $adminUserId
        );

        return response()->json([
            'success' => true,
            'message' => $validated['suspended']
                ? 'Usuario suspendido exitosamente.'
                : 'Usuario reactivado exitosamente.',
            'data' => [
                'id' => $updatedUser->id,
                'name' => $updatedUser->name,
                'email' => $updatedUser->email,
                'is_active' => $updatedUser->is_active,
            ],
        ]);
    }
}
