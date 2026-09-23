import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Home, Building2, Clock, MapPin, Compass } from 'lucide-react';

export const Modalities = () => {
  const modalities = [
    {
      title: 'Hacia el campus',
      badge: 'Llegada a clase',
      description: 'Encuentra compañeros que viajan desde tu barrio o municipio cercano hacia tu campus universitario en horarios de la mañana y la tarde.',
      icon: GraduationCap,
      highlights: ['Horarios flexibles matutinos', 'Puntos de encuentro cercanos', 'Llega a tiempo a tus clases'],
      color: 'lochmara',
    },
    {
      title: 'Desde el campus',
      badge: 'Regreso seguro',
      description: 'Vuelve a casa de forma cómoda y protegida al terminar tu jornada académica o laboral, evitando las aglomeraciones del transporte público.',
      icon: Home,
      highlights: ['Salidas desde la puerta del campus', 'Viajes nocturnos seguros', 'Rutas directas a tu sector'],
      color: 'sky',
    },
    {
      title: 'Entre sedes UNAB',
      badge: 'Interconexión universitaria',
      description: 'Conéctate de manera ágil entre los diferentes campus (El Jardín, El Bosque, CSU) para tus prácticas de laboratorio, talleres o eventos.',
      icon: Building2,
      highlights: ['Campus El Jardín', 'Campus El Bosque (Salud)', 'Centro de Servicios Universitarios (CSU)'],
      color: 'indigo',
    },
  ];

  return (
    <section id="modalidades" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs uppercase font-bold tracking-widest text-lochmara-600 dark:text-lochmara-400 mb-3">
            Opciones de viaje
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Modalidades para cada momento
          </h3>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            Adaptado a la rutina universitaria y a las necesidades de desplazamiento de toda la comunidad UNAB.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {modalities.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-lochmara-50 dark:bg-lochmara-950 flex items-center justify-center text-lochmara-600 dark:text-lochmara-400">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {item.badge}
                    </span>
                  </div>

                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    {item.title}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  {item.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-lochmara-500 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
