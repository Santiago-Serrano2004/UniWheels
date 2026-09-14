<?php

return [

    /*
    |--------------------------------------------------------------------------
    | JWT compartido entre microservicios UniWheels
    |--------------------------------------------------------------------------
    |
    | Este servicio solo VERIFICA (nunca emite) tokens firmados por auth-service.
    | El secreto debe ser idéntico al configurado allí.
    |
    */

    'secret' => env('JWT_SECRET'),

    'algo' => 'HS256',

];
