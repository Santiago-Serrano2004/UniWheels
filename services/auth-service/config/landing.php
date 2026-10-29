<?php

return [
    // Buzón que recibe una copia de cada formulario de la landing. Las respuestas a los
    // correos de confirmación también llegan aquí (Reply-To).
    'inbox' => env('LANDING_INBOX', 'uniwheelscontact@gmail.com'),

    // Universidades de Bucaramanga y su área metropolitana. La misma lista vive en
    // landing/src/universidades.js: si cambias una, cambia la otra.
    'universidades' => [
        'Universidad Autónoma de Bucaramanga (UNAB)',
        'Universidad Industrial de Santander (UIS)',
        'Universidad Pontificia Bolivariana (UPB)',
        'Universidad Santo Tomás (USTA)',
        'Universidad de Santander (UDES)',
        'Unidades Tecnológicas de Santander (UTS)',
        'Universidad de Investigación y Desarrollo (UDI)',
        'Universidad Manuela Beltrán (UMB)',
        'Universidad Cooperativa de Colombia',
        'Universidad Antonio Nariño (UAN)',
        'Universidad Nacional Abierta y a Distancia (UNAD)',
        'Corporación Universitaria Remington',
        'Fundación Universitaria Comfenalco Santander (UNC)',
        'Escuela Superior de Administración Pública (ESAP)',
        'Otra',
    ],
];
