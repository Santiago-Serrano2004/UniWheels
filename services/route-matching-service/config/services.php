<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'tomtom' => [
        'key' => env('TOMTOM_API_KEY', 'test_tomtom_key'),
    ],

    'osrm' => [
        // Instancia local del contenedor OSRM (docker-compose) — nunca el router público
        // por defecto, para no filtrar coordenadas de usuarios a un tercero.
        'url' => env('OSRM_BACKEND_URL', 'http://127.0.0.1:5000').'/route/v1/driving',
    ],

    'ai_route' => [
        'url' => env('AI_ROUTE_SERVICE_URL', 'http://127.0.0.1:8006'),
    ],

    'auth_service' => [
        'url' => env('AUTH_SERVICE_URL', 'http://127.0.0.1:8001'),
    ],

    'vehicle_service' => [
        'url' => env('VEHICLE_SERVICE_URL', 'http://127.0.0.1:8002'),
    ],

];
