@extends('emails.layout')

@section('title', $asunto)

@section('header_title', $asunto)
@section('header_subtitle', 'Viajes compartidos entre la comunidad universitaria')

@section('content')
    <div class="email-greeting">{{ $saludo }}</div>
    @foreach ($parrafos as $parrafo)
        <p class="email-description">{{ $parrafo }}</p>
    @endforeach
    <p class="email-description">
        Si tienes dudas, responde a este correo y te contestamos desde {{ config('landing.inbox') }}.
    </p>
@endsection
