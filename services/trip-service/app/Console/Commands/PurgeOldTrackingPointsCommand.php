<?php

namespace App\Console\Commands;

use App\Models\Trip;
use App\Models\TripTrackingPoint;
use Illuminate\Console\Command;

class PurgeOldTrackingPointsCommand extends Command
{
    protected $signature = 'uniwheels:purge-tracking-points {--days=7 : Antigüedad mínima en días desde que el viaje terminó}';

    protected $description = 'Borra puntos de telemetría GPS de viajes ya finalizados (completados o cancelados) con más de N días de antigüedad';

    public function handle(): int
    {
        $dias = (int) $this->option('days');

        $viajesFinalizados = [
            Trip::STATUS_COMPLETADO,
            Trip::STATUS_CANCELADO_CONDUCTOR,
            Trip::STATUS_CANCELADO_PASAJERO,
        ];

        $borrados = TripTrackingPoint::whereHas('trip', function ($query) use ($viajesFinalizados) {
            $query->whereIn('status', $viajesFinalizados);
        })
            ->where('recorded_at', '<', now()->subDays($dias))
            ->delete();

        $this->info("Puntos de telemetría GPS borrados: {$borrados} (viajes finalizados hace más de {$dias} días).");

        return self::SUCCESS;
    }
}
