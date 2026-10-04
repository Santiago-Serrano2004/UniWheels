<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserSuspensionLog;
use Illuminate\Support\Facades\Log;
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

        // La suspensión manual no tiene fecha de fin; al reactivar también se limpia.
        $targetUser->is_active = ! $suspended;
        $targetUser->suspended_until = null;
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

    /**
     * Suspensión automática por acumular cancelaciones tardías. Idempotente: si el
     * usuario ya está suspendido no duplica la bitácora ni cambia la fecha de fin.
     *
     * @return array{suspended: bool, suspended_until?: string|null}
     */
    public function suspendForLateCancellations(User $user, int $count, int $days): array
    {
        if ($user->hasRole('administrador')) {
            return ['suspended' => false];
        }

        if (! $user->is_active) {
            return [
                'suspended' => true,
                'suspended_until' => $user->suspended_until?->toISOString(),
            ];
        }

        $hasta = now()->addDays($days);

        $user->is_active = false;
        $user->suspended_until = $hasta;
        $user->save();

        UserSuspensionLog::create([
            'user_id' => $user->id,
            'admin_user_id' => null,
            'action' => 'auto_suspended',
            'reason' => "Suspensión automática: {$count} cancelaciones tardías en 30 días",
            'created_at' => now(),
        ]);

        // La llave expira sola: los servicios que solo miran Redis quedan liberados al vencer el plazo.
        Redis::setex("uniwheels:suspended_user:{$user->id}", max(1, (int) now()->diffInSeconds($hasta)), '1');

        return [
            'suspended' => true,
            'suspended_until' => $hasta->toISOString(),
        ];
    }

    /**
     * Levanta de forma perezosa una suspensión automática ya vencida. Las cuentas
     * suspendidas por un administrador o eliminadas no tienen fecha y nunca se reactivan aquí.
     */
    public function liftIfExpired(User $user): bool
    {
        if ($user->is_active || ! $user->suspended_until || ! $user->suspended_until->isPast()) {
            return false;
        }

        $user->is_active = true;
        $user->suspended_until = null;
        $user->save();

        UserSuspensionLog::create([
            'user_id' => $user->id,
            'admin_user_id' => null,
            'action' => 'auto_reactivated',
            'reason' => 'Fin del plazo de suspensión automática',
            'created_at' => now(),
        ]);

        try {
            Redis::del("uniwheels:suspended_user:{$user->id}");
        } catch (\Throwable $e) {
            Log::warning('No se pudo borrar la llave de suspensión en Redis: '.$e->getMessage(), [
                'user_id' => $user->id,
            ]);
        }

        return true;
    }

    public function suspensionMessage(User $user): string
    {
        $fecha = $user->suspended_until->copy()->setTimezone('America/Bogota')->format('d/m/Y');

        return "Tu cuenta está suspendida hasta el {$fecha}.";
    }
}
