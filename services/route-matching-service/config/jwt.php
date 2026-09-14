<?php

return [
    // Este servicio solo VERIFICA (nunca emite) tokens firmados por auth-service.
    'secret' => env('JWT_SECRET'),
    'algo' => 'HS256',
];
