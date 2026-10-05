import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { color, fuenteDisplay, fuenteTexto } from './tema';

// Pantallas de muestra de la app, dibujadas a 390 px de ancho lógico (iPhone).
// Se reemplazan por grabaciones reales cuando existan (ver src/clips.ts).
export const ANCHO_LOGICO = 390;

const aparece = (frame: number, desde: number, fps: number) =>
  spring({ frame: frame - desde, fps, config: { damping: 18, stiffness: 140 } });

const Barra: React.FC = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '16px 30px 0',
      fontFamily: fuenteTexto,
      fontSize: 14,
      fontWeight: 700,
      color: color.tinta,
    }}
  >
    <span>6:42</span>
    <span>100%</span>
  </div>
);

const Encabezado: React.FC<{ titulo: string; subtitulo?: string }> = ({ titulo, subtitulo }) => (
  <div style={{ padding: '26px 22px 12px' }}>
    <div style={{ fontFamily: fuenteDisplay, fontSize: 26, fontWeight: 800, color: color.tinta }}>{titulo}</div>
    {subtitulo && (
      <div style={{ fontFamily: fuenteTexto, fontSize: 14, color: color.cuerpo, marginTop: 4 }}>{subtitulo}</div>
    )}
  </div>
);

const Tarjeta: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      background: color.papel,
      border: `1.5px solid ${color.linea}`,
      borderRadius: 18,
      padding: '14px 16px',
      fontFamily: fuenteTexto,
      ...style,
    }}
  >
    {children}
  </div>
);

const Boton: React.FC<{ texto: string; fondo?: string; escala?: number }> = ({ texto, fondo = color.tinta, escala = 1 }) => (
  <div
    style={{
      background: fondo,
      color: '#fff',
      borderRadius: 16,
      padding: '16px 0',
      textAlign: 'center',
      fontFamily: fuenteTexto,
      fontWeight: 700,
      fontSize: 16,
      transform: `scale(${escala})`,
    }}
  >
    {texto}
  </div>
);

const RUTAS = [
  { nombre: 'Andrés R.', desde: 'Cabecera', hora: '6:50 a. m.', aporte: '$ 3.200', cupos: 2, vehiculo: 'Carro' },
  { nombre: 'Laura M.', desde: 'Cañaveral', hora: '7:05 a. m.', aporte: '$ 3.600', cupos: 3, vehiculo: 'Carro' },
  { nombre: 'Julián P.', desde: 'Provenza', hora: '7:15 a. m.', aporte: '$ 2.300', cupos: 1, vehiculo: 'Moto' },
];

export const PantallaBuscar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ width: ANCHO_LOGICO, height: '100%', background: color.niebla }}>
      <Barra />
      <Encabezado titulo="Rutas hacia tu campus" subtitulo="Mañana, 6:30 a 7:30 a. m." />
      <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Tarjeta style={{ display: 'flex', justifyContent: 'space-between', color: color.cuerpo, fontSize: 14 }}>
          <span>Desde Cabecera</span>
          <span style={{ color: color.lochmara700, fontWeight: 700 }}>Hacia el campus</span>
        </Tarjeta>
        {RUTAS.map((r, i) => {
          const p = aparece(frame, 10 + i * 8, fps);
          return (
            <Tarjeta
              key={r.nombre}
              style={{
                opacity: p,
                transform: `translateY(${(1 - p) * 30}px)`,
                borderColor: i === 0 ? color.lochmara500 : color.linea,
                background: i === 0 ? color.lochmara50 : color.papel,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: color.tinta, fontSize: 16 }}>
                <span>{r.nombre}</span>
                <span>{r.aporte}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: color.cuerpo, fontSize: 13, marginTop: 6 }}>
                <span>
                  {r.vehiculo} · desde {r.desde} · {r.hora}
                </span>
                <span>
                  {r.cupos} {r.cupos === 1 ? 'cupo' : 'cupos'}
                </span>
              </div>
            </Tarjeta>
          );
        })}
      </div>
    </div>
  );
};

export const PantallaReservar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulsa = interpolate(frame, [40, 46, 52], [1, 0.94, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const confirmado = aparece(frame, 54, fps);
  const trazo = interpolate(frame, [0, 40], [260, 0], { extrapolateRight: 'clamp' });
  return (
    <div style={{ width: ANCHO_LOGICO, height: '100%', background: color.niebla }}>
      <Barra />
      <Encabezado titulo="Viaje con Andrés" subtitulo="Carro · 2 cupos · 6:50 a. m." />
      <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Tarjeta style={{ padding: 0, overflow: 'hidden' }}>
          <svg width="100%" height="170" viewBox="0 0 350 170" style={{ display: 'block', background: color.lochmara50 }}>
            {[30, 80, 130].map((y) => (
              <line key={y} x1="0" y1={y} x2="350" y2={y} stroke={color.linea} strokeWidth="10" />
            ))}
            {[70, 180, 290].map((x) => (
              <line key={x} x1={x} y1="0" x2={x} y2="170" stroke={color.linea} strokeWidth="10" />
            ))}
            <path
              d="M 40 140 L 180 140 L 180 30 L 310 30"
              fill="none"
              stroke={color.lochmara600}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray="260"
              strokeDashoffset={trazo}
            />
            <circle cx="40" cy="140" r="10" fill={color.recogida} />
            <rect x="300" y="20" width="20" height="20" rx="5" fill={color.tinta} />
          </svg>
        </Tarjeta>
        <Tarjeta>
          <div style={{ fontSize: 13, color: color.cuerpo }}>Aporte al conductor</div>
          <div style={{ fontFamily: fuenteDisplay, fontSize: 30, fontWeight: 800, color: color.tinta }}>$ 3.200</div>
          <div style={{ fontSize: 13, color: color.cuerpo }}>En efectivo o Nequi, directo. UniWheels no cobra comisión.</div>
        </Tarjeta>
        {confirmado < 0.5 ? (
          <Boton texto="Reservar cupo" escala={pulsa} />
        ) : (
          <div
            style={{
              opacity: confirmado,
              background: '#ecfdf5',
              color: '#047857',
              borderRadius: 16,
              padding: '16px 0',
              textAlign: 'center',
              fontFamily: fuenteTexto,
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            Cupo reservado
          </div>
        )}
      </div>
    </div>
  );
};

export const PantallaPin: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const latido = 1 + 0.06 * Math.sin((frame / fps) * Math.PI * 2);
  return (
    <div style={{ width: ANCHO_LOGICO, height: '100%', background: color.niebla }}>
      <Barra />
      <Encabezado titulo="Tu PIN de abordaje" subtitulo="Díctaselo al conductor al subir" />
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 30 }}>
        {['4', '8', '2', '9'].map((d, i) => {
          const p = aparece(frame, 6 + i * 6, fps);
          return (
            <div
              key={i}
              style={{
                width: 62,
                height: 80,
                borderRadius: 18,
                background: color.tinta,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: fuenteDisplay,
                fontSize: 40,
                fontWeight: 800,
                transform: `scale(${p})`,
              }}
            >
              {d}
            </div>
          );
        })}
      </div>
      <div style={{ padding: '30px 18px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Tarjeta style={{ color: color.cuerpo, fontSize: 14 }}>Conductor verificado por Bienestar Universitario</Tarjeta>
      </div>
      <div style={{ position: 'absolute', bottom: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 96,
            background: color.peligro,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: fuenteDisplay,
            fontWeight: 800,
            fontSize: 24,
            transform: `scale(${latido})`,
            boxShadow: '0 0 0 14px rgba(239,68,68,0.15)',
          }}
        >
          SOS
        </div>
      </div>
    </div>
  );
};

export const PantallaPublicar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opciones = ['Sugerido', '75 %', '50 %', 'Gratis'];
  const elegido = frame < 45 ? 0 : 1;
  const montos = ['$ 5.200', '$ 3.900'];
  return (
    <div style={{ width: ANCHO_LOGICO, height: '100%', background: color.niebla }}>
      <Barra />
      <Encabezado titulo="Publicar ruta" subtitulo="Comparte los gastos de tu trayecto" />
      <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          ['Salgo desde', 'Cabecera'],
          ['Voy a', 'Tu campus'],
          ['Hora de salida', '6:50 a. m.'],
        ].map(([k, v], i) => {
          const p = aparece(frame, 4 + i * 5, fps);
          return (
            <Tarjeta key={k} style={{ opacity: p, padding: '10px 16px' }}>
              <div style={{ fontSize: 12, color: color.cuerpo }}>{k}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: color.tinta }}>{v}</div>
            </Tarjeta>
          );
        })}
        <Tarjeta>
          <div style={{ fontSize: 13, color: color.cuerpo }}>Aporte sugerido por cupo (máximo): $ 5.200 · 8 km</div>
          <div style={{ fontFamily: fuenteDisplay, fontSize: 30, fontWeight: 800, color: color.tinta, marginTop: 4 }}>
            {montos[elegido]}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {opciones.map((o, i) => (
              <div
                key={o}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '8px 0',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 700,
                  background: i === elegido ? color.lochmara600 : color.niebla,
                  color: i === elegido ? '#fff' : color.cuerpo,
                }}
              >
                {o}
              </div>
            ))}
          </div>
        </Tarjeta>
        <Boton texto="Publicar ruta" />
      </div>
    </div>
  );
};
