import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Navigation } from 'lucide-react';

// Mapa ilustrado de un trayecto compartido. No es un mapa real: es la pieza
// de la portada que muestra en una imagen qué hace la app.
const W = 600;
const H = 560;
const pct = (v, total) => `${(v / total) * 100}%`;

const CALLES_H = [80, 200, 330, 460];
const CALLES_V = [110, 250, 390, 520];
const AVENIDA = 'M -20 533 L 620 107';
// Ruta por las calles: recogida A -> recogida B -> campus
const RUTA = 'M 110 460 H 250 V 353 L 390 260 V 200 H 520 V 92';

const Pin = ({ x, y, delay, children }) => {
  const reducir = useReducedMotion();
  return (
    <motion.g
      initial={reducir ? false : { opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 380, damping: 18 }}
    >
      <g transform={`translate(${x} ${y})`}>{children}</g>
    </motion.g>
  );
};

const Carro = () => (
  <g>
    <ellipse cx="0" cy="2" rx="17" ry="10" fill="#082f49" opacity="0.18" />
    <rect x="-16" y="-9" width="32" height="18" rx="6" fill="#082f49" />
    <rect x="3" y="-6.5" width="8" height="13" rx="2.5" fill="#7dd3fc" />
    <rect x="-12" y="-6.5" width="6" height="13" rx="2" fill="#38bdf8" opacity="0.6" />
    <circle cx="15" cy="-5" r="1.6" fill="#fef3c7" />
    <circle cx="15" cy="5" r="1.6" fill="#fef3c7" />
  </g>
);

export const RouteMap = () => {
  const reducir = useReducedMotion();

  return (
    <figure className="relative w-full select-none" aria-label="Ilustración de un trayecto compartido hacia el campus">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto drop-shadow-[0_30px_60px_rgba(8,47,73,0.18)]" aria-hidden="true">
        <defs>
          <clipPath id="mapa-recorte">
            <rect width={W} height={H} rx="32" />
          </clipPath>
          <pattern id="mapa-arboles" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="3.2" fill="#bfe2cb" />
            <circle cx="14" cy="13" r="2.6" fill="#bfe2cb" />
          </pattern>
        </defs>

        <g clipPath="url(#mapa-recorte)">
          {/* Cuadras */}
          <rect width={W} height={H} fill="#e8eff3" />

          {/* Parque y quebrada */}
          <rect x="399" y="339" width="112" height="112" rx="10" fill="#d6ecdd" />
          <rect x="399" y="339" width="112" height="112" rx="10" fill="url(#mapa-arboles)" />
          <path d="M -10 150 C 60 170, 90 110, 160 128 S 230 170, 250 140" fill="none" stroke="#cfe6f5" strokeWidth="16" strokeLinecap="round" />

          {/* Calles */}
          {CALLES_H.map((y) => (
            <line key={`h${y}`} x1="-20" y1={y} x2={W + 20} y2={y} stroke="#ffffff" strokeWidth="18" />
          ))}
          {CALLES_V.map((x) => (
            <line key={`v${x}`} x1={x} y1="-20" x2={x} y2={H + 20} stroke="#ffffff" strokeWidth="18" />
          ))}
          <path d={AVENIDA} stroke="#d5e2ea" strokeWidth="32" />
          <path d={AVENIDA} stroke="#ffffff" strokeWidth="28" />
          <path d={AVENIDA} stroke="#e3ecf1" strokeWidth="1.5" strokeDasharray="10 12" />

          {/* Nombres de calles */}
          <g fontFamily="Plus Jakarta Sans, sans-serif" fontSize="10.5" fontWeight="600" fill="#8aa1b1" letterSpacing="0.3">
            <text x="20" y="455">Calle 45</text>
            <text x="20" y="195">Calle 56</text>
            <text transform="translate(245 320) rotate(-90)">Carrera 27</text>
            <text transform="translate(515 450) rotate(-90)">Carrera 33</text>
            <text transform="translate(150 440) rotate(-33.7)">Autopista</text>
            <text x="409" y="398" fill="#6fa487">Parque</text>
          </g>

          {/* Ruta: borde, relleno y puntos que avanzan (sentido del viaje) */}
          <path d={RUTA} fill="none" stroke="#075985" strokeWidth="14" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
          <path d={RUTA} fill="none" stroke="#0ea5e9" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" />
          <path
            d={RUTA}
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="0 20"
            className={reducir ? undefined : 'ruta-flujo'}
          />
          <path id="ruta-carro" d={RUTA} fill="none" stroke="none" />

          {/* Paradas */}
          <Pin x={110} y={460} delay={0.3}>
            <circle r="20" fill="#f59e0b" opacity="0.2" className={reducir ? undefined : 'pin-pulso'} />
            <circle r="10" fill="#f59e0b" stroke="#ffffff" strokeWidth="4" />
          </Pin>
          <Pin x={390} y={260} delay={0.5}>
            <circle r="10" fill="#f59e0b" stroke="#ffffff" strokeWidth="4" />
          </Pin>
          <Pin x={520} y={84} delay={0.7}>
            <path d="M 0 12 C -14 -2, -16 -8, -16 -14 A 16 16 0 1 1 16 -14 C 16 -8, 14 -2, 0 12 Z" fill="#082f49" stroke="#ffffff" strokeWidth="3" />
            <rect x="-6" y="-20" width="12" height="10" rx="1.5" fill="#ffffff" />
            <path d="M -8 -19 L 0 -25 L 8 -19 Z" fill="#ffffff" />
          </Pin>

          {/* Carro: recorre la ruta, se detiene en la segunda recogida y vuelve a empezar */}
          <g transform={reducir ? 'translate(390 260) rotate(-33.7)' : undefined}>
            <Carro />
            {!reducir && (
              <animateMotion
                dur="9s"
                begin="0.9s"
                repeatCount="indefinite"
                rotate="auto"
                keyPoints="0;0.47;0.47;1;1"
                keyTimes="0;0.4;0.52;0.9;1"
                calcMode="linear"
              >
                <mpath href="#ruta-carro" />
              </animateMotion>
            )}
          </g>
        </g>
      </svg>

      {/* Tarjetas sobre el mapa (HTML: texto nítido y accesible) */}
      <motion.div
        initial={reducir ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.45 }}
        className="absolute rounded-2xl bg-white/95 backdrop-blur px-3 py-2 sm:px-4 sm:py-3 shadow-[0_12px_30px_-14px_rgba(8,47,73,0.45)]"
        style={{ left: pct(24, W), top: pct(24, H) }}
      >
        <p className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-emerald-600">
          <span className="relative flex h-2 w-2">
            {!reducir && <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />}
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          En camino
        </p>
        <p className="mt-0.5 font-[family-name:var(--font-display)] text-sm sm:text-xl font-extrabold text-[var(--color-tinta)]">
          Llegas en 14 min
        </p>
      </motion.div>

      <motion.div
        initial={reducir ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.4 }}
        className="absolute flex items-center gap-2 rounded-xl sm:rounded-2xl bg-[var(--color-tinta)] px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 text-white"
        style={{ right: pct(W - 496, W), top: pct(58, H) }}
      >
        <Navigation className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-lochmara-300" aria-hidden="true" />
        <span className="font-[family-name:var(--font-display)] text-xs sm:text-base font-bold">Tu campus</span>
      </motion.div>

      <motion.div
        initial={reducir ? false : { opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.3, duration: 0.4 }}
        className="absolute flex items-center gap-1.5 sm:gap-2 rounded-full bg-white pl-1 pr-2 sm:pr-3 py-1 shadow-[0_8px_20px_-12px_rgba(8,47,73,0.5)]"
        style={{ left: pct(408, W), top: pct(262, H) }}
      >
        <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-amber-100 text-[10px] sm:text-xs font-bold text-amber-700">
          LM
        </span>
        <span className="whitespace-nowrap text-[10px] sm:text-xs font-semibold text-[var(--color-tinta)]">Laura sube aquí</span>
      </motion.div>

      <motion.div
        initial={reducir ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.45 }}
        className="absolute rounded-2xl bg-white px-3 py-2 sm:px-4 sm:py-3 shadow-[0_12px_30px_-14px_rgba(8,47,73,0.45)]"
        style={{ left: pct(138, W), top: pct(478, H) }}
      >
        <p className="text-[10px] sm:text-xs text-[var(--color-cuerpo)]">Te recogen aquí. Tu PIN:</p>
        <p className="font-[family-name:var(--font-display)] text-base sm:text-2xl font-extrabold tracking-[0.2em] text-[var(--color-tinta)]">
          4829
        </p>
      </motion.div>

      <motion.div
        initial={reducir ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.7, duration: 0.45 }}
        className="absolute hidden sm:block rounded-2xl bg-white px-4 py-3 shadow-[0_12px_30px_-14px_rgba(8,47,73,0.45)]"
        style={{ right: pct(22, W), top: pct(478, H) }}
      >
        <p className="text-xs text-[var(--color-cuerpo)]">Cupos</p>
        <div className="mt-1.5 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              initial={reducir ? false : { scale: 0.4, backgroundColor: '#e2e8f0' }}
              animate={{ scale: 1, backgroundColor: i < 2 ? '#0284c7' : '#e2e8f0' }}
              transition={{ delay: 2 + i * 0.35, type: 'spring', stiffness: 400, damping: 15 }}
              className="h-5 w-5 rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </figure>
  );
};
