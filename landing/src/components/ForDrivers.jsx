import React from 'react';
import { motion } from 'framer-motion';
import { Car, IdCard, FileBadge, CheckCircle, UploadCloud, UserCheck, Award } from 'lucide-react';

export const ForDrivers = () => {
  const requirements = [
    {
      title: 'Pertenencia institucional activa',
      description: 'Ser estudiante regular, docente o colaborador de la UNAB con correo institucional.',
      icon: IdCard,
    },
    {
      title: 'Vehículo en óptimas condiciones',
      description: 'Carro o motocicleta en buen estado para garantizar traslados cómodos y seguros.',
      icon: Car,
    },
    {
      title: 'Licencia de conducción al día',
      description: 'Categoría correspondiente vigente y sin suspensiones activas en el RUNT.',
      icon: CheckCircle,
    },
    {
      title: 'SOAT y Tecnomecánica vigentes',
      description: 'Seguro Obligatorio de Accidentes de Tránsito al día y Certificado RTM (si aplica por año).',
      icon: FileBadge,
    },
  ];

  const approvalSteps = [
    {
      step: 1,
      title: '1. Carga digital en la app',
      description: 'Sube fotos claras de tus documentos y la placa del vehículo desde la sección de registro.',
      icon: UploadCloud,
    },
    {
      step: 2,
      title: '2. Revisión de Bienestar Universitario',
      description: 'El equipo institucional valida la veracidad y vigencia de la información ingresada.',
      icon: UserCheck,
    },
    {
      step: 3,
      title: '3. Activación y publicación de rutas',
      description: 'Una vez aprobado, publicas tus recorridos y empiezas a compartir gastos de combustible.',
      icon: Award,
    },
  ];

  return (
    <section id="conductores" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs uppercase font-bold tracking-widest text-lochmara-600 dark:text-lochmara-400 mb-3">
            Comunidad al volante
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            ¿Quieres ser conductor UniWheels?
          </h3>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            Comparte tus asientos vacíos, conoce a compañeros de tu misma sede y reduce tus costos mensuales de combustible y peajes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Requisitos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Requisitos para postularte
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Para garantizar la máxima seguridad en los desplazamientos universitarios, solicitamos:
            </p>

            <div className="space-y-4">
              {requirements.map((req) => {
                const Icon = req.icon;
                return (
                  <div
                    key={req.title}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-xl bg-lochmara-50 dark:bg-lochmara-950 flex items-center justify-center text-lochmara-600 dark:text-lochmara-400 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                        {req.title}
                      </h5>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {req.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Proceso de Aprobación */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-lochmara-900 via-slate-900 to-slate-950 text-white border border-lochmara-800/40 shadow-xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lochmara-500/20 border border-lochmara-400/30 text-lochmara-300 text-xs font-semibold mb-4">
              <Award className="w-4 h-4 text-lochmara-400" />
              <span>Proceso transparente</span>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">
              ¿Cómo se aprueba tu solicitud?
            </h4>
            <p className="text-sm text-slate-300 mb-8">
              Tu postulación se gestiona en 3 fases organizadas antes de tu primer viaje:
            </p>

            <div className="space-y-6">
              {approvalSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-lochmara-600/30 border border-lochmara-500/40 flex items-center justify-center text-lochmara-300 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-base font-bold text-white">
                        {step.title}
                      </h5>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-400 text-center">
              Acreditación respaldada por la Universidad Autónoma de Bucaramanga.
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
