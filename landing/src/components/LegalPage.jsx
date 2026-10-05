import React from 'react';
import { Footer } from './Footer';

export const LegalPage = ({ title, subtitle, children }) => (
  <div className="min-h-dvh w-full bg-[var(--color-papel)] flex flex-col">
    <header className="border-b border-[var(--color-linea)] bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4">
        <a href="/" className="flex items-center gap-2.5 w-fit">
          <img src="/emblem.svg" alt="" className="w-8 h-8" />
          <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[var(--color-tinta)]">
            UniWheels
          </span>
        </a>
      </div>
    </header>
    <main className="flex-1 mx-auto w-full max-w-3xl px-4 sm:px-6 py-10">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[var(--color-tinta)]">
        {title}
      </h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </main>
    <Footer />
  </div>
);
