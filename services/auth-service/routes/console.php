<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Conciliación contable diaria automática de recargas Wompi vs transacciones de billetera
Schedule::command('uniwheels:reconcile-wompi')->daily();
