import React, { useState } from 'react';

const PASOS = {
  pasajero: [
    {
      titulo: 'Crea tu cuenta con tu correo UNAB',
      texto: 'Te enviamos un código a tu correo institucional para confirmar que eres de la universidad.',
    },
    {
      titulo: 'Reserva un cupo',
      texto: 'Busca rutas hacia tu sede o desde ella, elige el punto de recogida y la hora que te sirve.',
    },
    {
      titulo: 'Sube con tu PIN',
      texto:
        'Cuando llega el conductor, le dictas tu PIN de 4 dígitos. Pagas en efectivo, por Nequi o Daviplata, o con tarjeta desde la app.',
    },
  ],
  conductor: [
    {
      titulo: 'Registra tu vehículo',
      texto:
        'Subes foto o PDF de tu SOAT, tu licencia y, si aplica, la tecnomecánica. Bienestar Universitario revisa cada documento.',
    },
    {
      titulo: 'Publica tu recorrido',
      texto: 'Indicas de dónde sales, a qué sede vas, a qué hora y cuántos cupos tienes.',
    },
    {
      titulo: 'Recoge y confirma el PIN',
      texto: 'Cada pasajero te dicta su PIN al subir y así empieza el viaje. Los gastos se comparten entre todos.',
    },
  ],
};

export const HowItWorks = () => {
  const [rol, setRol] = useState('pasajero');

  return (
    <section id="como-funciona" className="bg-[var(--color-niebla)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-[-0.025em] leading-[1.05]">Así funciona un viaje</h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed">
            Tres pasos, tanto si buscas cupo como si tienes carro o moto y quieres compartir el trayecto.
          </p>

          <div role="tablist" aria-label="Elige tu rol" className="mt-8 inline-flex rounded-full bg-white p-1 border border-[var(--color-linea)]">
            {[
              ['pasajero', 'Soy pasajero'],
              ['conductor', 'Soy conductor'],
            ].map(([valor, etiqueta]) => (
              <button
                key={valor}
                type="button"
                role="tab"
                aria-selected={rol === valor}
                onClick={() => setRol(valor)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                  rol === valor ? 'bg-[var(--color-tinta)] text-white' : 'text-[var(--color-cuerpo)] hover:text-[var(--color-tinta)]'
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>
        </div>

        <ol key={rol} className="relative pasos-cambio">
          <span aria-hidden="true" className="absolute left-[19px] top-6 bottom-6 w-[3px] rounded-full bg-lochmara-600/25" />
          {PASOS[rol].map((paso, i) => (
            <li key={paso.titulo} className="relative flex gap-6 pb-10 last:pb-0">
              <span
                className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-display)] text-lg font-bold ${
                  i === 0
                    ? 'bg-[var(--color-recogida)] text-[var(--color-tinta)]'
                    : i === PASOS[rol].length - 1
                      ? 'bg-[var(--color-tinta)] text-white'
                      : 'bg-white text-[var(--color-tinta)] ring-[3px] ring-lochmara-600'
                }`}
              >
                {i + 1}
              </span>
              <div className="pt-1.5">
                <h3 className="text-xl sm:text-2xl font-bold tracking-[-0.015em]">{paso.titulo}</h3>
                <p className="mt-2 max-w-lg leading-relaxed">{paso.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
