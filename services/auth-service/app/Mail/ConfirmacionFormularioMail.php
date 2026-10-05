<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Respuesta automática a quien llena un formulario de la landing. Si responde, el correo
 * llega al buzón de UniWheels (Reply-To).
 *
 * @param  list<string>  $parrafos
 */
class ConfirmacionFormularioMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $asunto,
        public string $saludo,
        public array $parrafos,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->asunto,
            replyTo: [new Address(config('landing.inbox'), 'UniWheels')],
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.confirmacion_formulario');
    }
}
