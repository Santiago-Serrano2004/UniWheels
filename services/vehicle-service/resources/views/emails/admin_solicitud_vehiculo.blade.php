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
        El usuario con ID <strong>{{ $vehiculo->user_id }}</strong> ha registrado un nuevo vehículo para operar en la red universitaria. Revisa la información técnica y los soportes fotográficos adjuntos:
    </p>

    <!-- FICHA TÉCNICA GRID -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px; margin-bottom: 18px;">
        <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 6px 0; color: #64748b; width: 40%;">Tipo:</td>
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
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 6px 0; color: #64748b;">Póliza SOAT:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">
                    No. {{ $datosDocumentos['soat_number'] ?? 'N/A' }} 
                    <span style="color: #059669;">(Vence: {{ $datosDocumentos['soat_expires_at'] ?? 'N/A' }})</span>
                </td>
            </tr>
            @if(!empty($datosDocumentos['rtm_number']))
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 6px 0; color: #64748b;">Certificado RTM:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">
                    No. {{ $datosDocumentos['rtm_number'] }} 
                    <span style="color: #d97706;">(Vence: {{ $datosDocumentos['rtm_expires_at'] ?? 'N/A' }})</span>
                </td>
            </tr>
            @endif
            @if(!empty($datosDocumentos['driver_license_number']))
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 6px 0; color: #64748b;">Licencia de Conducción:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">
                    No. {{ $datosDocumentos['driver_license_number'] }} (Cat. {{ $datosDocumentos['driver_license_category'] ?? 'B1' }}) 
                    <span style="color: #0284c7;">(Vence: {{ $datosDocumentos['driver_license_expires_at'] ?? 'N/A' }})</span>
                </td>
            </tr>
            @endif
            <tr>
                <td style="padding: 6px 0; color: #64748b;">Fecha de Registro:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">{{ $vehiculo->created_at->format('d/m/Y H:i') }}</td>
            </tr>
        </table>
    </div>

    <!-- SECCIÓN DE FOTOS Y SOPORTES -->
    @if(!empty($datosDocumentos['soat_photo']) || !empty($datosDocumentos['rtm_photo']) || !empty($datosDocumentos['driver_license_photo']))
    <div style="margin-bottom: 22px;">
        <p style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
            Fotografías y Soportes Adjuntos:
        </p>
        <div style="display: grid; gap: 14px;">
            @if(!empty($datosDocumentos['soat_photo']))
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 10px;">
                <p style="font-size: 11px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Soporte SOAT:</p>
                <img src="{{ $datosDocumentos['soat_photo'] }}" alt="Foto SOAT" style="width: 100%; max-height: 260px; object-fit: contain; border-radius: 8px; border: 1px solid #f1f5f9;" />
            </div>
            @endif

            @if(!empty($datosDocumentos['rtm_photo']))
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 10px;">
                <p style="font-size: 11px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Soporte Revisión Técnico-Mecánica (RTM):</p>
                <img src="{{ $datosDocumentos['rtm_photo'] }}" alt="Foto RTM" style="width: 100%; max-height: 260px; object-fit: contain; border-radius: 8px; border: 1px solid #f1f5f9;" />
            </div>
            @endif

            @if(!empty($datosDocumentos['driver_license_photo']))
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 10px;">
                <p style="font-size: 11px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Foto Frontal Licencia de Conducción:</p>
                <img src="{{ $datosDocumentos['driver_license_photo'] }}" alt="Foto Licencia" style="width: 100%; max-height: 260px; object-fit: contain; border-radius: 8px; border: 1px solid #f1f5f9;" />
            </div>
            @endif
        </div>
    </div>
    @endif

    <!-- BOTONES DE ACCIÓN ADMIN -->
    <div style="text-align: center; margin: 26px 0 10px;">
        <p style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px;">
          Revisión Administrativa:
        </p>
        <div style="display: flex; gap: 10px; justify-content: center;">
            <a href="{{ $panelUrl }}"
               style="display: inline-block; background: #0284c7; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);">
                Revisar en el panel
            </a>
        </div>
    </div>

    <!-- AVISO DE SEGURIDAD -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px 14px; margin-top: 20px; font-size: 11px; color: #64748b;">
        Para garantizar la seguridad de la plataforma, la verificación y aprobación de vehículos se realiza exclusivamente a través del panel administrativo con validación de cada documento legal.
    </div>
@endsection
