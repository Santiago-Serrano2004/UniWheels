<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuspendUserRequest;
use App\Models\User;
use App\Services\UserSuspensionService;
use Illuminate\Http\JsonResponse;

class AdminUserController extends Controller
{
    public function __construct(
        private readonly UserSuspensionService $suspensionService
    ) {}

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
