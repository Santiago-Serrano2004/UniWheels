<?php

return [

    /*
    |--------------------------------------------------------------------------
    | JWT compartido entre microservicios UniWheels
    |--------------------------------------------------------------------------
    |
    | Secreto simétrico (HS256) usado por auth-service para firmar y por los
    | demás microservicios para verificar, sin llamadas de red entre ellos.
    | El mismo valor debe existir en el .env de cada servicio backend.
    |
    */

    'secret' => env('JWT_SECRET'),

    'algo' => 'HS256',

    // Tiempo de vida del token en segundos (por defecto 4 horas).
    'ttl' => (int) env('JWT_TTL', 14400),

    'issuer' => 'uniwheels-auth-service',

];
