<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperar Contraseña — UniWheels</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            margin: 0;
            padding: 0;
            line-height: 1.6;
        }
        .container {
            max-width: 540px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 24px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
        }
        .header {
            background: linear-gradient(135deg, #082f49 0%, #0284c7 100%);
            padding: 36px 30px;
            text-align: center;
            color: #ffffff;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
        }
        .header p {
            margin: 6px 0 0 0;
            font-size: 13px;
            color: #bae6fd;
        }
        .content {
            padding: 32px 30px;
        }
        .greeting {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 12px;
        }
        .code-card {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 18px;
            padding: 20px;
            text-align: center;
            margin: 24px 0;
        }
        .code-title {
            font-size: 11px;
            font-weight: 700;
            color: #0284c7;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }
        .code-value {
            font-family: 'Courier New', Courier, monospace;
            font-size: 32px;
            font-weight: 800;
            color: #0369a1;
            letter-spacing: 6px;
        }
        .security-note {
            background: #fffbeb;
            border: 1px solid #fef3c7;
            border-radius: 14px;
            padding: 14px;
            font-size: 11px;
            color: #92400e;
            margin-top: 20px;
        }
        .footer {
            background: #f8fafc;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #f1f5f9;
            font-size: 11px;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>UniWheels</h1>
            <p>Seguridad y Recuperación de Cuenta</p>
        </div>
        <div class="content">
            <div class="greeting">Hola, {{ $usuario->name }}</div>
            <p style="font-size: 13px; color: #475569; margin: 0 0 16px 0;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta institucional en UniWheels. Utiliza el siguiente código de verificación:
            </p>

            <div class="code-card">
                <div class="code-title">Código de Recuperación</div>
                <div class="code-value">{{ $codigoRecuperacion }}</div>
                <p style="font-size: 10px; color: #0284c7; margin: 8px 0 0 0;">
                    Este código expira en 15 minutos.
                </p>
            </div>

            <div class="security-note">
                <strong>Aviso de Seguridad:</strong> Si tú no solicitaste este código, te recomendamos revisar la seguridad de tu correo institucional. Nadie del equipo de UniWheels te solicitará este código.
            </div>
        </div>
        <div class="footer">
            © {{ date('Y') }} UniWheels — Plataforma de Movilidad Universitaria.<br>
            Protegido bajo la Ley Estatutaria 1581 de 2012 (Habeas Data).
        </div>
    </div>
</body>
</html>
