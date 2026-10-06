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

// ---------- Pantallas adicionales del flujo completo ----------

const Mapa: React.FC<{ alto: number; progreso: number }> = ({ alto, progreso }) => {
  const largo = 520;
  const x = interpolate(progreso, [0, 0.45, 1], [40, 190, 190]);
  const y = interpolate(progreso, [0, 0.45, 1], [alto - 40, alto - 40, 40]);
  return (
    <svg width="100%" height={alto} viewBox={`0 0 350 ${alto}`} style={{ display: 'block', background: color.lochmara50 }}>
      {[0.2, 0.45, 0.7, 0.92].map((f) => (
        <line key={f} x1="0" y1={alto * f} x2="350" y2={alto * f} stroke={color.linea} strokeWidth="12" />
      ))}
      {[60, 190, 300].map((xx) => (
        <line key={xx} x1={xx} y1="0" x2={xx} y2={alto} stroke={color.linea} strokeWidth="12" />
      ))}
      <path
        d={`M 40 ${alto - 40} L 190 ${alto - 40} L 190 40 L 300 40`}
        fill="none"
        stroke={color.lochmara600}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={largo}
        strokeDashoffset={0}
      />
      <circle cx="190" cy={alto * 0.45} r="11" fill={color.recogida} />
      <rect x="290" y="30" width="20" height="20" rx="5" fill={color.tinta} />
      <g transform={`translate(${x} ${y})`}>
        <circle r="15" fill={color.lochmara600} opacity="0.25" />
        <circle r="9" fill={color.lochmara600} stroke="#fff" strokeWidth="3" />
      </g>
    </svg>
  );
};

const Pantalla: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ width: ANCHO_LOGICO, height: '100%', background: color.niebla, position: 'relative' }}>
    <Barra />
    {children}
  </div>
);

const Fila: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginTop: 6 }}>
    <span style={{ color: color.cuerpo }}>{k}</span>
    <span style={{ color: color.tinta, fontWeight: 700 }}>{v}</span>
  </div>
);

export const PantallaReservaRecibida: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aviso = aparece(frame, 12, fps);
  return (
    <Pantalla>
      <Encabezado titulo="Tu ruta de hoy" subtitulo="Cabecera hacia tu campus · 6:50 a. m." />
      <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            opacity: aviso,
            transform: `translateY(${(1 - aviso) * -30}px)`,
            background: color.tinta,
            color: '#fff',
            borderRadius: 18,
            padding: '14px 16px',
            fontFamily: fuenteTexto,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15 }}>Nueva reserva</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>Laura M. reservó 1 cupo en tu ruta</div>
        </div>
        <Tarjeta>
          <Fila k="Pasajeros" v="1 de 3" />
          <Fila k="Aporte por cupo" v="$ 3.200" />
          <Fila k="Punto de recogida" v="Calle 48 con Cra. 33" />
        </Tarjeta>
      </div>
    </Pantalla>
  );
};

export const PantallaViajeActivo: React.FC = () => (
  <Pantalla>
    <Encabezado titulo="Tu viaje" subtitulo="Sale a las 6:50 a. m." />
    <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Tarjeta>
        <div style={{ fontWeight: 700, color: color.tinta, fontSize: 17 }}>Andrés R.</div>
        <div style={{ color: color.cuerpo, fontSize: 13, marginTop: 4 }}>Mazda 2 gris · placa ABC 123</div>
        <Fila k="Punto de encuentro" v="Calle 48 con Cra. 33" />
        <Fila k="Aporte" v="$ 3.200" />
      </Tarjeta>
      <div
        style={{
          background: '#ecfdf5',
          color: '#047857',
          borderRadius: 16,
          padding: '14px 0',
          textAlign: 'center',
          fontFamily: fuenteTexto,
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        Cupo confirmado
      </div>
    </div>
  </Pantalla>
);

export const PantallaNavegacion: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = interpolate(frame, [0, durationInFrames], [0, 0.45], { extrapolateRight: 'clamp' });
  return (
    <Pantalla>
      <Encabezado titulo="Recoger a Laura" subtitulo="Llegas al punto en 3 min" />
      <div style={{ padding: '0 18px' }}>
        <Tarjeta style={{ padding: 0, overflow: 'hidden' }}>
          <Mapa alto={420} progreso={p} />
        </Tarjeta>
      </div>
    </Pantalla>
  );
};

export const PantallaVerificarPin: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const digitos = ['4', '8', '2', '9'];
  const escritos = Math.min(4, Math.max(0, Math.floor((frame - 10) / 8)));
  const ok = aparece(frame, 50, fps);
  return (
    <Pantalla>
      <Encabezado titulo="Confirma el PIN" subtitulo="Pídeselo a Laura al subir" />
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
        {digitos.map((d, i) => (
          <div
            key={i}
            style={{
              width: 62,
              height: 80,
              borderRadius: 18,
              border: `2px solid ${i < escritos ? color.lochmara600 : color.linea}`,
              background: color.papel,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: fuenteDisplay,
              fontSize: 40,
              fontWeight: 800,
              color: color.tinta,
            }}
          >
            {i < escritos ? d : ''}
          </div>
        ))}
      </div>
      <div style={{ padding: '30px 18px 0', opacity: ok, transform: `scale(${0.9 + ok * 0.1})` }}>
        <div
          style={{
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
          PIN correcto. Viaje iniciado
        </div>
      </div>
    </Pantalla>
  );
};

export const PantallaEnViaje: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const p = interpolate(frame, [0, durationInFrames], [0.45, 1], { extrapolateRight: 'clamp' });
  const latido = 1 + 0.06 * Math.sin((frame / fps) * Math.PI * 2);
  return (
    <Pantalla>
      <Encabezado titulo="En camino a tu campus" subtitulo="Llegas en 14 min" />
      <div style={{ padding: '0 18px' }}>
        <Tarjeta style={{ padding: 0, overflow: 'hidden' }}>
          <Mapa alto={360} progreso={p} />
        </Tarjeta>
      </div>
      <div style={{ position: 'absolute', bottom: 60, right: 26 }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 80,
            background: color.peligro,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: fuenteDisplay,
            fontWeight: 800,
            fontSize: 20,
            transform: `scale(${latido})`,
            boxShadow: '0 0 0 12px rgba(239,68,68,0.15)',
          }}
        >
          SOS
        </div>
      </div>
    </Pantalla>
  );
};

export const PantallaCompletar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulsa = interpolate(frame, [70, 76, 82], [1, 0.94, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const hecho = aparece(frame, 84, fps);
  return (
    <Pantalla>
      <Encabezado titulo="Llegaste al campus" subtitulo="Recibe el aporte de tus pasajeros" />
      <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Tarjeta>
          <div style={{ fontSize: 13, color: color.cuerpo }}>Laura M. te paga directo</div>
          <div style={{ fontFamily: fuenteDisplay, fontSize: 32, fontWeight: 800, color: color.tinta }}>$ 3.200</div>
          <div style={{ fontSize: 13, color: color.cuerpo }}>En efectivo o Nequi. UniWheels no cobra comisión.</div>
        </Tarjeta>
        {hecho < 0.5 ? (
          <Boton texto="Completar viaje" escala={pulsa} />
        ) : (
          <div
            style={{
              opacity: hecho,
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
            Viaje completado
          </div>
        )}
      </div>
    </Pantalla>
  );
};

export const PantallaCalificar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Pantalla>
      <Encabezado titulo="¿Cómo te fue con Andrés?" subtitulo="Tu calificación ayuda a la comunidad" />
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 30 }}>
        {[0, 1, 2, 3, 4].map((i) => {
          const p = aparece(frame, 8 + i * 6, fps);
          return (
            <svg key={i} width="54" height="54" viewBox="0 0 24 24" style={{ transform: `scale(${0.7 + p * 0.3})` }}>
              <path
                d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"
                fill={p > 0.5 ? color.recogida : color.linea}
              />
            </svg>
          );
        })}
      </div>
      <div style={{ padding: '36px 18px 0' }}>
        <Boton texto="Enviar calificación" />
      </div>
    </Pantalla>
  );
};
