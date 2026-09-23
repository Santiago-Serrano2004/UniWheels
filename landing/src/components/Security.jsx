import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, AlertTriangle, FileBadge2, DatabaseZap, CheckCircle } from 'lucide-react';

export const Security = ({ onOpenPrivacy }) => {
  const securityFeatures = [
    {
      title: 'Comunidad UNAB 100% verificada',
      description: 'El acceso a la plataforma es exclusivo para estudiantes, docentes y personal con correo institucional activo (@unab.edu.co). Cero perfiles anónimos o externos.',
      icon: ShieldCheck,
    },
    {
      title: 'Código PIN de abordaje seguro',
      description: 'Cada viaje genera un código de seguridad de 4 dígitos. El conductor debe digitarlo antes de arrancar para confirmar la identidad del pasajero y habilitar la ruta.',
      icon: Lock,
    },
    {
      title: 'Botón SOS con telemetría GPS en tiempo real',
      description: 'Función de emergencia integrada que transmite las coordenadas satelitales en vivo y la información del vehículo para asistencia inmediata.',
      icon: AlertTriangle,
    },
    {
      title: 'Auditoría documental por Bienestar Universitario',
      description: 'Todo conductor pasa por un proceso de revisión humana de su licencia de conducción, SOAT vigente y certificación técnico-mecánica antes de ser habilitado.',
      icon: FileBadge2,
    },
    {
      title: 'Privacidad y Habeas Data (Ley 1581 de 2012)',
      description: 'Protección estricta de tus datos personales. Coordenadas y trayectorias cifradas, con cero venta de información a terceros y derecho permanente de rectificación.',
      icon: DatabaseZap,
      hasAction: true,
    },
  ];

  return (
    <section id="seguridad" className="py-20 md:py-28 bg-slate-100/70 dark:bg-slate-900/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Seguridad garantizada</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Tu tranquilidad es nuestra prioridad
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            Diseñamos múltiples capas de protección técnica, institucional y legal para que viajes con total confianza.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityFeatures.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className={`rounded-3xl p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between ${
                  index === 4 ? 'md:col-span-2 lg:col-span-2' : ''
                }`}
              >
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-lochmara-600 dark:text-lochmara-400 mb-5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    {item.title}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {item.hasAction && (
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Ley Estatutaria 1581 de 2012
                    </span>
                    <button
                      onClick={onOpenPrivacy}
                      className="text-xs font-bold text-lochmara-600 dark:text-lochmara-400 hover:text-lochmara-700 dark:hover:text-lochmara-300 underline underline-offset-4 cursor-pointer"
                    >
                      Consultar política de datos
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
