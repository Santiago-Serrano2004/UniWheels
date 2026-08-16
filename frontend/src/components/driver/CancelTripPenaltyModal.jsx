import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ShieldAlert, ArrowRight, DollarSign } from 'lucide-react';

export const CancelTripPenaltyModal = ({
  isOpen,
  onClose,
  onConfirmCancel,
  passengersCount = 0,
  currentBalance = 0,
  penaltyAmount = 3000,
}) => {
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
          className="w-full max-w-[320px] max-h-[85vh] bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 overflow-y-auto text-slate-900 mx-auto space-y-4"
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  hasPassengers ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                }`}
              >
                {hasPassengers ? <AlertTriangle className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              </div>
              <h3 className="text-xs font-bold text-slate-900">
                {hasPassengers ? 'Penalización por Cancelación' : 'Cancelar Publicación'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mensaje descriptivo */}
          {hasPassengers ? (
            <div className="space-y-2.5">
              <p className="text-xs text-slate-600 leading-relaxed">
                Tienes <strong className="text-slate-900">{passengersCount} estudiante(s) confirmado(s)</strong> en este trayecto.
              </p>

              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-rose-600" />
                  <span>Cobro de Penalización: $ {penaltyAmount.toLocaleString('es-CO')} COP</span>
                </p>
                <p className="text-[11px] text-rose-800 leading-tight">
                  La cancelación dejará a los estudiantes sin cupo. Esta tarifa se descontará automáticamente de tu billetera de conductor y afectará tu calificación.
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] px-1 text-slate-500">
                <span>Saldo actual: ${currentBalance.toLocaleString('es-CO')}</span>
                <span className="font-bold text-rose-600">
                  Nuevo: ${Math.max(0, currentBalance - penaltyAmount).toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-600 leading-relaxed">
              ¿Estás seguro de cancelar este viaje? Aún no tienes pasajeros asignados, por lo que <strong>no se aplicará ninguna penalización</strong> a tu cuenta.
            </p>
          )}

          {/* Botones de Acción */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
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
                  : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'
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
