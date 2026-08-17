import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import {
  CheckCircle2,
  AlertTriangle,
  QrCode,
  DollarSign,
  Receipt,
  Smartphone,
  ShieldCheck,
  X,
  CreditCard,
  Banknote,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

export const TripSettlementModal = ({
  isOpen,
  onClose,
  trip = null,
  onConfirmSettlement,
  onReportIncident,
}) => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const [reportandoNoPago, setReportandoNoPago] = useState(false);

  if (!isOpen) return null;

  const totalRecaudado = trip?.price || 5800;
  const comisionPlataforma = Math.round(totalRecaudado * 0.12); // 12%
  const gananciaNetaConductor = totalRecaudado - comisionPlataforma; // 88%

  const metodoPago = trip?.paymentMethod || 'nequi_direct';
  const esPagoDirecto = metodoPago === 'nequi_direct' || metodoPago === 'cash_direct';

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

          {/* Si es Pago Directo con QR (Nequi / Daviplata), mostrar QR de cobro */}
          {metodoPago === 'nequi_direct' && (
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

              {/* QR Ilustrativo */}
              <div className="w-28 h-28 bg-white p-2 rounded-xl border border-purple-200 shadow-2xs flex items-center justify-center">
                <QrCode className="w-24 h-24 text-slate-900" />
              </div>

              <div className="space-y-0.5">
                <p className={`text-[11px] font-black ${isDark ? 'text-white' : 'text-purple-950'}`}>
                  Monto a Transferir: $ {totalRecaudado.toLocaleString('es-CO')} COP
                </p>
                <p className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Número: <strong>315 892 4410</strong> (Carlos Mendoza)
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
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Aporte Pasajero (Santiago G.):</span>
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

            {esPagoDirecto && (
              <p className="text-[9px] text-slate-400 leading-tight pt-1">
                * La comisión de $ {comisionPlataforma.toLocaleString('es-CO')} COP se descuenta de tu saldo prepago en la plataforma.
              </p>
            )}
          </div>

          {/* Botones de Confirmación o Reporte de Incidente */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={onConfirmSettlement}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/25"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar Pago Recibido ($ {totalRecaudado.toLocaleString('es-CO')})</span>
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
