<?php

namespace App\Services;

use App\Models\TripCancellation;

class LateCancellationPolicy
{
    public function __construct(private AuthSuspensionClient $authClient) {}

    /**
     * Cuenta las cancelaciones tardías recientes del usuario y, si alcanzó el
     * umbral, le pide a auth-service la suspensión.
     *
     * @return array{late_cancellations_30d: int, suspended: bool, suspended_until: string|null}
     */
    public function evaluate(string $userId): array
    {
        $config = config('uniwheels.late_cancellations');

        $total = TripCancellation::where('cancelled_by_user_id', $userId)
            ->where('had_penalty', true)
            ->where('created_at', '>=', now()->subDays($config['window_days']))
            ->count();

        $resultado = null;

        if ($total >= $config['threshold']) {
            $resultado = $this->authClient->suspendForLateCancellations($userId, $total, $config['suspension_days']);
        }

        return [
            'late_cancellations_30d' => $total,
            'suspended' => (bool) ($resultado['suspended'] ?? false),
            'suspended_until' => $resultado['suspended_until'] ?? null,
        ];
    }
}
