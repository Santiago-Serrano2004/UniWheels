<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RecuperacionClaveMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $usuario,
        public string $codigoRecuperacion
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'UniWheels: Código para restablecer tu contraseña',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.recuperar_clave',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
