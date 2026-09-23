import React from 'react';
import { motion } from 'framer-motion';
import { MailCheck, Search, KeyRound, FileCheck2, Route, CheckCircle2, User, Car } from 'lucide-react';

export const HowItWorks = () => {
  const passengerSteps = [
    {
      step: '01',
      title: 'Registro institucional',
      description: 'Crea tu cuenta con tu correo institucional UNAB (@unab.edu.co). Validamos tu identidad para que viajes siempre en un entorno confiable.',
      icon: MailCheck,
    },
    {
      step: '02',
      title: 'Busca tu ruta',
      description: 'Explora rutas publicadas por conductores de tu misma sede o programa. Selecciona tu punto de recogida y reserva tu cupo en segundos.',
      icon: Search,
    },
    {
      step: '03',
      title: 'Viaja con PIN de abordaje',
      description: 'Al subir al vehículo, entrega tu código PIN de 4 dígitos al conductor para iniciar el viaje. El cobro se procesa de forma digital.',
      icon: KeyRound,
    },
  ];

  const driverSteps = [
    {
      step: '01',
      title: 'Validación de documentos',
      description: 'Registra tu vehículo y adjunta tu licencia, SOAT y revisión técnico-mecánica vigente. El equipo de Bienestar Universitario valida tu solicitud.',
      icon: FileCheck2,
    },
    {
      step: '02',
      title: 'Publica tus recorridos',
      description: 'Define tu origen, destino universitario, hora de salida y cupos disponibles. El sistema empareja automáticamente con compañeros de ruta.',
      icon: Route,
    },
    {
      step: '03',
      title: 'Confirma y comparte gastos',
      description: 'Digita el PIN de cada pasajero al abordar para activar el trayecto y recibe las compensaciones de combustible directamente en tu saldo.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section id="como-funciona" className="py-20 md:py-28 bg-slate-100/70 dark:bg-slate-900/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs uppercase font-bold tracking-widest text-lochmara-600 dark:text-lochmara-400 mb-3">
            Paso a paso
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            ¿Cómo funciona UniWheels?
          </h3>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            Una experiencia diseñada para que moverte hacia y desde la universidad sea rápido, económico y seguro.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Columna Pasajero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center gap-3 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-lochmara-100 dark:bg-lochmara-950 flex items-center justify-center text-lochmara-600 dark:text-lochmara-400">
                <User className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-lochmara-600 dark:text-lochmara-400">
                  Experiencia
                </span>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">Para el Pasajero</h4>
              </div>
            </div>

            <div className="mt-8 space-y-8">
              {passengerSteps.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-lochmara-600 dark:text-lochmara-400 shrink-0 font-bold text-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-lochmara-600 dark:text-lochmara-400">
                          Paso {item.step}
                        </span>
                        <h5 className="text-base font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h5>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Columna Conductor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center gap-3 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  Experiencia
                </span>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">Para el Conductor</h4>
              </div>
            </div>

            <div className="mt-8 space-y-8">
              {driverSteps.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 font-bold text-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                          Paso {item.step}
                        </span>
                        <h5 className="text-base font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h5>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
