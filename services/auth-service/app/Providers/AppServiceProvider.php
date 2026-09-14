<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Límite de intentos de PIN de verificación por correo (además del límite global por IP/ruta).
        RateLimiter::for('pin-attempt', function ($request) {
            return Limit::perMinutes(5, 5)->by(strtolower((string) $request->input('email')));
        });
    }
}
