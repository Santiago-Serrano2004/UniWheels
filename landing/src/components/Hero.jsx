import React from 'react';
import { RouteMap } from './RouteMap';

const TiendaProximamente = ({ tienda, detalle }) => (
  <div
    className="inline-flex items-center gap-3 rounded-2xl border border-[var(--color-linea)] bg-white px-4 py-2.5 text-left"
    aria-label={`${tienda}: próximamente`}
  >
    <div>
      <p className="text-[11px] text-[var(--color-cuerpo)]">{detalle}</p>
      <p className="text-sm font-semibold text-[var(--color-tinta)]">{tienda}</p>
    </div>
  </div>
);

export const Hero = () => (
  <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-20 sm:pt-16 sm:pb-28">
    <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
      <div className="max-w-xl">
        <h1 className="text-[2.75rem] leading-[1.02] sm:text-6xl font-extrabold tracking-[-0.03em]">
          Viaja a la U con gente de la U.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-[var(--color-cuerpo)]">
          UniWheels conecta a estudiantes, profesores y personal de la UNAB que hacen el mismo trayecto.
          Reservas tu cupo en la app, subes con un PIN y compartes los gastos del viaje.
        </p>

        <div id="descargar" className="mt-9">
          <p className="text-sm font-semibold text-[var(--color-tinta)]">La app llega pronto a las tiendas</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <TiendaProximamente tienda="App Store" detalle="Próximamente en" />
            <TiendaProximamente tienda="Google Play" detalle="Próximamente en" />
          </div>
          <p className="mt-4 text-sm text-[var(--color-cuerpo)]">
            Solo con tu correo institucional @unab.edu.co.
          </p>
        </div>
      </div>

      <RouteMap />
    </div>
  </section>
);
