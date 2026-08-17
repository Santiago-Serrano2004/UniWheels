<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VerificacionCorreoMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $correoDestinatario,
        public string $codigoVerificacion
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'UniWheels — Código de Verificación para tu Cuenta Institucional',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.verificacion_correo',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
