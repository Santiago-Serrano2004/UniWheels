@extends('emails.layout')

@section('title', $asunto)

@section('header_title', $asunto)
@section('header_subtitle', 'Formulario recibido en uniwheels.org')

@section('content')
    <table style="width: 100%; border-collapse: collapse;">
        @foreach ($campos as $etiqueta => $valor)
            <tr>
                <td style="padding: 8px 12px 8px 0; vertical-align: top; font-weight: 700; white-space: nowrap;">{{ $etiqueta }}</td>
                <td style="padding: 8px 0; vertical-align: top; white-space: pre-line;">{{ $valor }}</td>
            </tr>
        @endforeach
    </table>
    <p class="email-description" style="margin-top: 16px;">Responde a este correo para contestarle directamente.</p>
@endsection
