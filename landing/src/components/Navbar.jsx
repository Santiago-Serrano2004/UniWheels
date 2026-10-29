import React, { useEffect, useState } from 'react';

const ENLACES = [
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#modalidades', label: 'Modalidades' },
  { href: '#seguridad', label: 'Seguridad' },
  { href: '#conductores', label: 'Conductores' },
  { href: '#universidades', label: 'Universidades' },
  { href: '#beta', label: 'Beta' },
  { href: '#lista-espera', label: 'Avísame' },
  { href: '#faq', label: 'Preguntas' },
];

export const Navbar = () => {
  const [abierto, setAbierto] = useState(false);
  const [conSombra, setConSombra] = useState(false);

  useEffect(() => {
    const alScroll = () => setConSombra(window.scrollY > 8);
    alScroll();
    window.addEventListener('scroll', alScroll, { passive: true });
    return () => window.removeEventListener('scroll', alScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 bg-white/90 backdrop-blur-md transition-shadow ${
        conSombra ? 'shadow-[0_1px_0_var(--color-linea)]' : ''
      }`}
    >
      <nav className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-6" aria-label="Principal">
        <a href="#" className="flex items-center gap-2.5 shrink-0">
          <img src="/emblem.svg" alt="" className="w-8 h-8" />
          <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[var(--color-tinta)]">
            UniWheels
          </span>
        </a>

        <ul className="hidden lg:flex flex-1 items-center justify-center gap-5 whitespace-nowrap text-center text-[15px] text-[var(--color-cuerpo)]">
          {ENLACES.map((e) => (
            <li key={e.href}>
              <a href={e.href} className="hover:text-[var(--color-tinta)] transition-colors">
                {e.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#descargar"
          className="hidden lg:inline-flex shrink-0 whitespace-nowrap items-center rounded-full bg-[var(--color-tinta)] px-4 py-2 text-sm font-semibold text-white hover:bg-lochmara-700 transition-colors"
        >
          Descargar la app
        </a>

        <button
          type="button"
          className="lg:hidden px-3 py-2 -mr-2 text-sm font-semibold text-[var(--color-tinta)]"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
        >
          {abierto ? 'Cerrar' : 'Menú'}
        </button>
      </nav>

      {abierto && (
        <div className="lg:hidden border-t border-[var(--color-linea)] bg-white">
          <ul className="mx-auto max-w-6xl px-4 py-3 flex flex-col">
            {ENLACES.map((e) => (
              <li key={e.href}>
                <a
                  href={e.href}
                  onClick={() => setAbierto(false)}
                  className="block py-3 text-center text-base text-[var(--color-tinta)] border-b border-[var(--color-linea)] last:border-0"
                >
                  {e.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#descargar"
                onClick={() => setAbierto(false)}
                className="mt-3 flex justify-center rounded-full bg-[var(--color-tinta)] px-4 py-3 text-sm font-semibold text-white"
              >
                Descargar la app
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};
