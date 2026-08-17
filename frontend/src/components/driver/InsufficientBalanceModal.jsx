import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { Wallet, X, PlusCircle } from 'lucide-react';

export const InsufficientBalanceModal = ({
  isOpen,
  onClose,
  currentBalance = 0,
  minRequired = 2000,
  onGoToRecharge,
}) => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  if (!isOpen) return null;

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
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <h3 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Saldo Insuficiente</h3>
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

          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Para publicar un nuevo trayecto, tu billetera de conductor debe contar con un saldo mínimo disponible de{' '}
            <strong className={isDark ? 'text-white' : 'text-slate-900'}>$ {minRequired.toLocaleString('es-CO')} COP</strong> para respaldar la comisión del servicio.
          </p>

          <div
            className={`p-3 rounded-2xl border text-xs space-y-1 ${
              isDark
                ? 'bg-slate-950 border-amber-900/40 text-slate-200'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span>Tu Saldo Actual:</span>
              <span className={currentBalance <= 0 ? 'text-rose-500' : 'text-amber-500'}>
                $ {currentBalance.toLocaleString('es-CO')} COP
              </span>
            </div>
            <p className={`text-[11px] leading-tight ${isDark ? 'text-slate-400' : 'text-amber-800'}`}>
              Recarga tu saldo fácilmente con Nequi, PSE o Bancolombia para continuar publicando viajes.
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2.5 rounded-2xl border text-xs font-semibold transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
              }`}
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
