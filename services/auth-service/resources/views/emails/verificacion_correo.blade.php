@extends('emails.layout')

@section('title', 'Verifica tu Correo Institucional — UniWheels')

@section('header_badge')
    <div class="email-badge email-badge-blue">Verificación de Identidad</div>
@endsection

@section('header_title', 'Código de Activación de Cuenta')
@section('header_subtitle', 'Comunidad Universitaria de Movilidad Inteligente')

@section('content')
    <div class="email-greeting">¡Hola!</div>
    <p class="email-description">
        Estás a un paso de unirte a la red universitaria de carpooling seguro. Ingresa el siguiente código de 6 dígitos en la aplicación para verificar tu correo <strong>{{ $correoDestinatario }}</strong>:
    </p>

    <!-- PIN DISPLAY -->
    <div class="email-pin-container email-pin-blue">
        <div class="email-pin-label" style="color: #0284c7;">Tu Código de Verificación</div>
        <div class="email-pin-digits">
            <div class="email-pin-row">
                @foreach(str_split($codigoVerificacion) as $index => $digit)
                    @if($index > 0)
                        <div class="email-pin-spacer"></div>
                    @endif
                    <div class="email-pin-box email-pin-box-blue">{{ $digit }}</div>
                @endforeach
            </div>
        </div>
        <div class="email-pin-timer" style="color: #0369a1;">
            ⏳ Válido durante los próximos <strong>15 minutos</strong>
        </div>
    </div>

    <!-- SECURITY NOTICE -->
    <div class="email-alert-card">
        <strong>Seguridad de tu cuenta:</strong> Nunca compartas este código con nadie. El equipo de UniWheels jamás te solicitará este código por correo, mensaje ni llamada.
    </div>
@endsection
