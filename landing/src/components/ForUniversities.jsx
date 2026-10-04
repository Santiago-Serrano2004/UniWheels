import React from 'react';
import { ClipboardCheck, ShieldCheck } from 'lucide-react';
import { Reveal } from './Reveal';

const PUNTOS = [
  {
    icono: ClipboardCheck,
    titulo: 'Panel de Bienestar',
    texto: 'Revisa los documentos de los conductores, atiende las alertas SOS y gestiona suspensiones.',
  },
  {
    icono: ShieldCheck,
    titulo: 'Comunidad verificada',
    texto: 'Solo entran personas con correo de tu institución. Nadie de afuera ve las rutas.',
  },
];

export const ForUniversities = () => (
  <section id="universidades" className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
    <Reveal as="h2" className="max-w-2xl text-4xl sm:text-5xl font-bold tracking-[-0.025em] leading-[1.05]">
      Para universidades
    </Reveal>
    <p className="mt-5 max-w-xl text-lg leading-relaxed">
      UniWheels es una plataforma de viajes compartidos solo para tu comunidad: cada persona se verifica con su correo institucional y cada conductor, con sus documentos.
    </p>

    <ul className="mt-12 grid gap-6 sm:grid-cols-2">
      {PUNTOS.map((p) => (
        <li key={p.titulo} className="flex gap-4 rounded-3xl bg-[var(--color-niebla)] p-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lochmara-600 text-white">
            <p.icono className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-xl font-bold tracking-[-0.015em]">{p.titulo}</h3>
            <p className="mt-2 leading-relaxed">{p.texto}</p>
          </div>
        </li>
      ))}
    </ul>

    <a
      href="mailto:uniwheelscontact@gmail.com?subject=UniWheels%20para%20mi%20universidad"
      className="mt-10 inline-flex items-center rounded-full bg-[var(--color-tinta)] px-6 py-3 text-sm font-semibold text-white hover:bg-lochmara-700 transition-colors"
    >
      Escríbenos
    </a>
  </section>
);
