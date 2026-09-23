import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FAQ = ({ onOpenPrivacy }) => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: '¿Quiénes pueden utilizar UniWheels?',
      answer: 'UniWheels es exclusivo para la comunidad activa de la Universidad Autónoma de Bucaramanga (UNAB): estudiantes de pregrado y posgrado, docentes, directivos y personal administrativo con correo institucional válido (@unab.edu.co). No está abierta al público general.',
    },
    {
      question: '¿Cómo se pagan y cobran los viajes?',
      answer: 'Al reservar eliges cómo pagar: en efectivo, por Nequi o Daviplata directamente al conductor, o con tarjeta a través de la pasarela Wompi dentro de la app. La tarifa la ves antes de confirmar la reserva.',
    },
    {
      question: '¿Qué sucede si necesito cancelar una reserva de viaje?',
      answer: 'Puedes cancelar tu reserva desde la aplicación antes de que inicie el viaje, y el cupo queda libre para otro compañero.',
    },
    {
      question: '¿Cómo se protegen mis datos personales y trayectorias?',
      answer: 'Damos estricto cumplimiento a la Ley Estatutaria 1581 de 2012 y el Decreto 1377 de 2013 de Colombia. Tu información de contacto y tus trayectos se usan únicamente para operar el servicio y para la seguridad de los viajes, sin venta a terceros. La comunicación entre la app y nuestros servidores viaja cifrada.',
      hasPrivacyLink: true,
    },
    {
      question: '¿Cuándo estará disponible la app para descarga en tiendas móviles?',
      answer: 'La aplicación móvil para Android e iOS se encuentra en etapa final de validación y auditoría institucional. Muy pronto estará disponible para descarga oficial en Google Play Store y Apple App Store.',
    },
    {
      question: '¿Qué beneficios obtengo al compartir mi viaje con compañeros?',
      answer: 'Ahorras dinero en desplazamientos diarios, viajas de forma cómoda y directa con miembros de tu misma institución académica, ahorras tiempo y contribuyes activamente a descongestionar el tráfico de Bucaramanga y mitigar la huella de carbono.',
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section id="faq" className="py-20 md:py-28 bg-slate-100/70 dark:bg-slate-900/40 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lochmara-50 dark:bg-lochmara-950/60 border border-lochmara-200 dark:border-lochmara-800 text-lochmara-700 dark:text-lochmara-300 text-xs font-semibold mb-4">
            <HelpCircle className="w-4 h-4 text-lochmara-600 dark:text-lochmara-400" />
            <span>Resolución de dudas</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Preguntas frecuentes
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            Todo lo que necesitas saber antes de iniciar tus recorridos con UniWheels.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-hidden"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-lochmara-600 dark:text-lochmara-400' : ''
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-5 pt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60">
                        <p>{faq.answer}</p>
                        {faq.hasPrivacyLink && (
                          <div className="mt-3">
                            <button
                              onClick={onOpenPrivacy}
                              className="text-xs font-bold text-lochmara-600 dark:text-lochmara-400 hover:text-lochmara-700 dark:hover:text-lochmara-300 underline underline-offset-4 cursor-pointer"
                            >
                              Ver texto completo de Habeas Data
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
