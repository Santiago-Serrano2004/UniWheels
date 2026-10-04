<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cancelaciones tardías (docs/REGLAS_DE_NEGOCIO_Y_TARIFAS.md §3)
    |--------------------------------------------------------------------------
    |
    | Al acumular `threshold` cancelaciones tardías dentro de `window_days`, se le
    | pide a auth-service suspender la cuenta por `suspension_days`.
    |
    */
    'late_cancellations' => [
        'threshold' => (int) env('LATE_CANCEL_THRESHOLD', 3),
        'window_days' => (int) env('LATE_CANCEL_WINDOW_DAYS', 30),
        'suspension_days' => (int) env('LATE_CANCEL_SUSPENSION_DAYS', 30),
    ],

];
