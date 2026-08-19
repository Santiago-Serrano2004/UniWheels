import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { ShieldCheck, Car, ArrowRight, CheckCircle2, X, Navigation, Wallet } from 'lucide-react';

export const DriverApprovedCelebrationModal = ({ isOpen, onClose, onGoToDriver }) => {
  const { user, theme } = useAppStore();
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const vehicleInfo = user?.driverApplication || user?.driverInfo || {};
  const plateNumber = vehicleInfo.plate_number || user?.vehicle?.plate_number || 'Vehículo Verificado';
  const brandModel = vehicleInfo.brand && vehicleInfo.model_line
    ? `${vehicleInfo.brand} ${vehicleInfo.model_line}`
    : 'Automotor Registrado';
  const seats = vehicleInfo.available_seats || user?.vehicle?.available_seats || 3;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 20 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full max-w-[340px] max-h-[90vh] rounded-3xl p-5 shadow-2xl border flex flex-col items-center text-center overflow-y-auto mx-auto space-y-4 my-auto transition-colors ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Botón flotante para cerrar */}
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors cursor-pointer ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700'
            }`}
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icono de Verificación Aprobada */}
          <div className="relative mt-1">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white dark:border-slate-900">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Insignia y Títulos */}
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              Verificación Aprobada
            </span>
            <h3 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              ¡Ya eres Conductor UniWheels!
            </h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Tu vehículo y documentación han sido validados exitosamente por el equipo de administración.
            </p>
          </div>

          {/* Ficha del Vehículo Habilitado */}
          <div className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-left space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-lochmara-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{brandModel}</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-lochmara-500/10 text-lochmara-600 dark:text-lochmara-400 font-mono text-xs font-black">
                {plateNumber.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
              <span>Capacidad habilitada:</span>
              <strong className="text-slate-700 dark:text-slate-200">{seats} cupos</strong>
            </div>
          </div>

          {/* Lista de Capacidades Habilitadas */}
          <div className="w-full space-y-2 text-left text-xs">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-lg bg-lochmara-500/10 text-lochmara-500 flex items-center justify-center shrink-0 mt-0.5">
                <Navigation className="w-3 h-3" />
              </div>
              <p className={`text-[11px] leading-tight ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Publica recorridos hacia o desde tu campus universitario en cualquier momento.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                <Wallet className="w-3 h-3" />
              </div>
              <p className={`text-[11px] leading-tight ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Recibe los aportes de tus pasajeros de forma automática en tu saldo.
              </p>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="w-full space-y-2 pt-1">
            <button
              type="button"
              onClick={onGoToDriver}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Ir al Panel de Conductor</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`w-full py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                isDark
                  ? 'border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
