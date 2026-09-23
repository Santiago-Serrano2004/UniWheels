import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedLogo } from './common/AnimatedLogo';
import { ArrowDown, Smartphone, ShieldCheck, Users, Sparkles } from 'lucide-react';

export const Hero = () => {
  return (
    <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
      {/* Fondos degradados decorativos con tokens de la marca */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-lochmara-500/10 dark:bg-lochmara-500/15 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-sky-400/10 dark:bg-sky-400/10 blur-2xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Badge de comunidad */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lochmara-50 dark:bg-lochmara-950/60 border border-lochmara-200 dark:border-lochmara-800 text-lochmara-700 dark:text-lochmara-300 text-xs font-semibold mb-6 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-lochmara-600 dark:text-lochmara-400" />
            <span>Carpooling exclusivo para la comunidad UNAB</span>
          </motion.div>

          {/* Logotipo Animado */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-full max-w-[280px] sm:max-w-[340px] md:max-w-[380px] mb-8"
          >
            <div className="p-4 rounded-3xl bg-slate-900 shadow-2xl border border-slate-800">
              <AnimatedLogo isStatic={false} className="w-full h-auto" />
            </div>
          </motion.div>

          {/* Titular Principal */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mb-6"
          >
            Viaja a la U con tu{' '}
            <span className="bg-gradient-to-r from-lochmara-600 via-sky-500 to-lochmara-500 bg-clip-text text-transparent">
              comunidad
            </span>
          </motion.h1>

          {/* Subtítulo */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-10 leading-relaxed font-normal"
          >
            Conectamos a estudiantes, docentes y colaboradores de la UNAB para compartir rutas seguras, reducir gastos de transporte y cuidar el medio ambiente.
          </motion.p>

          {/* Botones de Acción */}
          <motion.div
            id="descargar"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-full flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
          >
            <a
              href="#como-funciona"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-lochmara-600 hover:bg-lochmara-700 active:bg-lochmara-800 text-white font-semibold text-sm transition-all shadow-lg shadow-lochmara-600/25"
            >
              <span>Cómo funciona</span>
              <ArrowDown className="w-4 h-4" />
            </a>

            <div className="w-full sm:w-auto flex flex-col items-center">
              <button
                disabled
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-sm cursor-not-allowed opacity-80 border border-slate-300 dark:border-slate-700"
              >
                <Smartphone className="w-4 h-4" />
                <span>Descargar la app</span>
                <span className="ml-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  Próximamente
                </span>
              </button>
            </div>
          </motion.div>

          {/* Badges de Tiendas en estado Próximamente */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs opacity-75">
              <Smartphone className="w-5 h-5 text-slate-400" />
              <div className="text-left">
                <div className="text-[10px] uppercase font-medium text-slate-400 dark:text-slate-500 leading-tight">
                  Disponible pronto en
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">
                  Google Play Store
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs opacity-75">
              <Smartphone className="w-5 h-5 text-slate-400" />
              <div className="text-left">
                <div className="text-[10px] uppercase font-medium text-slate-400 dark:text-slate-500 leading-tight">
                  Disponible pronto en
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">
                  Apple App Store
                </div>
              </div>
            </div>
          </motion.div>

          {/* Estadísticas / Valores Clave */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-14 pt-8 border-t border-slate-200 dark:border-slate-800/80"
          >
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-lochmara-50 dark:bg-lochmara-950 flex items-center justify-center text-lochmara-600 dark:text-lochmara-400 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900 dark:text-white">100% UNAB</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Comunidad universitaria verificada</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900 dark:text-white">PIN de abordaje</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Validación de viaje segura</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900 dark:text-white">Billetera Wompi</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Pagos 100% digitales sin efectivo</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
