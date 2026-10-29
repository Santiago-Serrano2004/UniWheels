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
import { Telefono } from './Telefono';
import { color, FPS, fuenteDisplay, fuenteTexto } from './tema';

// Anuncio con las grabaciones reales del 2026-10-05 (public/clips/real_N.mp4, ya en SDR y 30 fps).
// `desde` es el segundo del video fuente donde arranca la toma; `vel` acelera o ralentiza.
type Rol = 'conductor' | 'pasajero';
type Toma = { rol: Rol; archivo: string; desde: number; vel: number };
type Escena = { seg: number; paso: string; titulo: string; texto: string; tomas: Toma[] };

const ESCENAS: Escena[] = [
  {
    seg: 8.5,
    paso: '1',
    titulo: 'Andrés publica su ruta',
    texto: 'Elige de dónde sale, a qué campus va y cuánto pide. La app le sugiere un aporte justo según los kilómetros.',
    tomas: [{ rol: 'conductor', archivo: 'real_1.mp4', desde: 22, vel: 1.8 }],
  },
  {
    seg: 10.5,
    paso: '2',
    titulo: 'Laura la encuentra y reserva',
    texto: 'Ve la ruta real del conductor en el mapa y el aporte antes de confirmar.',
    tomas: [{ rol: 'pasajero', archivo: 'real_2.mp4', desde: 19, vel: 1.6 }],
  },
  {
    seg: 7,
    paso: '3',
    titulo: 'Sube con un PIN',
    texto: 'Laura lo dicta, Andrés lo confirma. Nadie se sube al carro equivocado.',
    tomas: [
      { rol: 'pasajero', archivo: 'real_4.mp4', desde: 0, vel: 0.25 },
      { rol: 'conductor', archivo: 'real_3.mp4', desde: 3, vel: 1 },
    ],
  },
  {
    seg: 5.5,
    paso: '4',
    titulo: 'Rumbo al campus',
    texto: 'Indicaciones paso a paso dentro de la app, o en Waze y Google Maps.',
    tomas: [{ rol: 'conductor', archivo: 'real_3.mp4', desde: 13.5, vel: 1.1 }],
  },
  {
    seg: 7,
    paso: '5',
    titulo: 'Laura lo sigue en vivo',
    texto: 'Ve el carro, la ruta y su PIN. El botón SOS siempre está a la mano.',
    tomas: [{ rol: 'pasajero', archivo: 'real_4.mp4', desde: 0.2, vel: 1 }],
  },
  {
    seg: 3.5,
    paso: '6',
    titulo: 'Llegan y listo',
    texto: 'El aporte se paga directo al conductor. UniWheels no cobra comisión.',
    tomas: [{ rol: 'conductor', archivo: 'real_5.mp4', desde: 0, vel: 0.75 }],
  },
  {
    seg: 6.5,
    paso: '7',
    titulo: 'Y se califican',
    texto: 'Una comunidad universitaria que se cuida entre sí.',
    tomas: [{ rol: 'pasajero', archivo: 'real_6.mp4', desde: 0.5, vel: 1.1 }],
  },
];

const GANCHO = 3.5 * FPS;
const CIERRE = 4.5 * FPS;
const inicios: number[] = [];
let cursor = GANCHO;
for (const e of ESCENAS) {
  inicios.push(cursor);
  cursor += Math.round(e.seg * FPS);
}
export const DURACION_REAL = cursor + CIERRE;

const Fondo: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
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
          strokeDashoffset={-(frame / DURACION_REAL) * paso * 40}
          opacity={0.5}
        />
      </svg>
    </AbsoluteFill>
  );
};

const EtiquetaRol: React.FC<{ rol: Rol; tam: number }> = ({ rol, tam }) => (
  <div
    style={{
      alignSelf: 'center',
      background: rol === 'conductor' ? color.tinta : color.lochmara600,
      color: '#fff',
      fontFamily: fuenteTexto,
      fontWeight: 700,
      fontSize: tam,
      padding: `${tam * 0.35}px ${tam * 0.9}px`,
      borderRadius: 999,
    }}
  >
    {rol === 'conductor' ? 'Andrés · conductor' : 'Laura · pasajera'}
  </div>
);

const EscenaReal: React.FC<{ escena: Escena; vertical: boolean }> = ({ escena, vertical }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const dur = Math.round(escena.seg * fps);
  const entra = spring({ frame, fps, config: { damping: 18, stiffness: 110 } });
  const sale = interpolate(frame, [dur - 8, dur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const visible = Math.min(entra, sale);

  const dos = escena.tomas.length === 2;
  const anchoTel = vertical ? width * (dos ? 0.41 : 0.5) : height * (dos ? 0.36 : 0.4);
  const tamEtiqueta = vertical ? width * 0.028 : height * 0.024;
  const base = vertical ? width * 0.066 : width * 0.036;

  const caja: React.CSSProperties = vertical
    ? { position: 'absolute', left: width * 0.07, right: width * 0.07, top: height * 0.05 }
    : { position: 'absolute', left: width * 0.06, width: width * 0.4, top: height * 0.28 };

  const zonaTelefonos: React.CSSProperties = vertical
    ? { position: 'absolute', left: 0, right: 0, top: height * 0.27, display: 'flex', justifyContent: 'center', gap: width * 0.04 }
    : { position: 'absolute', left: width * 0.48, right: width * 0.03, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: width * 0.03 };

  return (
    <AbsoluteFill>
      <div style={{ ...caja, opacity: visible, transform: `translateY(${(1 - entra) * 40}px)` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: base * 0.3 }}>
          <span style={{ fontFamily: fuenteDisplay, fontWeight: 800, fontSize: base * 1.15, color: color.lochmara600, lineHeight: 1 }}>
            {escena.paso}
          </span>
          <span style={{ fontFamily: fuenteDisplay, fontWeight: 800, fontSize: base, lineHeight: 1.05, letterSpacing: '-0.02em', color: color.tinta }}>
            {escena.titulo}
          </span>
        </div>
        <div style={{ fontFamily: fuenteTexto, fontSize: base * 0.46, color: color.cuerpo, marginTop: base * 0.28, lineHeight: 1.35 }}>
          {escena.texto}
        </div>
      </div>
      <div style={zonaTelefonos}>
        {escena.tomas.map((t, i) => (
          <div
            key={`${t.archivo}-${i}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: tamEtiqueta * 0.8,
              opacity: visible,
              transform: `translateY(${(1 - spring({ frame: frame - i * 6, fps, config: { damping: 18 } })) * height * 0.25}px) rotate(${dos ? (i === 0 ? -3 : 3) : -1.5}deg)`,
            }}
          >
            <EtiquetaRol rol={t.rol} tam={tamEtiqueta} />
            <Telefono ancho={anchoTel}>
              <OffthreadVideo
                src={staticFile(`clips/${t.archivo}`)}
                trimBefore={Math.round(t.desde * fps)}
                playbackRate={t.vel}
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Telefono>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Sello fijo durante las escenas: deja claro que no es una maqueta.
const SelloReal: React.FC<{ vertical: boolean }> = ({ vertical }) => {
  const { width, height } = useVideoConfig();
  const tam = vertical ? width * 0.026 : height * 0.022;
  return (
    <div
      style={{
        position: 'absolute',
        right: vertical ? width * 0.05 : width * 0.03,
        bottom: vertical ? height * 0.03 : height * 0.05,
        display: 'flex',
        alignItems: 'center',
        gap: tam * 0.5,
        background: color.papel,
        border: `2px solid ${color.linea}`,
        borderRadius: 999,
        padding: `${tam * 0.4}px ${tam * 0.9}px`,
        fontFamily: fuenteTexto,
        fontWeight: 600,
        fontSize: tam,
        color: color.tinta,
      }}
    >
      <span style={{ width: tam * 0.55, height: tam * 0.55, borderRadius: 999, background: color.peligro }} />
      Grabado en la app real, en Bucaramanga
    </div>
  );
};

export const AnuncioReal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const vertical = height > width;

  const tamGancho = vertical ? width * 0.088 : width * 0.05;
  const linea1 = spring({ frame, fps, config: { damping: 16 } });
  const linea2 = spring({ frame: frame - 22, fps, config: { damping: 16 } });
  const salidaGancho = interpolate(frame, [GANCHO - 10, GANCHO], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const inicioCierre = DURACION_REAL - CIERRE;
  const cierre = spring({ frame: frame - inicioCierre, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill>
      <Fondo />

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', padding: width * 0.08, opacity: salidaGancho, gap: height * 0.02 }}>
        <div
          style={{
            fontFamily: fuenteDisplay,
            fontWeight: 800,
            fontSize: tamGancho,
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            color: color.tinta,
            textAlign: 'center',
            opacity: linea1,
            transform: `translateY(${(1 - linea1) * 30}px)`,
          }}
        >
          Mismo campus, misma hora, el mismo trancón.
        </div>
        <div
          style={{
            fontFamily: fuenteDisplay,
            fontWeight: 700,
            fontSize: tamGancho * 0.62,
            color: color.lochmara600,
            textAlign: 'center',
            opacity: linea2,
            transform: `translateY(${(1 - linea2) * 30}px)`,
          }}
        >
          Así se viaja juntos con UniWheels.
        </div>
      </AbsoluteFill>

      {ESCENAS.map((e, i) => (
        <Sequence key={e.titulo} from={inicios[i]} durationInFrames={Math.round(e.seg * FPS)}>
          <EscenaReal escena={e} vertical={vertical} />
        </Sequence>
      ))}

      <Sequence from={GANCHO} durationInFrames={inicioCierre - GANCHO}>
        <SelloReal vertical={vertical} />
      </Sequence>

      <Sequence from={inicioCierre}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: height * 0.025, padding: width * 0.08 }}>
          <Img src={staticFile('emblem.svg')} style={{ width: Math.min(width, height) * 0.2, transform: `scale(${cierre})` }} />
          <div style={{ fontFamily: fuenteDisplay, fontWeight: 800, fontSize: vertical ? width * 0.11 : width * 0.06, color: color.tinta, letterSpacing: '-0.03em', opacity: cierre }}>
            UniWheels
          </div>
          <div style={{ fontFamily: fuenteTexto, fontSize: vertical ? width * 0.042 : width * 0.022, color: color.cuerpo, opacity: cierre, textAlign: 'center' }}>
            Solo estudiantes verificados de tu universidad. Sin comisiones.
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
