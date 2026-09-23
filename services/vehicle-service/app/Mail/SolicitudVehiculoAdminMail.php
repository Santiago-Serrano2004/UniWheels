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

    public string $panelUrl;

    public function __construct(
        public Vehicle $vehiculo,
        public array $datosDocumentos = []
    ) {
        $baseUrl = rtrim((string) (config('services.admin_panel.url') ?: env('ADMIN_PANEL_URL', 'https://admin.uniwheels.org')), '/');
        $this->panelUrl = "{$baseUrl}/vehiculos/{$this->vehiculo->id}";
    }

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
