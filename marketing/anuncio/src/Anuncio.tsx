import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { CLIPS } from './clips';
import { ANCHO_LOGICO, PantallaBuscar, PantallaPin, PantallaPublicar, PantallaReservar } from './Pantallas';
import { Telefono } from './Telefono';
import { color, fuenteDisplay, fuenteTexto } from './tema';

// Línea de tiempo en frames (30 fps, 25 s = 750 frames).
const ESCENAS = [
  { desde: 90, dur: 150, clip: 'buscar', Pantalla: PantallaBuscar, titulo: 'Rutas con gente de tu universidad', texto: 'Solo cuentas verificadas con correo institucional.' },
  { desde: 240, dur: 150, clip: 'reservar', Pantalla: PantallaReservar, titulo: 'Mucho más barato que una app de transporte', texto: 'Aporte directo al conductor, sin comisiones.' },
  { desde: 390, dur: 150, clip: 'pin', Pantalla: PantallaPin, titulo: 'Viaja tranquilo', texto: 'Conductores revisados por Bienestar, PIN de abordaje y botón SOS.' },
  { desde: 540, dur: 120, clip: 'publicar', Pantalla: PantallaPublicar, titulo: '¿Tienes carro o moto?', texto: 'Publica tu ruta y comparte los gastos.' },
] as const;

export const DURACION = 750;

const Fondo: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const avance = interpolate(frame, [0, DURACION], [0, 1]);
  const paso = Math.min(width, height) / 6;
  return (
    <AbsoluteFill style={{ background: color.niebla }}>
      <svg width={width} height={height} style={{ position: 'absolute', opacity: 0.55 }}>
        {Array.from({ length: Math.ceil(width / paso) + 1 }).map((_, i) => (
          <line key={`v${i}`} x1={i * paso} y1={0} x2={i * paso} y2={height} stroke={color.linea} strokeWidth={paso * 0.12} />
        ))}
        {Array.from({ length: Math.ceil(height / paso) + 1 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * paso} x2={width} y2={i * paso} stroke={color.linea} strokeWidth={paso * 0.12} />
        ))}
        <path
          d={`M ${-paso} ${height * 0.82} H ${width * 0.35} V ${height * 0.35} H ${width + paso}`}
          fill="none"
          stroke={color.lochmara500}
          strokeWidth={paso * 0.06}
          strokeLinecap="round"
          strokeDasharray={`${paso * 0.25} ${paso * 0.25}`}
          strokeDashoffset={-avance * paso * 20}
          opacity={0.5}
        />
      </svg>
    </AbsoluteFill>
  );
};

const PantallaEnTelefono: React.FC<{ clip: string | null; Pantalla: React.FC; anchoPantalla: number }> = ({
  clip,
  Pantalla,
  anchoPantalla,
}) => {
  if (clip) {
    return (
      <OffthreadVideo
        src={staticFile(`clips/${clip}`)}
        muted
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    );
  }
  const escala = anchoPantalla / ANCHO_LOGICO;
  return (
    <div style={{ width: ANCHO_LOGICO, height: `${100 / escala}%`, transform: `scale(${escala})`, transformOrigin: 'top left' }}>
      <Pantalla />
    </div>
  );
};

const Titular: React.FC<{ titulo: string; texto: string; dur: number; vertical: boolean }> = ({ titulo, texto, dur, vertical }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const entra = spring({ frame, fps, config: { damping: 20 } });
  const sale = interpolate(frame, [dur - 10, dur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const base = vertical ? width * 0.072 : width * 0.04;
  return (
    <div style={{ opacity: Math.min(entra, sale), transform: `translateY(${(1 - entra) * 40}px)` }}>
      <div
        style={{
          fontFamily: fuenteDisplay,
          fontWeight: 800,
          fontSize: base,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          color: color.tinta,
        }}
      >
        {titulo}
      </div>
      <div style={{ fontFamily: fuenteTexto, fontSize: base * 0.5, color: color.cuerpo, marginTop: base * 0.3, lineHeight: 1.35 }}>
        {texto}
      </div>
    </div>
  );
};

export const Anuncio: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const vertical = height > width;

  const anchoTel = vertical ? width * 0.52 : height * 0.4;
  const borde = anchoTel * 0.035;
  const anchoPantalla = anchoTel - borde * 2;

  // El teléfono entra al final del gancho y sale antes del cierre.
  const entra = spring({ frame: frame - 70, fps, config: { damping: 16, stiffness: 90 } });
  const sale = spring({ frame: frame - 650, fps, config: { damping: 18 } });
  const desplazamiento = (1 - entra) * height * 0.9 + sale * height * 0.9;
  const giro = interpolate(frame, [70, 660], [-6, 4]);

  const posTelefono: React.CSSProperties = vertical
    ? { left: (width - anchoTel) / 2, top: height * 0.3 }
    : { left: width * 0.6, top: (height - anchoTel * (19.5 / 9)) / 2 };

  const caja: React.CSSProperties = vertical
    ? { position: 'absolute', left: width * 0.08, right: width * 0.08, top: height * 0.07 }
    : { position: 'absolute', left: width * 0.07, width: width * 0.45, top: height * 0.32 };

  // Gancho (0-3 s)
  const gancho = interpolate(frame, [0, 12, 78, 90], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const tamGancho = vertical ? width * 0.09 : width * 0.05;

  // Cierre (22-25 s)
  const cierre = spring({ frame: frame - 662, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill>
      <Fondo />

      {/* Gancho */}
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', padding: width * 0.08, opacity: gancho }}>
        <div
          style={{
            fontFamily: fuenteDisplay,
            fontWeight: 800,
            fontSize: tamGancho,
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            color: color.tinta,
            textAlign: 'center',
            transform: `scale(${interpolate(frame, [0, 90], [0.96, 1.04])})`,
          }}
        >
          ¿Cansado de esperar el bus para ir a la universidad?
        </div>
      </AbsoluteFill>

      {/* Titulares por escena */}
      {ESCENAS.map((e) => (
        <Sequence key={e.titulo} from={e.desde} durationInFrames={e.dur} layout="none">
          <div style={caja}>
            <Titular titulo={e.titulo} texto={e.texto} dur={e.dur} vertical={vertical} />
          </div>
        </Sequence>
      ))}

      {/* Teléfono con las pantallas */}
      <div
        style={{
          position: 'absolute',
          ...posTelefono,
          transform: `translateY(${desplazamiento}px) rotate(${giro}deg)`,
        }}
      >
        <Telefono ancho={anchoTel}>
          {ESCENAS.map((e, i) => (
            <Sequence key={e.clip} from={i === 0 ? 70 : e.desde} durationInFrames={e.dur + (i === 0 ? 20 : 0) + 10}>
              <AbsoluteFill
                style={{
                  opacity: interpolate(frame - (i === 0 ? 70 : e.desde), [0, 8], [i === 0 ? 1 : 0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  }),
                }}
              >
                <PantallaEnTelefono clip={CLIPS[e.clip]} Pantalla={e.Pantalla} anchoPantalla={anchoPantalla} />
              </AbsoluteFill>
            </Sequence>
          ))}
        </Telefono>
      </div>

      {/* Cierre */}
      <Sequence from={660}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: height * 0.025 }}>
          <Img
            src={staticFile('emblem.svg')}
            style={{ width: Math.min(width, height) * 0.2, transform: `scale(${cierre})` }}
          />
          <div
            style={{
              fontFamily: fuenteDisplay,
              fontWeight: 800,
              fontSize: vertical ? width * 0.11 : width * 0.06,
              color: color.tinta,
              letterSpacing: '-0.03em',
              opacity: cierre,
            }}
          >
            UniWheels
          </div>
          <div
            style={{
              fontFamily: fuenteTexto,
              fontSize: vertical ? width * 0.042 : width * 0.022,
              color: color.cuerpo,
              opacity: cierre,
              textAlign: 'center',
            }}
          >
            Viaja con tu comunidad universitaria
          </div>
          <div
            style={{
              marginTop: height * 0.02,
              background: color.tinta,
              color: '#fff',
              fontFamily: fuenteTexto,
              fontWeight: 700,
              fontSize: vertical ? width * 0.045 : width * 0.024,
              padding: vertical ? `${width * 0.03}px ${width * 0.07}px` : `${width * 0.015}px ${width * 0.035}px`,
              borderRadius: 999,
              opacity: cierre,
              transform: `translateY(${(1 - cierre) * 30}px)`,
            }}
          >
            Inscríbete en uniwheels.org
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
