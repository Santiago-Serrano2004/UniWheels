<?php

namespace App\Mail;

use App\Models\Vehicle;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SolicitudVehiculoAdminMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Vehicle $vehiculo,
        public string $tokenAprobacion,
        public string $tokenRechazo
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[UniWheels Admin] Nueva Solicitud de Vehículo — {$this->vehiculo->plate_number}"
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.admin_solicitud_vehiculo');
    }

    public function attachments(): array
    {
        return [];
    }
}
