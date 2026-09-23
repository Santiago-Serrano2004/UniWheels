import React, { useEffect, useState } from 'react';

// Trayecto ilustrado Cañaveral -> Campus El Jardín. No es un mapa a escala:
// es la pieza de la portada que cuenta qué hace la app en una sola imagen.
const RUTA =
  'M 92 432 C 150 404, 176 360, 214 330 S 292 286, 318 244 S 356 170, 404 150 S 470 118, 478 86';

const CALLES = [
  'M 0 380 C 120 360, 260 400, 560 340',
  'M 0 250 C 140 270, 300 210, 560 230',
  'M 0 120 C 160 150, 340 90, 560 110',
  'M 130 520 C 150 380, 110 240, 150 0',
  'M 300 520 C 280 400, 330 260, 300 0',
  'M 450 520 C 470 360, 420 220, 470 0',
];

export const RouteMap = () => {
  const [animar, setAnimar] = useState(true);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setAnimar(!media.matches);
  }, []);

  return (
    <figure className="relative w-full" aria-label="Ilustración de un trayecto compartido desde Cañaveral hasta el Campus El Jardín">
      <svg viewBox="0 0 560 520" className="w-full h-auto" role="img" aria-hidden="true">
        <rect x="0" y="0" width="560" height="520" rx="28" fill="var(--color-niebla)" />

        {/* Parque / zona verde para dar lectura de ciudad */}
        <path d="M 360 360 C 420 330, 500 350, 520 410 C 540 470, 470 500, 410 480 C 350 460, 320 390, 360 360 Z" fill="#e3f0e8" />

        {CALLES.map((d) => (
          <path key={d} d={d} fill="none" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" />
        ))}
        {CALLES.map((d) => (
          <path key={`${d}-borde`} d={d} fill="none" stroke="var(--color-linea)" strokeWidth="1.5" strokeLinecap="round" />
        ))}

        {/* Ruta */}
        <path d={RUTA} fill="none" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" />
        <path
          id="ruta-uniwheels"
          d={RUTA}
          pathLength="1"
          fill="none"
          stroke="var(--color-lochmara-600)"
          strokeWidth="6"
          strokeLinecap="round"
          className={animar ? 'ruta-dibujo' : undefined}
        />

        {/* Recogida */}
        <g transform="translate(92 432)">
          <circle r="18" fill="var(--color-recogida)" opacity="0.18" />
          <circle r="9" fill="var(--color-recogida)" stroke="#ffffff" strokeWidth="3" />
        </g>

        {/* Destino */}
        <g transform="translate(478 86)">
          <circle r="16" fill="var(--color-tinta)" opacity="0.12" />
          <rect x="-9" y="-9" width="18" height="18" rx="4" fill="var(--color-tinta)" stroke="#ffffff" strokeWidth="3" />
        </g>

        {/* Carro que recorre la ruta una sola vez (sin animación: queda en el destino) */}
        <g opacity={animar ? 0 : 1} transform={animar ? undefined : 'translate(478 86)'}>
          <circle r="15" fill="#ffffff" stroke="var(--color-tinta)" strokeWidth="2.5" />
          <path d="M -7 2 L -5 -3 Q -4 -5 -2 -5 L 2 -5 Q 4 -5 5 -3 L 7 2 L 7 5 L -7 5 Z" fill="var(--color-tinta)" />
          {animar ? (
            <>
              <set attributeName="opacity" to="1" begin="1.1s" fill="freeze" />
              <animateMotion dur="3s" begin="1.1s" fill="freeze" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.45 0 0.25 1">
                <mpath href="#ruta-uniwheels" />
              </animateMotion>
            </>
          ) : null}
        </g>
      </svg>

      {/* Etiquetas en HTML para que el texto sea nítido y accesible */}
      <div className="absolute left-[20%] top-[84%] rounded-xl sm:rounded-2xl bg-white px-2.5 py-1.5 sm:px-4 sm:py-2.5 shadow-[0_8px_24px_-12px_rgba(8,47,73,0.35)]">
        <p className="text-[10px] sm:text-xs text-[var(--color-cuerpo)]">Recogida en Cañaveral</p>
        <p className="font-[family-name:var(--font-display)] text-sm sm:text-lg font-bold text-[var(--color-tinta)]">6:40 a. m.</p>
      </div>

      <div className="absolute right-[19%] top-[4%] rounded-xl sm:rounded-2xl bg-[var(--color-tinta)] px-2.5 py-1.5 sm:px-4 sm:py-2.5 text-white">
        <p className="text-[10px] sm:text-xs text-lochmara-200">Llegada</p>
        <p className="font-[family-name:var(--font-display)] text-sm sm:text-lg font-bold">Campus El Jardín</p>
      </div>

      <div
        className={`absolute left-[61%] top-[46%] rounded-xl sm:rounded-2xl border border-[var(--color-linea)] bg-white px-2.5 py-1.5 sm:px-4 sm:py-2.5 ${
          animar ? 'pin-aparece' : ''
        }`}
      >
        <p className="text-[10px] sm:text-xs text-[var(--color-cuerpo)]">PIN de abordaje</p>
        <p className="font-[family-name:var(--font-display)] text-lg sm:text-2xl font-extrabold tracking-[0.18em] text-[var(--color-tinta)]">
          4829
        </p>
      </div>
    </figure>
  );
};
