<?php

namespace App\Services;

use App\Mail\AvisoFormularioMail;
use App\Mail\ConfirmacionFormularioMail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Envía la confirmación a quien llenó un formulario de la landing y la copia al buzón de
 * UniWheels. Un fallo de correo no debe tumbar la inscripción, que ya quedó guardada.
 */
class LandingMailer
{
    /**
     * @param  list<string>  $parrafos
     * @param  array<string, string>  $campos
     */
    public function enviar(
        string $correo,
        string $asuntoConfirmacion,
        string $saludo,
        array $parrafos,
        string $asuntoAviso,
        array $campos,
    ): void {
        try {
            Mail::to($correo)->send(new ConfirmacionFormularioMail($asuntoConfirmacion, $saludo, $parrafos));
        } catch (\Throwable $e) {
            Log::error('No se pudo enviar la confirmación de la landing: '.$e->getMessage());
        }

        try {
            Mail::to(config('landing.inbox'))->send(new AvisoFormularioMail($asuntoAviso, $campos, $correo));
        } catch (\Throwable $e) {
            Log::error('No se pudo enviar el aviso interno de la landing: '.$e->getMessage());
        }
    }
}
