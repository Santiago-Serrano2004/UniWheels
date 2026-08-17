@extends('emails.layout')

@section('title', 'Confirmación de Eliminación de Cuenta — UniWheels')

@section('header_badge')
    <div class="email-badge email-badge-slate">Cuenta Desactivada</div>
@endsection

@section('header_title', 'Confirmación de Eliminación')
@section('header_subtitle', 'UniWheels — Movilidad Universitaria')

@section('content')
    <div class="email-greeting">Hola, {{ $usuario->name }}</div>
    <p class="email-description">
        Lamentamos que te vayas. Te confirmamos que tu cuenta y credenciales de acceso asociadas al correo <strong>{{ $usuario->email }}</strong> han sido eliminadas y desactivadas exitosamente de nuestra plataforma.
    </p>

    <!-- MESSAGE CARD -->
    <div class="email-alert-card" style="text-align: center; padding: 22px 18px; margin: 20px 0;">
        <div style="font-size: 32px; margin-bottom: 8px;">👋</div>
        <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">¡Esperamos que vuelvas pronto!</div>
        <div style="font-size: 12px; color: #64748b; line-height: 1.5;">
            Las puertas de la comunidad universitaria UniWheels siempre estarán abiertas para ti cuando desees compartir rutas sostenibles y seguras.
        </div>
    </div>

    <!-- HABEAS DATA -->
    <div class="email-alert-card email-alert-success">
        <strong>Cumplimiento Habeas Data (Ley 1581 de 2012):</strong>
        Tus datos personales han sido anonimizados y desvinculados de sesiones activas. Si en el futuro deseas volver a utilizar UniWheels, podrás crear una nueva cuenta utilizando tu correo institucional.
    </div>

    <!-- CTA -->
    <div class="email-cta-container">
        <a href="http://localhost:5173" class="email-btn-secondary">
            Visitar UniWheels
        </a>
    </div>
@endsection
