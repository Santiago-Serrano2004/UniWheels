import React from 'react';
import { Reveal } from './Reveal';

const REQUISITOS = [
  'Ser estudiante, profesor o parte del personal de tu universidad, con correo institucional.',
  'Carro o moto en buen estado.',
  'Licencia de conducción vigente y de la categoría de tu vehículo.',
  'SOAT vigente y tecnomecánica si tu vehículo ya la necesita: carros desde los 5 años y motos desde los 2.',
];

const APROBACION = [
  { titulo: 'Subes tus documentos', texto: 'Desde la app, en foto o PDF.' },
  { titulo: 'Bienestar los revisa', texto: 'El equipo verifica cada documento antes de habilitarte.' },
  { titulo: 'Publicas tu primera ruta', texto: 'Con todo aprobado, ya puedes llevar compañeros.' },
];

export const ForDrivers = () => (
  <section id="conductores" className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
    <Reveal as="h2" className="max-w-2xl text-4xl sm:text-5xl font-bold tracking-[-0.025em] leading-[1.05]">
      ¿Vas a la U en carro o en moto? Llena los puestos vacíos
    </Reveal>
    <p className="mt-5 max-w-xl text-lg leading-relaxed">
      Compartes los gastos del trayecto que ya haces y conoces gente de tu sede.
    </p>

    <div className="mt-14 grid gap-14 lg:grid-cols-2 lg:gap-20">
      <div>
        <h3 className="text-2xl font-bold tracking-[-0.015em]">Qué necesitas</h3>
        <ul className="mt-6 space-y-0 divide-y divide-[var(--color-linea)] border-y border-[var(--color-linea)]">
          {REQUISITOS.map((r, i) => (
            <Reveal as="li" key={r} delay={0.15 + i * 0.15} y={0} className="flex gap-4 py-4 leading-relaxed">
              <span>{r}</span>
            </Reveal>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-2xl font-bold tracking-[-0.015em]">Cómo te aprueban</h3>
        <ol className="mt-6 rounded-3xl bg-[var(--color-tinta)] px-6 text-white divide-y divide-white/15">
          {APROBACION.map((paso, i) => (
            <Reveal as="li" key={paso.titulo} delay={0.2 + i * 0.2} y={12} className="flex gap-5 py-6">
              <span className="w-7 shrink-0 font-[family-name:var(--font-display)] text-3xl font-extrabold leading-none text-lochmara-300">{i + 1}</span>
              <div>
                <p className="font-[family-name:var(--font-display)] text-lg font-bold">{paso.titulo}</p>
                <p className="mt-1 text-sm leading-relaxed text-lochmara-100">{paso.texto}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </div>
  </section>
);
