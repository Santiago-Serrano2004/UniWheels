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

    /*
    |--------------------------------------------------------------------------
    | Búsqueda de rutas (SIM-011)
    |--------------------------------------------------------------------------
    |
    | max_candidates: tope de rutas candidatas (las más cercanas al pasajero) que
    | se evalúan por búsqueda. ai_timeout: segundos por llamada a ai-route-service.
    | detour_cache_ttl: segundos que se cachea la evaluación de desvío.
    |
    */
    'match' => [
        'max_candidates' => (int) env('MATCH_MAX_CANDIDATES', 20),
        'ai_timeout' => 2,
        'detour_cache_ttl' => 60,
    ],

];
