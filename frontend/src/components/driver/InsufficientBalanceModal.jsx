import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, X, AlertCircle, ArrowRight, PlusCircle } from 'lucide-react';

export const InsufficientBalanceModal = ({
  isOpen,
  onClose,
  currentBalance = 0,
  minRequired = 2000,
  onGoToRecharge,
}) => {
  if (!isOpen) return null;

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
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Saldo Insuficiente</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Para publicar un nuevo trayecto, tu billetera de conductor debe contar con un saldo mínimo disponible de{' '}
            <strong className="text-slate-900">$ {minRequired.toLocaleString('es-CO')} COP</strong> para respaldar la comisión del servicio.
          </p>

          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
            <div className="flex items-center justify-between font-bold">
              <span>Tu Saldo Actual:</span>
              <span className={currentBalance <= 0 ? 'text-rose-600' : 'text-amber-800'}>
                $ {currentBalance.toLocaleString('es-CO')} COP
              </span>
            </div>
            <p className="text-[11px] text-amber-800 leading-tight">
              Recarga tu saldo fácilmente con Nequi, PSE o Bancolombia para continuar publicando viajes.
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onGoToRecharge();
              }}
              className="flex-1 py-2.5 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-lochmara-600/20"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Recargar Saldo</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
