<?php

return [
    // Este servicio verifica tokens de usuario emitidos por auth-service y también
    // puede firmar tokens de servicio-a-servicio de corta duración (mismo secreto).
    'secret' => env('JWT_SECRET'),
    'algo' => 'HS256',
];
