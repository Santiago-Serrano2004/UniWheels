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

        // SIM-023: códigos por correo (send-verification-code, forgot-password): 5/min por correo
        // y 60/min por IP. Una sede universitaria sale a internet por una sola IP (NAT), así que el
        // límite por IP solo frena abusos masivos y el estricto es por destinatario.
        RateLimiter::for('verification-code', function ($request) {
            return [
                Limit::perMinute(5)->by('email:'.strtolower((string) $request->input('email'))),
                Limit::perMinute(60)->by('ip:'.$request->ip()),
            ];
        });
    }
}
