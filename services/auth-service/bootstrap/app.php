<?php

use App\Http\Middleware\JwtAuthenticate;
use App\Http\Middleware\JwtServiceOnly;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Sentry\Laravel\Integration as SentryIntegration;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'jwt.auth' => JwtAuthenticate::class,
            'jwt.service' => JwtServiceOnly::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // No-op si SENTRY_LARAVEL_DSN está vacío (default) — solo reporta excepciones
        // no capturadas cuando el DSN real está configurado en .env.
        SentryIntegration::handles($exceptions);
    })->create();
