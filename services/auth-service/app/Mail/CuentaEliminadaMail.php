<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CuentaEliminadaMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $usuario
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'UniWheels — Confirmación de eliminación de cuenta. ¡Esperamos que vuelvas pronto!',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.cuenta_eliminada',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
