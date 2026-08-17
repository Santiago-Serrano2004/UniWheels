@extends('emails.layout')

@section('title', "Solicitud de Vehículo — {$vehiculo->plate_number}")

@section('header_badge')
    <div class="email-badge email-badge-amber">Auditoría Pendiente</div>
@endsection

@section('header_title', 'Nueva Solicitud de Vehículo')
@section('header_subtitle', 'Verificación de Documentos y Ficha Técnica')

@section('content')
    <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">
        Ficha Técnica: <span style="font-family: 'JetBrains Mono', monospace; color: #0284c7;">{{ $vehiculo->plate_number }}</span>
    </div>
    <p style="font-size: 13px; color: #475569; margin-bottom: 20px; line-height: 1.6;">
        El usuario con ID <strong>{{ $vehiculo->user_id }}</strong> ha registrado un nuevo vehículo para operar en la red universitaria. Revisa la información técnica para aprobar o rechazar la solicitud:
    </p>

    <!-- FICHA TÉCNICA GRID -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px; margin-bottom: 22px;">
        <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 6px 0; color: #64748b;">Tipo:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #0f172a; text-transform: capitalize;">{{ $vehiculo->vehicle_type }}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 6px 0; color: #64748b;">Marca / Modelo:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">{{ $vehiculo->brand }} {{ $vehiculo->model_line }} ({{ $vehiculo->year }})</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 6px 0; color: #64748b;">Color / Cupos:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">{{ $vehiculo->color }} • {{ $vehiculo->available_seats }} cupo(s)</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 6px 0; color: #64748b;">Propulsión:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #0f172a; text-transform: capitalize;">{{ $vehiculo->propulsion_type }}</td>
            </tr>
            <tr>
                <td style="padding: 6px 0; color: #64748b;">Fecha Registro:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">{{ $vehiculo->created_at->format('d/m/Y H:i') }}</td>
            </tr>
        </table>
    </div>

    <!-- BOTONES DE ACCIÓN ADMIN -->
    <div style="text-align: center; margin: 26px 0 10px;">
        <p style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px;">
          Acción Rápida de Administrador:
        </p>
        <div style="display: flex; gap: 10px; justify-content: center;">
            <a href="{{ config('app.url') }}/api/v1/vehicles/{{ $vehiculo->id }}/status?action=approve&token={{ $tokenAprobacion }}"
               style="display: inline-block; background: #059669; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);">
                ✓ Aprobar Vehículo
            </a>
            <a href="{{ config('app.url') }}/api/v1/vehicles/{{ $vehiculo->id }}/status?action=reject&token={{ $tokenRechazo }}"
               style="display: inline-block; background: #dc2626; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3); margin-left: 8px;">
                ✗ Rechazar
            </a>
        </div>
    </div>

    <!-- AVISO DE SEGURIDAD -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px 14px; margin-top: 20px; font-size: 11px; color: #64748b;">
        🔒 Los enlaces de aprobación contienen firmas criptográficas HMAC-SHA256 válidas exclusivamente para esta solicitud.
    </div>
@endsection
