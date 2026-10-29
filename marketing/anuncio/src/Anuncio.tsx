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
import { CLIPS, type ClaveClip } from './clips';
import {
  ANCHO_LOGICO,
  PantallaBuscar,
  PantallaCalificar,
  PantallaCompletar,
  PantallaEnViaje,
  PantallaNavegacion,
  PantallaPin,
  PantallaPublicar,
  PantallaReservaRecibida,
  PantallaReservar,
  PantallaVerificarPin,
  PantallaViajeActivo,
} from './Pantallas';
import { Telefono } from './Telefono';
import { color, FPS, fuenteDisplay, fuenteTexto } from './tema';

type Rol = 'conductor' | 'pasajero';
type Vista = { rol: Rol; clip: ClaveClip; Pantalla: React.FC };
type Escena = { seg: number; titulo: string; texto: string; vistas: Vista[] };

// Flujo completo, tal como lo vive cada usuario. Duraciones en segundos.
const ESCENAS: Escena[] = [
  {
    seg: 7,
    titulo: 'El conductor publica su ruta',
    texto: 'La app sugiere el aporte por cupo según la distancia. Siempre menos que una app de transporte.',
    vistas: [{ rol: 'conductor', clip: 'conductor_publicar', Pantalla: PantallaPublicar }],
  },
  {
    seg: 6,
    titulo: 'El pasajero encuentra rutas cerca',
    texto: 'Solo gente de su universidad, verificada con correo institucional.',
    vistas: [{ rol: 'pasajero', clip: 'pasajero_buscar', Pantalla: PantallaBuscar }],
  },
  {
    seg: 6,
    titulo: 'Reserva su cupo',
    texto: 'Ve el aporte antes de confirmar. Se paga directo al conductor.',
    vistas: [{ rol: 'pasajero', clip: 'pasajero_reservar', Pantalla: PantallaReservar }],
  },
  {
    seg: 6,
    titulo: 'Los dos quedan conectados',
    texto: 'El conductor recibe la reserva y el pasajero ve su viaje confirmado.',
    vistas: [
      { rol: 'conductor', clip: 'conductor_reserva_recibida', Pantalla: PantallaReservaRecibida },
      { rol: 'pasajero', clip: 'pasajero_viaje_activo', Pantalla: PantallaViajeActivo },
    ],
  },
  {
    seg: 6,
    titulo: 'Camino al punto de encuentro',
    texto: 'La ruta y el punto de recogida, en el mapa.',
    vistas: [{ rol: 'conductor', clip: 'conductor_navegacion', Pantalla: PantallaNavegacion }],
  },
  {
    seg: 7,
    titulo: 'Sube con un PIN',
    texto: 'El pasajero lo dicta y el conductor lo confirma. Así nadie sube al carro equivocado.',
    vistas: [
      { rol: 'pasajero', clip: 'pasajero_pin', Pantalla: PantallaPin },
      { rol: 'conductor', clip: 'conductor_pin', Pantalla: PantallaVerificarPin },
    ],
  },
  {
    seg: 5,
    titulo: 'Viaja tranquilo',
    texto: 'Viaje en vivo y botón SOS siempre a la mano.',
    vistas: [{ rol: 'pasajero', clip: 'pasajero_en_viaje', Pantalla: PantallaEnViaje }],
  },
  {
    seg: 6,
    titulo: 'Llegan al campus',
    texto: 'El pasajero paga el aporte directo, en efectivo o Nequi. UniWheels no cobra comisión.',
    vistas: [{ rol: 'conductor', clip: 'conductor_completar', Pantalla: PantallaCompletar }],
  },
  {
    seg: 4,
    titulo: 'Y se califican',
    texto: 'Una comunidad que se cuida.',
    vistas: [{ rol: 'pasajero', clip: 'pasajero_calificar', Pantalla: PantallaCalificar }],
  },
];

const GANCHO = 3 * FPS;
const CIERRE = 4 * FPS;
const inicios: number[] = [];
let cursor = GANCHO;
for (const e of ESCENAS) {
  inicios.push(cursor);
  cursor += e.seg * FPS;
}
export const DURACION = cursor + CIERRE;

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
          strokeDashoffset={-(frame / DURACION) * paso * 40}
          opacity={0.5}
        />
      </svg>
    </AbsoluteFill>
  );
};

const PantallaEnTelefono: React.FC<{ vista: Vista; anchoPantalla: number }> = ({ vista, anchoPantalla }) => {
  const archivo = CLIPS[vista.clip];
  if (archivo) {
    return <OffthreadVideo src={staticFile(`clips/${archivo}`)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  }
  const escala = anchoPantalla / ANCHO_LOGICO;
  const { Pantalla } = vista;
  return (
    <div style={{ width: ANCHO_LOGICO, height: `${100 / escala}%`, transform: `scale(${escala})`, transformOrigin: 'top left' }}>
      <Pantalla />
    </div>
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
    {rol === 'conductor' ? 'Conductor' : 'Pasajero'}
  </div>
);

const EscenaVista: React.FC<{ escena: Escena; vertical: boolean }> = ({ escena, vertical }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const dur = escena.seg * fps;
  const entra = spring({ frame, fps, config: { damping: 18, stiffness: 110 } });
  const sale = interpolate(frame, [dur - 10, dur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const visible = Math.min(entra, sale);

  const dos = escena.vistas.length === 2;
  const anchoTel = vertical ? width * (dos ? 0.4 : 0.48) : height * (dos ? 0.36 : 0.4);
  const anchoPantalla = anchoTel - anchoTel * 0.035 * 2;
  const tamEtiqueta = vertical ? width * 0.03 : height * 0.026;
  const base = vertical ? width * 0.068 : width * 0.038;

  const caja: React.CSSProperties = vertical
    ? { position: 'absolute', left: width * 0.07, right: width * 0.07, top: height * 0.055 }
    : { position: 'absolute', left: width * 0.06, width: width * 0.4, top: height * 0.3 };

  const zonaTelefonos: React.CSSProperties = vertical
    ? { position: 'absolute', left: 0, right: 0, top: height * 0.29, display: 'flex', justifyContent: 'center', gap: width * 0.05 }
    : { position: 'absolute', left: width * 0.48, right: width * 0.03, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: width * 0.03 };

  return (
    <AbsoluteFill>
      <div style={{ ...caja, opacity: visible, transform: `translateY(${(1 - entra) * 40}px)` }}>
        <div style={{ fontFamily: fuenteDisplay, fontWeight: 800, fontSize: base, lineHeight: 1.05, letterSpacing: '-0.02em', color: color.tinta }}>
          {escena.titulo}
        </div>
        <div style={{ fontFamily: fuenteTexto, fontSize: base * 0.48, color: color.cuerpo, marginTop: base * 0.28, lineHeight: 1.35 }}>
          {escena.texto}
        </div>
      </div>
      <div style={zonaTelefonos}>
        {escena.vistas.map((v, i) => (
          <div
            key={v.clip}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: tamEtiqueta * 0.8,
              opacity: visible,
              transform: `translateY(${(1 - spring({ frame: frame - i * 6, fps, config: { damping: 18 } })) * height * 0.25}px) rotate(${dos ? (i === 0 ? -3 : 3) : -2}deg)`,
            }}
          >
            <EtiquetaRol rol={v.rol} tam={tamEtiqueta} />
            <Telefono ancho={anchoTel}>
              <PantallaEnTelefono vista={v} anchoPantalla={anchoPantalla} />
            </Telefono>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const Anuncio: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const vertical = height > width;

  const gancho = interpolate(frame, [0, 12, GANCHO - 12, GANCHO], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const tamGancho = vertical ? width * 0.09 : width * 0.05;
  const inicioCierre = DURACION - CIERRE;
  const cierre = spring({ frame: frame - inicioCierre, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill>
      <Fondo />

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
            transform: `scale(${interpolate(frame, [0, GANCHO], [0.96, 1.04])})`,
          }}
        >
          ¿Cansado de esperar el bus para ir a la universidad?
        </div>
      </AbsoluteFill>

      {ESCENAS.map((e, i) => (
        <Sequence key={e.titulo} from={inicios[i]} durationInFrames={e.seg * FPS}>
          <EscenaVista escena={e} vertical={vertical} />
        </Sequence>
      ))}

      <Sequence from={inicioCierre}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: height * 0.025 }}>
          <Img src={staticFile('emblem.svg')} style={{ width: Math.min(width, height) * 0.2, transform: `scale(${cierre})` }} />
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
          <div style={{ fontFamily: fuenteTexto, fontSize: vertical ? width * 0.042 : width * 0.022, color: color.cuerpo, opacity: cierre, textAlign: 'center' }}>
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
