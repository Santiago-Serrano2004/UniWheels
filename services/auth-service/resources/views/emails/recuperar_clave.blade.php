@extends('emails.layout')

@section('title', 'Recuperar Contraseña — UniWheels')

@section('header_badge')
    <div class="email-badge email-badge-amber">Recuperación de Cuenta</div>
@endsection

@section('header_title', 'Código para Restablecer Contraseña')
@section('header_subtitle', 'Plataforma de Movilidad Universitaria')

@section('content')
    <div class="email-greeting">Hola, {{ $usuario->name }}</div>
    <p class="email-description">
        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta institucional en UniWheels. Utiliza el siguiente código PIN de verificación:
    </p>

    <!-- PIN DISPLAY -->
    <div class="email-pin-container email-pin-amber">
        <div class="email-pin-label" style="color: #b45309;">Código de Recuperación</div>
        <div class="email-pin-digits">
            <div class="email-pin-row">
                @foreach(str_split($codigoRecuperacion) as $index => $digit)
                    @if($index > 0)
                        <div class="email-pin-spacer"></div>
                    @endif
                    <div class="email-pin-box email-pin-box-amber">{{ $digit }}</div>
                @endforeach
            </div>
        </div>
        <div class="email-pin-timer" style="color: #b45309;">
            ⏳ Válido durante los próximos <strong>15 minutos</strong>
        </div>
    </div>

    <!-- SECURITY WARNING -->
    <div class="email-alert-card">
        <strong>Aviso de Seguridad:</strong> Si tú no realizaste esta solicitud, puedes ignorar este mensaje de forma segura. Tu contraseña actual no cambiará a menos que ingreses este código en la aplicación.
    </div>
@endsection
