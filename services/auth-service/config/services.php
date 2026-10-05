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

    'sms' => [
        // 'log' (por defecto, sin costo ni cuenta externa) o 'twilio' en producción.
        'driver' => env('SMS_DRIVER', 'log'),
        'twilio_sid' => env('TWILIO_SID'),
        'twilio_token' => env('TWILIO_TOKEN'),
        'twilio_from' => env('TWILIO_FROM'),
    ],

    // Servicios que guardan datos personales y deben borrarlos al eliminar la cuenta (Ley 1581).
    'personal_data_erasure' => [
        'vehicle-service' => env('VEHICLE_SERVICE_URL', 'http://127.0.0.1:8002'),
        'route-matching-service' => env('ROUTE_MATCHING_SERVICE_URL', 'http://127.0.0.1:8003'),
        'trip-service' => env('TRIP_SERVICE_URL', 'http://127.0.0.1:8004'),
        'notification-service' => env('NOTIFICATION_SERVICE_URL', 'http://127.0.0.1:8005'),
    ],

];
