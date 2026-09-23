import React from 'react';
import { BadgeCheck, KeyRound, Siren, FileCheck2, Lock } from 'lucide-react';

const GARANTIAS = [
  {
    icono: BadgeCheck,
    titulo: 'Solo gente de la UNAB',
    texto: 'Para crear una cuenta necesitas un correo @unab.edu.co y confirmar el código que te llega a ese correo.',
  },
  {
    icono: KeyRound,
    titulo: 'Un PIN en cada abordaje',
    texto: 'Cada reserva tiene un PIN de 4 dígitos. El viaje empieza solo cuando el conductor lo confirma.',
  },
  {
    icono: Siren,
    titulo: 'Botón SOS durante el viaje',
    texto:
      'Con un toque llamas a la línea 123, a emergencias médicas o a la seguridad de la UNAB, o compartes tu ubicación por WhatsApp. Cada alerta queda registrada para Bienestar Universitario.',
  },
  {
    icono: FileCheck2,
    titulo: 'Conductores revisados',
    texto: 'Bienestar Universitario revisa el SOAT, la licencia y la tecnomecánica de cada conductor antes de aprobarlo.',
  },
];

export const Security = ({ onOpenPrivacy }) => (
  <section id="seguridad" className="bg-[var(--color-niebla)]">
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <h2 className="text-4xl sm:text-5xl font-bold tracking-[-0.025em] leading-[1.05]">
          Sabes con quién viajas
        </h2>
        <p className="mt-5 max-w-md text-lg leading-relaxed">
          Todos en UniWheels son de la universidad, y cada viaje tiene controles antes, durante y después.
        </p>
      </div>

      <ul className="divide-y divide-[var(--color-linea)] border-y border-[var(--color-linea)]">
        {GARANTIAS.map(({ icono: Icono, titulo, texto }) => (
          <li key={titulo} className="flex gap-5 py-7">
            <Icono className="mt-1 h-6 w-6 shrink-0 text-lochmara-600" strokeWidth={1.75} aria-hidden="true" />
            <div>
              <h3 className="text-xl font-bold tracking-[-0.015em]">{titulo}</h3>
              <p className="mt-1.5 leading-relaxed">{texto}</p>
            </div>
          </li>
        ))}
        <li className="flex gap-5 py-7">
          <Lock className="mt-1 h-6 w-6 shrink-0 text-lochmara-600" strokeWidth={1.75} aria-hidden="true" />
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
