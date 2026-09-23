import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const PREGUNTAS = [
  {
    pregunta: '¿Quién puede usar UniWheels?',
    respuesta:
      'Estudiantes de pregrado y posgrado, profesores, directivos y personal administrativo de la Universidad Autónoma de Bucaramanga, con correo institucional @unab.edu.co. No está abierta al público general.',
  },
  {
    pregunta: '¿Cómo se paga el viaje?',
    respuesta:
      'Al reservar eliges cómo pagar: en efectivo, por Nequi o Daviplata directamente al conductor, o con tarjeta a través de la pasarela Wompi dentro de la app. Ves la tarifa antes de confirmar la reserva.',
  },
  {
    pregunta: '¿Puedo cancelar una reserva?',
    respuesta: 'Sí, desde la app y antes de que inicie el viaje. El cupo queda libre para otro compañero.',
  },
  {
    pregunta: '¿Qué pasa con mis datos?',
    respuesta:
      'Se tratan según la Ley 1581 de 2012 y el Decreto 1377 de 2013. Tu información de contacto y tus trayectos se usan únicamente para operar el servicio y para la seguridad de los viajes, sin venta a terceros. La comunicación entre la app y nuestros servidores viaja cifrada.',
    conPolitica: true,
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
          <h2 className="text-4xl sm:text-5xl font-bold tracking-[-0.025em] leading-[1.05]">Preguntas frecuentes</h2>
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
                    {expandida ? (
                      <Minus className="h-5 w-5 shrink-0 text-lochmara-600" aria-hidden="true" />
                    ) : (
                      <Plus className="h-5 w-5 shrink-0 text-lochmara-600" aria-hidden="true" />
                    )}
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
