import React from 'react';

// Mini diagramas del trayecto: círculo = casa, cuadrado = sede UNAB.
const Casa = ({ x }) => <circle cx={x} cy="20" r="7" fill="var(--color-recogida)" />;
const Sede = ({ x }) => <rect x={x - 7} y="13" width="14" height="14" rx="3" fill="var(--color-tinta)" />;
const Tramo = ({ x1, x2 }) => (
  <line x1={x1} y1="20" x2={x2} y2="20" stroke="var(--color-lochmara-600)" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 7" />
);

const MODALIDADES = [
  {
    titulo: 'Hacia el campus',
    texto: 'En la mañana o en la tarde, desde tu barrio o municipio hasta tu sede.',
    diagrama: (
      <>
        <Tramo x1={20} x2={112} />
        <Casa x={14} />
        <Sede x={120} />
      </>
    ),
  },
  {
    titulo: 'Desde el campus',
    texto: 'Al terminar clases o tu jornada, de vuelta a casa con gente de la universidad.',
    diagrama: (
      <>
        <Tramo x1={22} x2={114} />
        <Sede x={14} />
        <Casa x={120} />
      </>
    ),
  },
  {
    titulo: 'Entre sedes',
    texto: 'Para moverte entre El Jardín, El Bosque, el CSU y La Casona en el mismo día.',
    diagrama: (
      <>
        <Tramo x1={22} x2={112} />
        <Sede x={14} />
        <Sede x={120} />
      </>
    ),
  },
];

export const Modalities = () => (
  <section id="modalidades" className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
    <h2 className="max-w-2xl text-4xl sm:text-5xl font-bold tracking-[-0.025em] leading-[1.05]">
      Para ir, para volver y para moverte entre sedes
    </h2>
    <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
      {MODALIDADES.map((m) => (
        <article key={m.titulo} className="border-t-2 border-[var(--color-tinta)] pt-6">
          <svg viewBox="0 0 134 40" className="h-10 w-[134px]" aria-hidden="true">
            {m.diagrama}
          </svg>
          <h3 className="mt-5 text-2xl font-bold tracking-[-0.015em]">{m.titulo}</h3>
          <p className="mt-2 leading-relaxed">{m.texto}</p>
        </article>
      ))}
    </div>
  </section>
);
