import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { AlertTriangle, X, ShieldAlert, DollarSign } from 'lucide-react';

export const CancelTripPenaltyModal = ({
  isOpen,
  onClose,
  onConfirmCancel,
  passengersCount = 0,
  currentBalance = 0,
  penaltyAmount = 3000,
}) => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const hasPassengers = passengersCount > 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={`w-full max-w-[320px] max-h-[85vh] rounded-3xl p-5 shadow-2xl border overflow-y-auto mx-auto space-y-4 transition-colors ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Cabecera */}
          <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  hasPassengers
                    ? isDark ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' : 'bg-rose-100 text-rose-600 border-rose-200'
                    : isDark ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-amber-100 text-amber-600 border-amber-200'
                }`}
              >
                {hasPassengers ? <AlertTriangle className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              </div>
              <h3 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {hasPassengers ? 'Penalización por Cancelación' : 'Cancelar Publicación'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className={`p-1 rounded-full transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mensaje descriptivo */}
          {hasPassengers ? (
            <div className="space-y-2.5">
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Tienes <strong className={isDark ? 'text-white' : 'text-slate-900'}>{passengersCount} estudiante(s) confirmado(s)</strong> en este trayecto.
              </p>

              <div
                className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                  isDark
                    ? 'bg-slate-950 border-rose-900/40 text-slate-200'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <p className="font-bold flex items-center gap-1.5 text-rose-500">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Cobro de Penalización: $ {penaltyAmount.toLocaleString('es-CO')} COP</span>
                </p>
                <p className={`text-[11px] leading-tight ${isDark ? 'text-slate-400' : 'text-rose-800'}`}>
                  La cancelación dejará a los estudiantes sin cupo. Esta tarifa se descontará automáticamente de tu billetera de conductor y afectará tu calificación.
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] px-1 text-slate-400">
                <span>Saldo actual: ${currentBalance.toLocaleString('es-CO')}</span>
                <span className="font-bold text-rose-500">
                  Nuevo: ${Math.max(0, currentBalance - penaltyAmount).toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          ) : (
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              ¿Estás seguro de cancelar este viaje? Aún no tienes pasajeros asignados, por lo que <strong className={isDark ? 'text-white' : 'text-slate-900'}>no se aplicará ninguna penalización</strong> a tu cuenta.
            </p>
          )}

          {/* Botones de Acción */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2.5 rounded-2xl border text-xs font-semibold transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              Mantener Viaje
            </button>

            <button
              type="button"
              onClick={() => {
                onConfirmCancel(hasPassengers);
                onClose();
              }}
              className={`flex-1 py-2.5 rounded-2xl text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md ${
                hasPassengers
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
                  : 'bg-lochmara-600 hover:bg-lochmara-500 shadow-lochmara-600/20'
              }`}
            >
              <span>{hasPassengers ? 'Pagar y Cancelar' : 'Sí, Cancelar'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
