import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  Clock,
  Car,
  Bike,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const CancelTripModal = ({
  isOpen,
  onClose,
  onConfirm,
  tripInfo = {},
}) => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  // Paso 1: 'confirm' (¿Estás seguro?), Paso 2: 'refund_info' (Información de reembolso o confirmación final)
  const [step, setStep] = useState('confirm');

  // Resetear al paso 1 cuando se abra el modal
  useEffect(() => {
    if (isOpen) {
      setStep('confirm');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const driverName = tripInfo.driverName || 'Carlos Mendoza';
  const vehicle = tripInfo.vehicle || 'Mazda 3 (Rojo)';
  const plate = tripInfo.plate || 'KLU-492';
  const etaMinutes = tripInfo.etaMinutes || 4;
  const paymentMethod = tripInfo.paymentMethod || 'nequi_direct';
  const rawFare = tripInfo.fare || 4500;
  const formattedFare = typeof rawFare === 'number'
    ? `$ ${rawFare.toLocaleString('es-CO')} COP`
    : String(rawFare);

  const isCardPayment = paymentMethod === 'card' || paymentMethod === 'credit_card' || paymentMethod === 'tarjeta';
  const isCashPayment = paymentMethod === 'cash' || paymentMethod === 'efectivo';
  const isNequiPayment = paymentMethod === 'nequi_direct' || paymentMethod === 'nequi';

  const handleProceedCancellation = () => {
    // Pasar directamente a la pantalla de resultado / reembolso antes de cerrar
    setStep('refund_info');
  };

  const handleFinalClose = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none pointer-events-auto">
        {/* Fondo con desenfoque completo que cubre toda la pantalla */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={step === 'confirm' ? onClose : handleFinalClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Contenido del Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className={`relative w-full max-w-md rounded-3xl p-5 shadow-2xl border transition-colors z-10 ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Botón Cerrar */}
          <button
            type="button"
            onClick={step === 'confirm' ? onClose : handleFinalClose}
            className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>

          {step === 'confirm' ? (
            /* =========================================================
               PASO 1: CONFIRMACIÓN ("¿ESTÁS SEGURO?")
               ========================================================= */
            <div className="space-y-4">
              {/* Cabecera con Icono de Advertencia */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black leading-tight">
                    ¿Estás seguro de cancelar?
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tu conductor ya está en camino a tu recogida
                  </p>
                </div>
              </div>

              {/* Tarjeta del Conductor y Estado en Vivo */}
              <div
                className={`p-3.5 rounded-2xl border space-y-2.5 ${
                  isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {/* Conductor y Vehículo */}
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-black truncate">{driverName}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {vehicle} • <span className="font-mono font-bold text-slate-300 dark:text-slate-200">{plate}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-bold shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>A ~{etaMinutes} min</span>
                  </div>
                </div>

                {/* Método de Pago Asociado */}
                <div className={`pt-2 border-t flex items-center justify-between text-xs ${isDark ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-600'}`}>
                  <span className="text-[11px] font-medium flex items-center gap-1.5">
                    {isCardPayment ? (
                      <CreditCard className="w-3.5 h-3.5 text-lochmara-500" />
                    ) : isNequiPayment ? (
                      <Smartphone className="w-3.5 h-3.5 text-purple-500" />
                    ) : (
                      <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    <span>Método de pago:</span>
                  </span>

                  <span className="font-bold text-[11px]">
                    {isCardPayment
                      ? 'Tarjeta Débito/Crédito'
                      : isNequiPayment
                      ? 'Nequi Directo'
                      : 'Efectivo al abordar'}
                  </span>
                </div>
              </div>

              {/* Mensaje Informativo según Método de Pago */}
              <div
                className={`p-3 rounded-2xl text-xs leading-relaxed border ${
                  isCardPayment
                    ? isDark
                      ? 'bg-lochmara-950/40 border-lochmara-800/60 text-lochmara-200'
                      : 'bg-lochmara-50 border-lochmara-200 text-lochmara-900'
                    : isDark
                    ? 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                {isCardPayment ? (
                  <p>
                    <strong>Pago con Tarjeta:</strong> Al confirmar la cancelación, se te reembolsará el dinero a tu método de pago.
                  </p>
                ) : (
                  <p>
                    <strong>Sin cobro previo:</strong> Al estar seleccionado pago en efectivo o Nequi al abordar, la reserva se cancelará sin ningún cobro en tu cuenta.
                  </p>
                )}
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                  }`}
                >
                  Mantener mi viaje
                </button>

                <button
                  type="button"
                  onClick={handleProceedCancellation}
                  className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-black transition-all shadow-md shadow-rose-600/25 cursor-pointer border border-rose-500"
                >
                  Sí, cancelar viaje
                </button>
              </div>
            </div>
          ) : (
            /* =========================================================
               PASO 2: POP-UP DE REEMBOLSO / RESULTADO DE CANCELACIÓN
               ========================================================= */
            <div className="space-y-4 text-center py-2">
              {/* Icono de Resultado */}
              <div className="mx-auto w-14 h-14 rounded-3xl bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/10">
                {isCardPayment ? (
                  <CreditCard className="w-7 h-7" />
                ) : (
                  <CheckCircle2 className="w-7 h-7" />
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black">
                  {isCardPayment ? 'Reembolso en Trámite' : 'Viaje Cancelado Exitosamente'}
                </h3>
                <p className="text-xs text-slate-400">
                  Tu cupo ha sido liberado para la comunidad UNAB
                </p>
              </div>

              {/* Cuadro de Información de Reembolso */}
              <div
                className={`p-4 rounded-2xl border text-left space-y-2 text-xs leading-relaxed ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {isCardPayment ? (
                  <>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 dark:border-slate-800">
                      <span className="text-slate-400">Monto a Reembolsar:</span>
                      <strong className="text-emerald-500 font-black text-sm">{formattedFare}</strong>
                    </div>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                      Se te reembolsará el dinero a tu método de pago registrado en un plazo estimado de <strong>1 a 3 días hábiles</strong>.
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Ref: UNAB-REF-{Date.now().toString().slice(-6)}
                    </p>
                  </>
                ) : (
                  <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    No se ha realizado ningún cobro ya que tu método seleccionado no requería débito anticipado.
                  </p>
                )}
              </div>

              {/* Botón Entendido */}
              <button
                type="button"
                onClick={handleFinalClose}
                className="w-full py-3 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-black transition-all shadow-md shadow-lochmara-600/25 cursor-pointer border border-lochmara-500"
              >
                Entendido
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
