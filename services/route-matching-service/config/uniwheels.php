<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Aporte sugerido por cupo (docs/REGLAS_DE_NEGOCIO_Y_TARIFAS.md §1.2)
    |--------------------------------------------------------------------------
    |
    | aporte_sugerido = redondear_arriba_a_100(base + distancia_km × per_km)
    | El conductor puede indicar un aporte entre 0 y el sugerido.
    |
    */
    'contribution' => [
        'carro' => ['base' => (int) env('CONTRIBUTION_CAR_BASE', 2000), 'per_km' => (int) env('CONTRIBUTION_CAR_PER_KM', 400)],
        'moto' => ['base' => (int) env('CONTRIBUTION_MOTO_BASE', 1000), 'per_km' => (int) env('CONTRIBUTION_MOTO_PER_KM', 250)],
    ],

];
