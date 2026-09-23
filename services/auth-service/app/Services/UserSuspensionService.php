<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserSuspensionLog;
use Illuminate\Support\Facades\Redis;
use Illuminate\Validation\ValidationException;

class UserSuspensionService
{
    public function setSuspension(User $targetUser, bool $suspended, ?string $reason, string $adminUserId): User
    {
        if ((string) $targetUser->id === $adminUserId) {
            throw ValidationException::withMessages([
                'user' => ['No puedes suspender tu propia cuenta.'],
            ]);
        }

        if ($targetUser->hasRole('administrador')) {
            throw ValidationException::withMessages([
                'user' => ['No se puede suspender a un administrador.'],
            ]);
        }

        $targetUser->is_active = ! $suspended;
        $targetUser->save();

        UserSuspensionLog::create([
            'user_id' => $targetUser->id,
            'admin_user_id' => $adminUserId,
            'action' => $suspended ? 'suspended' : 'reactivated',
            'reason' => $suspended ? $reason : ($reason ?: 'Reactivación de cuenta'),
            'created_at' => now(),
        ]);

        if ($suspended) {
            Redis::set("uniwheels:suspended_user:{$targetUser->id}", '1');
        } else {
            Redis::del("uniwheels:suspended_user:{$targetUser->id}");
        }

        return $targetUser;
    }
}
