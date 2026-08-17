@extends('emails.layout')

@section('title', '¡Bienvenido a UniWheels!')

@section('header_badge')
    <div class="email-badge email-badge-emerald">✓ Cuenta Verificada</div>
@endsection

@section('header_title', '¡Bienvenido a la Comunidad!')
@section('header_subtitle', 'Carpooling Inteligente y Seguro')

@section('content')
    <div class="email-greeting">¡Hola, {{ $usuario->name }}! 🎉</div>
    <p class="email-description">
        Tu registro ha sido completado exitosamente y tu correo institucional ha sido verificado. Ya puedes acceder y compartir rutas seguras con tu comunidad universitaria.
    </p>

    <!-- FEATURES -->
    <div class="email-feature-card">
        <div class="email-feature-text">
            <h4>Comunidad 100% Universitaria</h4>
            <p>Solo estudiantes, docentes y colaboradores con correo institucional verificado.</p>
        </div>
    </div>

    <div class="email-feature-card">
        <div class="email-feature-text">
            <h4>Rutas Inteligentes con IA</h4>
            <p>Cálculo de desvíos óptimos y tarifas sugeridas en tiempo real.</p>
        </div>
    </div>

    <div class="email-feature-card">
        <div class="email-feature-text">
            <h4>Movilidad Sostenible y Segura</h4>
            <p>Ahorra dinero en tus traslados diarios y reduce tu huella de carbono.</p>
        </div>
    </div>

    <!-- CTA BUTTON -->
    <div class="email-cta-container">
        <a href="http://localhost:5173" class="email-btn-primary">
            Comenzar a Usar UniWheels →
        </a>
    </div>
@endsection
