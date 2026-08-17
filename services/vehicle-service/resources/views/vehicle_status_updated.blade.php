<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Estado de Vehículo Actualizado — UniWheels</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 24px;
            -webkit-font-smoothing: antialiased;
        }

        .card {
            max-width: 480px;
            width: 100%;
            background: #ffffff;
            border-radius: 28px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
            text-align: center;
            overflow: hidden;
        }

        .header {
            padding: 36px 24px 20px;
            background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%);
        }

        .icon-circle {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            margin: 0 auto 16px;
        }
        .icon-circle.approved {
            background: #ecfdf5;
            border: 2px solid #a7f3d0;
            color: #059669;
        }
        .icon-circle.rejected {
            background: #fef2f2;
            border: 2px solid #fecaca;
            color: #dc2626;
        }

        .title {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.5px;
            margin-bottom: 6px;
        }
        .subtitle {
            font-size: 13px;
            color: #64748b;
        }

        .body-content {
            padding: 20px 28px 32px;
        }

        .vehicle-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 18px;
            padding: 16px;
            margin: 16px 0 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .vehicle-plate {
            font-family: 'JetBrains Mono', monospace;
            font-size: 18px;
            font-weight: 800;
            color: #0284c7;
            letter-spacing: 2px;
        }
        .vehicle-desc {
            font-size: 12px;
            font-weight: 600;
            color: #475569;
            text-align: right;
        }

        .status-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 100px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 20px;
        }
        .status-badge.approved {
            background: #d1fae5;
            color: #065f46;
            border: 1px solid #a7f3d0;
        }
        .status-badge.rejected {
            background: #fee2e2;
            color: #991b1b;
            border: 1px solid #fecaca;
        }

        .hint {
            font-size: 12px;
            color: #94a3b8;
            line-height: 1.5;
        }

        /* DARK MODE */
        @media (prefers-color-scheme: dark) {
            body { background-color: #090d16 !important; color: #f1f5f9 !important; }
            .card { background: #0f172a !important; border-color: #1e293b !important; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6) !important; }
            .header { background: linear-gradient(180deg, #082f49 0%, #0f172a 100%) !important; }
            .title { color: #f8fafc !important; }
            .subtitle { color: #94a3b8 !important; }
            .vehicle-box { background: #1e293b !important; border-color: #334155 !important; }
            .vehicle-plate { color: #38bdf8 !important; }
            .vehicle-desc { color: #cbd5e1 !important; }
            .icon-circle.approved { background: #064e3b !important; border-color: #059669 !important; }
            .icon-circle.rejected { background: #7f1d1d !important; border-color: #dc2626 !important; }
            .status-badge.approved { background: #064e3b !important; color: #a7f3d0 !important; border-color: #059669 !important; }
            .status-badge.rejected { background: #7f1d1d !important; color: #fecaca !important; border-color: #dc2626 !important; }
            .hint { color: #64748b !important; }
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <div class="icon-circle {{ $estado === 'aprobado' ? 'approved' : 'rejected' }}">
                {{ $estado === 'aprobado' ? '✓' : '✕' }}
            </div>
            <h1 class="title">Solicitud Procesada</h1>
            <p class="subtitle">{{ $mensaje }}</p>
        </div>
        <div class="body-content">
            <div class="status-badge {{ $estado === 'aprobado' ? 'approved' : 'rejected' }}">
                Estado: {{ ucfirst($estado) }}
            </div>

            <div class="vehicle-box">
                <div class="vehicle-plate">{{ strtoupper($vehiculo->plate_number) }}</div>
                <div class="vehicle-desc">{{ $vehiculo->brand }} {{ $vehiculo->model_line }} ({{ $vehiculo->year }})</div>
            </div>

            <p class="hint">
                Esta acción ha sido registrada en el sistema de UniWheels.<br>
                El conductor ya puede ver el estado actualizado de su vehículo. Puedes cerrar esta ventana.
            </p>
        </div>
    </div>
</body>
</html>
