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

        // A4: reset-password: 5/min por correo y 30/min por IP (el código de 6 dígitos
        // además se invalida al 5.º fallo, ver AuthController::resetPassword).
        RateLimiter::for('password-reset', function ($request) {
            return [
                Limit::perMinute(5)->by('reset-email:'.strtolower((string) $request->input('email'))),
                Limit::perMinute(30)->by('reset-ip:'.$request->ip()),
            ];
        });

        // A6: login 5/min por correo y 30/min por IP (una sede sale por una sola IP/NAT).
        RateLimiter::for('login', function ($request) {
            // El login acepta email completo o email_prefix + institution_id.
            $correo = $request->input('email');
            if (! is_string($correo)) {
                $prefijo = $request->input('email_prefix');
                $institucion = $request->input('institution_id');
                $correo = is_string($prefijo) ? $prefijo.'|'.(is_scalar($institucion) ? $institucion : '') : '';
            }
            $correo = strtolower($correo);
            $mensaje = ['success' => false, 'message' => 'Demasiados intentos. Espera un minuto.'];

            return [
                Limit::perMinute(5)->by('login-email:'.$correo)->response(fn () => response()->json($mensaje, 429)),
                Limit::perMinute(30)->by('login-ip:'.$request->ip())->response(fn () => response()->json($mensaje, 429)),
            ];
        });

        // Lista de espera pública: 5/min por IP y 3/día por correo.
        RateLimiter::for('waitlist', function ($request) {
            return [
                Limit::perMinute(5)->by('waitlist-ip:'.$request->ip()),
                Limit::perDay(3)->by('waitlist-email:'.strtolower((string) $request->input('email'))),
            ];
        });

        // Beta y contacto de universidades: 5/min por IP y 3/día por correo (cada uno envía correos).
        RateLimiter::for('landing-form', function ($request) {
            return [
                Limit::perMinute(5)->by('landing-ip:'.$request->ip()),
                Limit::perDay(3)->by('landing-email:'.$request->path().':'.strtolower((string) $request->input('email'))),
            ];
        });
    }
}
