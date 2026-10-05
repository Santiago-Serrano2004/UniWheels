import React, { useState } from 'react';
import { Reveal } from './Reveal';

const PREGUNTAS = [
  {
    pregunta: '¿Quién puede usar UniWheels?',
    respuesta:
      'Estudiantes de pregrado y posgrado, profesores, directivos y personal administrativo de tu universidad, con su correo institucional. No está abierta al público general.',
  },
  {
    pregunta: '¿Cómo se paga el viaje?',
    respuesta:
      'El conductor indica un aporte por cupo al publicar su ruta. La app sugiere un valor máximo según la distancia, y el conductor puede cobrar menos o llevarte gratis. Le pagas el aporte directamente, en efectivo o por Nequi. UniWheels no cobra comisión ni procesa pagos.',
  },
  {
    pregunta: '¿Puedo cancelar una reserva?',
    respuesta:
      'Sí, desde la app y antes de que empiece el viaje. Si cancelas a menos de 2 minutos de la salida (o, siendo conductor, a menos de 15 minutos con pasajeros confirmados), se registra una cancelación tardía. Con 3 cancelaciones tardías en 30 días, la cuenta se suspende por 30 días.',
  },
  {
    pregunta: '¿Qué pasa con mis datos?',
    respuesta:
      'Los tratamos según la Ley 1581 de 2012. Los usamos solo para operar el servicio y para la seguridad de los viajes; no los vendemos ni procesamos pagos. La comunicación con nuestros servidores viaja cifrada.',
    conPolitica: true,
  },
  {
    pregunta: '¿Cuánto cuesta usar UniWheels?',
    respuesta: 'Nada. La app es gratis para estudiantes, docentes y personal: la licencia la paga tu universidad.',
  },
  {
    pregunta: '¿Cuándo sale la app en las tiendas?',
    respuesta:
      'Estamos terminando la validación final. Muy pronto estará disponible en App Store y Google Play; este sitio se actualizará con los enlaces de descarga.',
  },
  {
    pregunta: '¿Qué gano compartiendo el viaje?',
    respuesta:
      'Gastas menos en transporte, viajas directo con gente de tu misma universidad y ayudas a que haya menos carros en las vías de Bucaramanga y su área metropolitana.',
  },
];

export const FAQ = ({ onOpenPrivacy }) => {
  const [abierta, setAbierta] = useState(0);

  return (
    <section id="faq" className="bg-[var(--color-niebla)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <Reveal as="h2" className="text-4xl sm:text-5xl font-bold tracking-[-0.025em] leading-[1.05]">Preguntas frecuentes</Reveal>
          <p className="mt-5 max-w-sm text-lg leading-relaxed">
            ¿No encuentras tu respuesta? Escríbenos a{' '}
            <a
              href="mailto:uniwheelscontact@gmail.com"
              className="font-semibold text-lochmara-700 underline decoration-lochmara-300 underline-offset-4 hover:decoration-lochmara-700"
            >
              uniwheelscontact@gmail.com
            </a>
            .
          </p>
        </div>

        <ul className="divide-y divide-[var(--color-linea)] border-y border-[var(--color-linea)]">
          {PREGUNTAS.map((item, i) => {
            const expandida = abierta === i;
            const idPanel = `faq-panel-${i}`;
            return (
              <li key={item.pregunta}>
                <h3 className="text-lg sm:text-xl font-bold tracking-[-0.01em]">
                  <button
                    type="button"
                    onClick={() => setAbierta(expandida ? -1 : i)}
                    aria-expanded={expandida}
                    aria-controls={idPanel}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left text-[var(--color-tinta)]"
                  >
                    {item.pregunta}
                    <span className="shrink-0 text-sm font-semibold text-lochmara-700">
                      {expandida ? 'Cerrar' : 'Ver'}
                    </span>
                  </button>
                </h3>
                <div id={idPanel} hidden={!expandida} className="pb-6 pr-10">
                  <p className="leading-relaxed">{item.respuesta}</p>
                  {item.conPolitica && (
                    <button
                      type="button"
                      onClick={onOpenPrivacy}
                      className="mt-3 text-sm font-semibold text-lochmara-700 underline decoration-lochmara-300 underline-offset-4 hover:decoration-lochmara-700"
                    >
                      Leer la política de tratamiento de datos
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};
