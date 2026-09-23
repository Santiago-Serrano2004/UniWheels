import React from 'react';
import { useReducedMotion } from 'framer-motion';
import { Reveal } from './Reveal';

// Mini diagramas del trayecto: círculo = casa, cuadrado = sede de la universidad.
const Casa = ({ x }) => (
  <g>
    <circle cx={x} cy="24" r="11" fill="var(--color-recogida)" opacity="0.2" />
    <circle cx={x} cy="24" r="7" fill="var(--color-recogida)" />
  </g>
);
const Sede = ({ x }) => <rect x={x - 9} y="15" width="18" height="18" rx="4" fill="var(--color-tinta)" />;

const Tramo = ({ x1, x2, retardo = 0 }) => {
  const reducir = useReducedMotion();
  return (
    <g>
      <line x1={x1} y1="24" x2={x2} y2="24" stroke="var(--color-lochmara-600)" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 8" />
      <g>
        <rect x="-8" y="-5" width="16" height="10" rx="3.5" fill="var(--color-lochmara-600)" />
        <rect x="2" y="-3.5" width="4" height="7" rx="1.5" fill="#bae6fd" />
        {reducir ? (
          <animateTransform attributeName="transform" type="translate" to={`${(x1 + x2) / 2} 24`} dur="0.01s" fill="freeze" />
        ) : (
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`${x1} 24; ${x2} 24; ${x2} 24`}
            keyTimes="0; 0.8; 1"
            dur="3.2s"
            begin={`${retardo}s`}
            repeatCount="indefinite"
          />
        )}
      </g>
    </g>
  );
};

const MODALIDADES = [
  {
    titulo: 'Hacia el campus',
    texto: 'En la mañana o en la tarde, desde tu barrio o municipio hasta tu sede.',
    diagrama: (
      <>
        <Tramo x1={26} x2={150} />
        <Casa x={16} />
        <Sede x={162} />
      </>
    ),
  },
  {
    titulo: 'Desde el campus',
    texto: 'Al terminar clases o tu jornada, de vuelta a casa con gente de la universidad.',
    diagrama: (
      <>
        <Tramo x1={30} x2={150} retardo={0.6} />
        <Sede x={16} />
        <Casa x={162} />
      </>
    ),
  },
  {
    titulo: 'Entre sedes',
    texto: 'Para moverte entre las sedes de tu universidad en el mismo día.',
    diagrama: (
      <>
        <Tramo x1={30} x2={146} retardo={1.2} />
        <Sede x={16} />
        <Sede x={162} />
      </>
    ),
  },
];

export const Modalities = () => (
  <section id="modalidades" className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
    <Reveal as="h2" className="max-w-2xl text-4xl sm:text-5xl font-bold tracking-[-0.025em] leading-[1.05]">
      Para ir, para volver y para moverte entre sedes
    </Reveal>
    <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
      {MODALIDADES.map((m, i) => (
        <Reveal as="article" key={m.titulo} delay={0.1 + i * 0.12} className="border-t-2 border-[var(--color-tinta)] pt-6">
          <svg viewBox="0 0 180 48" className="h-12 w-[180px]" aria-hidden="true">
            {m.diagrama}
          </svg>
          <h3 className="mt-5 text-2xl font-bold tracking-[-0.015em]">{m.titulo}</h3>
          <p className="mt-2 leading-relaxed">{m.texto}</p>
        </Reveal>
      ))}
    </div>
  </section>
);
