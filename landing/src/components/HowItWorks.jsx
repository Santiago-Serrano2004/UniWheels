import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { PhoneMockup } from './PhoneMockup';

const DURACION_PASO = 4500;

const PASOS = {
  pasajero: [
    {
      titulo: 'Crea tu cuenta con tu correo institucional',
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
  const [paso, setPaso] = useState(0);
  const [ciclo, setCiclo] = useState(0);
  const reducir = useReducedMotion();
  const ref = useRef(null);
  const visible = useInView(ref, { amount: 0.35 });

  useEffect(() => {
    if (reducir || !visible) return undefined;
    const t = setTimeout(() => setPaso((p) => (p + 1) % 3), DURACION_PASO);
    return () => clearTimeout(t);
  }, [paso, ciclo, reducir, visible]);

  const elegirRol = (nuevo) => {
    setRol(nuevo);
    setPaso(0);
    setCiclo((c) => c + 1);
  };

  const elegirPaso = (i) => {
    setPaso(i);
    setCiclo((c) => c + 1);
  };

  return (
    <section id="como-funciona" ref={ref} className="relative overflow-hidden bg-[var(--color-niebla)]">
      <div aria-hidden="true" className="fondo-calles absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div>
          <motion.h2
            initial={reducir ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl font-bold tracking-[-0.025em] leading-[1.05]"
          >
            Así funciona un viaje
          </motion.h2>
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
                onClick={() => elegirRol(valor)}
                className="relative rounded-full px-5 py-2.5 text-sm font-semibold"
              >
                {rol === valor && (
                  <motion.span
                    layoutId="rol-activo"
                    className="absolute inset-0 rounded-full bg-[var(--color-tinta)]"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className={`relative ${rol === valor ? 'text-white' : 'text-[var(--color-cuerpo)]'}`}>{etiqueta}</span>
              </button>
            ))}
          </div>

          <ol className="mt-10 flex flex-col gap-3">
            {PASOS[rol].map((p, i) => {
              const activo = paso === i;
              return (
                <li key={`${rol}-${p.titulo}`}>
                  <button
                    type="button"
                    onClick={() => elegirPaso(i)}
                    aria-current={activo ? 'step' : undefined}
                    className={`relative w-full overflow-hidden rounded-2xl px-5 py-4 text-left transition-colors ${
                      activo ? 'bg-white shadow-[0_18px_40px_-24px_rgba(8,47,73,0.45)]' : 'hover:bg-white/60'
                    }`}
                  >
                    <div className="flex gap-4">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-display)] text-base font-bold transition-colors ${
                          activo ? 'bg-[var(--color-tinta)] text-white' : 'bg-white text-[var(--color-tinta)] ring-1 ring-[var(--color-linea)]'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold tracking-[-0.015em]">{p.titulo}</h3>
                        {activo && (
                          <motion.p
                            initial={reducir ? false : { opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-1.5 max-w-lg leading-relaxed"
                          >
                            {p.texto}
                          </motion.p>
                        )}
                      </div>
                    </div>
                    {activo && !reducir && visible && (
                      <motion.span
                        key={`barra-${rol}-${paso}-${ciclo}`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: DURACION_PASO / 1000, ease: 'linear' }}
                        className="absolute bottom-0 left-0 h-[3px] w-full origin-left bg-lochmara-500"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <PhoneMockup rol={rol} paso={paso} />
      </div>
    </section>
  );
};
