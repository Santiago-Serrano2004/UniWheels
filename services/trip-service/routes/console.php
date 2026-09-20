<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// La tabla trip_tracking_points crece con cada reporte de posición GPS en vivo
// (~cada 5s por viaje activo) — sin esto crecería sin límite en producción.
Schedule::command('uniwheels:purge-tracking-points')->daily();
