<?php

namespace App\Services;

use App\Models\TripSosEvent;

class SosEventService
{
    public function attend(TripSosEvent $event, ?string $notes, string $adminUserId): TripSosEvent
    {
        $event->update([
            'attended_at' => now(),
            'attended_by_user_id' => $adminUserId,
            'attention_notes' => $notes,
        ]);

        return $event->fresh(['trip']);
    }
}
