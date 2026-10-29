<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Copia interna de un formulario de la landing para el buzón de UniWheels. Responder
 * contesta directamente a quien lo llenó.
 *
 * @param  array<string, string>  $campos
 */
class AvisoFormularioMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $asunto,
        public array $campos,
        public string $correoRemitente,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->asunto,
            replyTo: [new Address($this->correoRemitente)],
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.aviso_formulario');
    }
}
