import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { tripsService } from '../../services/api';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const WalletView = () => {
  const { driverWalletBalance, rechargeDriverWallet, theme } = useAppStore();

  const isDark = theme === 'dark';
  const [montoRecarga, setMontoRecarga] = useState(20000);
  const [metodoPago, setMetodoPago] = useState('nequi');
  const [mensajeExito, setMensajeExito] = useState('');
  const [estaProcesando, setEstaProcesando] = useState(false);
  const [historialMovimientos, setHistorialMovimientos] = useState([]);

  useEffect(() => {
    tripsService.getWalletTransactions().then((res) => {
      if (res && res.transactions) {
        setHistorialMovimientos(res.transactions);
      }
    });
  }, []);

  const ejecutarRecarga = (e) => {
    e.preventDefault();
    setEstaProcesando(true);
    setTimeout(() => {
      rechargeDriverWallet(montoRecarga);
      setEstaProcesando(false);
      setMensajeExito(`¡Recarga exitosa de $ ${montoRecarga.toLocaleString('es-CO')} COP mediante ${metodoPago.toUpperCase()} acreditada a tu saldo UniWheels!`);
      setTimeout(() => setMensajeExito(''), 4000);
    }, 1000);
  };

  return (
    <div className="space-y-4 pb-6 select-none">
      {/* 1. TARJETA DE SALDO DE BILLETERA (SÓLIDA) */}
      <section
        className={`rounded-3xl p-5 shadow-md relative overflow-hidden space-y-4 border transition-colors ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold tracking-wide flex items-center gap-1.5 ${isDark ? 'text-lochmara-400' : 'text-lochmara-600'}`}>
              <Wallet className="w-3.5 h-3.5" />
              <span>Billetera de Conductor</span>
            </span>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Prepago Seguro</span>
            </div>
          </div>

          <div>
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Saldo Disponible (Prepago / Ganancias)</span>
            <h2 className={`text-3xl font-extrabold tracking-tight mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              $ {driverWalletBalance.toLocaleString('es-CO')} <span className={`text-sm font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>COP</span>
            </h2>
          </div>

          <div
            className={`p-2.5 rounded-2xl border text-[11px] leading-snug ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            {driverWalletBalance >= 2000 ? (
              <span className="text-emerald-500 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Tu saldo es suficiente para publicar nuevos trayectos (Mínimo $ 2.000 COP).</span>
              </span>
            ) : (
              <span className="text-rose-500 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Saldo bajo. Recarga para habilitar la publicación de nuevos trayectos.</span>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 2. MENSAJE DE ÉXITO */}
      {mensajeExito && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-start gap-2.5 shadow-2xs font-bold"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <p className="font-medium leading-relaxed">{mensajeExito}</p>
        </motion.div>
      )}

      {/* 3. RECARGA DE SALDO DIGITAL */}
      <section
        className={`rounded-3xl p-4 border space-y-3 transition-colors ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-white shadow-md'
            : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-900'}`}>
          Recargar Saldo
        </h3>

        <form onSubmit={ejecutarRecarga} className="space-y-3">
          {/* Montos rápidos */}
          <div className="grid grid-cols-3 gap-2">
            {[10000, 20000, 50000].map((monto) => (
              <button
                key={monto}
                type="button"
                onClick={() => setMontoRecarga(monto)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  montoRecarga === monto
                    ? 'bg-lochmara-600 text-white border-lochmara-600 shadow-xs'
                    : isDark
                    ? 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ${monto.toLocaleString('es-CO')}
              </button>
            ))}
          </div>

          {/* Selector de Método de Recarga */}
          <div className="space-y-1">
            <label className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Medio de Pago:</label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 'nequi', label: 'Nequi' },
                { id: 'pse', label: 'PSE' },
                { id: 'bancolombia', label: 'Bancolombia' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMetodoPago(m.id)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    metodoPago === m.id
                      ? isDark
                        ? 'bg-lochmara-600 text-white border-lochmara-600 shadow-xs'
                        : 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : isDark
                      ? 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={estaProcesando}
            className="w-full py-3 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-lochmara-600/20 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>
              {estaProcesando
                ? 'Procesando Recarga...'
                : `Recargar $ ${montoRecarga.toLocaleString('es-CO')} COP`}
            </span>
          </button>
        </form>
      </section>

      {/* 4. HISTORIAL DE MOVIMIENTOS */}
      <section className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Historial de Movimientos
        </h3>

        <div
          className={`rounded-2xl border divide-y overflow-hidden transition-colors ${
            isDark
              ? 'bg-slate-900 border-slate-800 divide-slate-800'
              : 'bg-white border-slate-200 divide-slate-100 shadow-sm'
          }`}
        >
          {historialMovimientos.map((tx) => (
            <div key={tx.id} className="p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                    tx.type === 'credit'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                  }`}
                >
                  {tx.type === 'credit' ? (
                    <ArrowDownRight className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className={`font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{tx.title}</p>
                  <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{tx.desc}</p>
                </div>
              </div>

              <span
                className={`font-extrabold ${
                  tx.type === 'credit' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {tx.amount}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
