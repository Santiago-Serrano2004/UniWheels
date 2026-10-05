import React from 'react';
import { Reveal } from './Reveal';

const GARANTIAS = [
  {
    titulo: 'Solo gente de tu universidad',
    texto: 'Para crear una cuenta necesitas tu correo institucional y confirmar el código que te llega a ese correo.',
  },
  {
    titulo: 'Un PIN en cada abordaje',
    texto: 'Cada reserva tiene un PIN de 4 dígitos. El viaje empieza solo cuando el conductor lo confirma.',
  },
  {
    titulo: 'Botón SOS durante el viaje',
    texto:
      'Con un toque llamas a la línea 123, a emergencias médicas o a la seguridad del campus, o compartes tu ubicación por WhatsApp. Cada alerta queda registrada para Bienestar Universitario.',
  },
  {
    titulo: 'Conductores revisados',
    texto: 'Bienestar Universitario revisa el SOAT, la licencia y la tecnomecánica de cada conductor antes de aprobarlo.',
  },
];

export const Security = ({ onOpenPrivacy }) => (
  <section id="seguridad" className="bg-[var(--color-niebla)]">
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <Reveal as="h2" className="text-4xl sm:text-5xl font-bold tracking-[-0.025em] leading-[1.05]">
          Sabes con quién viajas
        </Reveal>
        <p className="mt-5 max-w-md text-lg leading-relaxed">
          Todos en UniWheels son de la universidad, y cada viaje tiene controles antes, durante y después.
        </p>

        <div className="mt-10 flex items-center gap-6" aria-hidden="true">
          <div className="relative h-24 w-24 shrink-0">
            <span className="sos-onda absolute inset-0 rounded-full bg-rose-500" />
            <span className="sos-onda absolute inset-0 rounded-full bg-rose-500 [animation-delay:1.2s]" />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-rose-600 font-[family-name:var(--font-display)] text-2xl font-extrabold text-white shadow-[0_14px_30px_-10px_rgba(225,29,72,0.6)]">
              SOS
            </span>
          </div>
          <p className="max-w-[15rem] text-sm leading-relaxed">
            Durante el viaje, el botón SOS queda visible arriba en la app, a un toque.
          </p>
        </div>
      </div>

      <ul className="divide-y divide-[var(--color-linea)] border-y border-[var(--color-linea)]">
        {GARANTIAS.map(({ titulo, texto }, i) => (
          <Reveal as="li" key={titulo} delay={i * 0.08} y={16} className="flex gap-5 py-7">
            <div>
              <h3 className="text-xl font-bold tracking-[-0.015em]">{titulo}</h3>
              <p className="mt-1.5 leading-relaxed">{texto}</p>
            </div>
          </Reveal>
        ))}
        <li className="flex gap-5 py-7">
          <div>
            <h3 className="text-xl font-bold tracking-[-0.015em]">Tus datos, bajo la Ley 1581 de 2012</h3>
            <p className="mt-1.5 leading-relaxed">
              Se usan solo para operar el servicio y la seguridad de los viajes, no se venden a terceros y puedes pedir que
              los corrijan cuando quieras.
            </p>
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="mt-3 text-sm font-semibold text-lochmara-700 underline decoration-lochmara-300 underline-offset-4 hover:decoration-lochmara-700"
            >
              Leer la política de tratamiento de datos
            </button>
          </div>
        </li>
      </ul>
    </div>
  </section>
);
