import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useAppStore } from '../../store/useAppStore';
import {
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  X,
  CreditCard,
  Copy,
  Check,
  Receipt,
  Loader2,
  Clock,
} from 'lucide-react';

export const TripSettlementModal = ({
  isOpen,
  onClose,
  trip = null,
  onConfirmSettlement,
  onReportIncident,
  isProcessing = false,
  errorMessage = '',
}) => {
  const { theme, user } = useAppStore();
  const isDark = theme === 'dark';
  const [numeroCopiado, setNumeroCopiado] = useState(false);

  if (!isOpen) return null;

  const totalRecaudado = trip?.fare_cop || trip?.price || 5800;
  const comisionPlataforma = trip?.platform_commission_cop || Math.round(totalRecaudado * 0.12);
  const gananciaNetaConductor = trip?.earnings_cop || (totalRecaudado - comisionPlataforma);

  // trip.payment_method (backend real, snake_case) siempre tiene prioridad
  // sobre trip.paymentMethod (dato local heredado del store de Zustand).
  const metodoPago = trip?.payment_method || trip?.paymentMethod || 'nequi_directo';
  const esPagoConTarjeta = metodoPago === 'tarjeta' || metodoPago === 'card_instant';
  const pagoConTarjetaConfirmado = Boolean(trip?.payment_confirmed_at);
  const numeroPagoDirecto = (user?.phone_number || user?.phone || '').replace(/\D/g, '');

  const copiarNumero = () => {
    if (navigator.clipboard && numeroPagoDirecto) {
      navigator.clipboard.writeText(numeroPagoDirecto);
      setNumeroCopiado(true);
      setTimeout(() => setNumeroCopiado(false), 2000);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 select-none backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={`relative w-full max-w-[340px] max-h-[88vh] rounded-3xl p-5 shadow-2xl border flex flex-col mx-auto space-y-3.5 overflow-hidden transition-colors ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Cabecera de Liquidación */}
          <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                  isDark
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Liquidación del Viaje</h3>
                <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Llegada a Campus UNAB</p>
              </div>
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

          {/* Pago P2P (Nequi/Daviplata/Efectivo): QR real con el número del conductor */}
          {!esPagoConTarjeta && numeroPagoDirecto && (
            <div
              className={`p-3 border rounded-2xl flex flex-col items-center justify-center space-y-2 text-center ${
                isDark
                  ? 'bg-slate-950 border-purple-900/40'
                  : 'bg-purple-50/70 border-purple-200/80'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400">
                <Smartphone className="w-3.5 h-3.5 text-purple-500" />
                <span>Cobro Directo Nequi / Daviplata</span>
              </div>

              <div className="w-28 h-28 bg-white p-2 rounded-xl border border-purple-200 shadow-2xs flex items-center justify-center">
                <QRCodeSVG value={numeroPagoDirecto} size={96} />
              </div>

              <div className="space-y-1">
                <p className={`text-[11px] font-black ${isDark ? 'text-white' : 'text-purple-950'}`}>
                  Monto a Transferir: $ {totalRecaudado.toLocaleString('es-CO')} COP
                </p>
                <button
                  type="button"
                  onClick={copiarNumero}
                  className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-purple-200 dark:border-purple-900/40 cursor-pointer"
                >
                  <span>{user?.phone_number || user?.phone}</span>
                  {numeroCopiado ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                </button>
                <p className="text-[9px] text-slate-400 leading-tight">
                  El pasajero escanea o copia tu número para transferirte directo.
                </p>
              </div>
            </div>
          )}

          {/* Pago con tarjeta: estado real de confirmación de Wompi */}
          {esPagoConTarjeta && (
            <div
              className={`p-3 border rounded-2xl flex items-center gap-2.5 ${
                pagoConTarjetaConfirmado
                  ? isDark ? 'bg-slate-950 border-emerald-900/40' : 'bg-emerald-50/70 border-emerald-200/80'
                  : isDark ? 'bg-slate-950 border-amber-900/40' : 'bg-amber-50/70 border-amber-200/80'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                pagoConTarjetaConfirmado ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
              }`}>
                {pagoConTarjetaConfirmado ? <CreditCard className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs font-bold">
                  {pagoConTarjetaConfirmado ? 'Pago con tarjeta confirmado' : 'Esperando confirmación del pago'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {pagoConTarjetaConfirmado
                    ? 'El pasajero ya pagó a través de la plataforma.'
                    : 'El pasajero debe completar el pago con tarjeta antes de finalizar.'}
                </p>
              </div>
            </div>
          )}

          {/* Desglose Financiero */}
          <div
            className={`border rounded-2xl p-3 space-y-2 text-xs ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Aporte del Pasajero:</span>
              <strong className={`font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>$ {totalRecaudado.toLocaleString('es-CO')} COP</strong>
            </div>

            <div className="flex items-center justify-between text-rose-500">
              <span className="flex items-center gap-1">
                <span>Comisión UniWheels (12%):</span>
              </span>
              <strong>- $ {comisionPlataforma.toLocaleString('es-CO')} COP</strong>
            </div>

            <div className={`pt-2 border-t flex items-center justify-between text-emerald-400 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className="font-extrabold text-[11px]">Tu Ganancia Neta:</span>
              <strong className="text-sm font-black">$ {gananciaNetaConductor.toLocaleString('es-CO')} COP</strong>
            </div>

            {!esPagoConTarjeta && (
              <p className="text-[9px] text-slate-400 leading-tight pt-1">
                * La comisión de $ {comisionPlataforma.toLocaleString('es-CO')} COP se descuenta de tu saldo prepago en la plataforma.
              </p>
            )}
          </div>

          {errorMessage && (
            <p className="text-[11px] font-semibold text-rose-500 text-center px-1">{errorMessage}</p>
          )}

          {/* Botones de Confirmación o Reporte de Incidente */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={onConfirmSettlement}
              disabled={isProcessing || (esPagoConTarjeta && !pagoConTarjetaConfirmado)}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Finalizando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Pago Recibido ($ {totalRecaudado.toLocaleString('es-CO')})</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onReportIncident}
              className={`w-full py-2 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                isDark
                  ? 'bg-slate-950 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border-slate-800 hover:border-rose-500/30'
                  : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border-slate-200 hover:border-rose-200'
              }`}
            >
              Reportar Pasajero No Pagó
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
