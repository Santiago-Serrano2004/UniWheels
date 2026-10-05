import React from 'react';

export const Footer = () => (
  <footer className="border-t border-[var(--color-linea)] bg-white">
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
      <div className="max-w-sm">
        <div className="flex items-center gap-2.5">
          <img src="/emblem.svg" alt="" className="w-8 h-8" />
          <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[var(--color-tinta)]">
            UniWheels
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed">
          Carpooling para comunidades universitarias.
        </p>
      </div>

      <div className="flex flex-col gap-2 text-sm">
        <a
          href="mailto:uniwheelscontact@gmail.com"
          className="text-[var(--color-tinta)] hover:text-lochmara-700 transition-colors"
        >
          uniwheelscontact@gmail.com
        </a>
        <a
          href="/privacidad"
          className="text-[var(--color-tinta)] hover:text-lochmara-700 transition-colors"
        >
          Política de tratamiento de datos
        </a>
        <a
          href="/soporte"
          className="text-[var(--color-tinta)] hover:text-lochmara-700 transition-colors"
        >
          Soporte
        </a>
      </div>
    </div>
    <div className="border-t border-[var(--color-linea)]">
      <p className="mx-auto max-w-6xl px-4 sm:px-6 py-5 text-xs">
        © {new Date().getFullYear()} UniWheels. Bucaramanga, Santander.
      </p>
    </div>
  </footer>
);
