<?php

namespace App\Services;

use App\Models\TripSosEvent;

class SosEventService
{
    /**
     * Marca el evento como atendido. La actualización es condicional (solo si aún no está
     * atendido) para que dos atenciones simultáneas no se sobrescriban; devuelve null si
     * el evento ya estaba atendido.
     */
    public function attend(TripSosEvent $event, ?string $notes, string $adminUserId): ?TripSosEvent
    {
        $actualizados = TripSosEvent::whereKey($event->getKey())
            ->whereNull('attended_at')
            ->update([
                'attended_at' => now(),
                'attended_by_user_id' => $adminUserId,
                'attention_notes' => $notes,
            ]);

        if ($actualizados === 0) {
            return null;
        }

        return $event->fresh(['trip']);
    }
}
