import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { Car, X, ArrowRight, CheckCircle2 } from 'lucide-react';

export const DriverInviteModal = ({ isOpen, onClose, onRegister }) => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full max-w-[320px] max-h-[85vh] rounded-3xl p-5 shadow-2xl border flex flex-col items-center text-center overflow-y-auto mx-auto space-y-4 my-auto transition-colors ${
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

          {/* Icono Ilustrativo */}
          <div
            className={`w-14 h-14 rounded-3xl border flex items-center justify-center shadow-inner mt-1 ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-lochmara-400'
                : 'bg-lochmara-50 border-lochmara-200 text-lochmara-600'
            }`}
          >
            <Car className="w-7 h-7" />
          </div>

          {/* Título y Descripción */}
          <div className="space-y-1">
            <h3 className={`text-lg font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Activar Modo Conductor
            </h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Actualmente tu cuenta opera como <strong className={isDark ? 'text-white' : 'text-slate-700'}>Pasajero</strong>. Registra tu vehículo para publicar rutas y compartir gastos de gasolina.
            </p>
          </div>

          {/* Beneficios Clave */}
          <div
            className={`w-full space-y-2 p-3 rounded-2xl border text-left text-[11px] font-medium ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-300'
                : 'bg-slate-50 border-slate-200/80 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Ahorra hasta el 70% en tus gastos de viaje</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>100% estudiantes y docentes verificados</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Gana EcoPoints por huella de CO₂ mitigada</span>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="w-full flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-2xl border text-xs font-bold transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onRegister();
              }}
              className="flex-1 py-3 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-lochmara-600/25"
            >
              <span>Registrarme</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
