import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  PlusCircle,
  ShieldCheck,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const WalletView = () => {
  const { driverWalletBalance, rechargeDriverWallet, user } = useAppStore();
  const [montoRecarga, setMontoRecarga] = useState(20000);
  const [metodoPago, setMetodoPago] = useState('nequi');
  const [mensajeExito, setMensajeExito] = useState('');
  const [estaProcesando, setEstaProcesando] = useState(false);

  const historialMovimientos = [
    {
      id: 'tx_1',
      title: 'Bono de Activación de Conductor',
      date: 'Hoy',
      amount: '+$ 25.000',
      type: 'credit',
      desc: 'Saldo inicial para publicación de rutas',
    },
  ];

  const ejecutarRecarga = (e) => {
    e.preventDefault();
    setEstaProcesando(true);
    setTimeout(() => {
      rechargeDriverWallet(montoRecarga);
      setEstaProcesando(false);
      setMensajeExito(`¡Recarga exitosa de $ ${montoRecarga.toLocaleString('es-CO')} COP mediante ${metodoPago.toUpperCase()}! Tu saldo ha sido actualizado.`);
      setTimeout(() => setMensajeExito(''), 4000);
    }, 1000);
  };

  return (
    <div className="space-y-4 pb-6 select-none">
      {/* 1. TARJETA DE SALDO DE BILLETERA DE CONDUCTOR */}
      <section className="bg-gradient-to-br from-[#082f49] via-slate-900 to-slate-950 text-white rounded-3xl p-5 shadow-md relative overflow-hidden space-y-4">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-lochmara-300 font-semibold tracking-wide flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" />
              <span>Billetera de Conductor</span>
            </span>
            <div className="flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/30 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Prepago Seguro</span>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-300">Saldo Disponible para Publicar</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white mt-0.5">
              $ {driverWalletBalance.toLocaleString('es-CO')} <span className="text-sm font-normal text-slate-400">COP</span>
            </h2>
          </div>

          <div className="p-2.5 bg-white/10 rounded-2xl border border-white/10 text-[11px] text-slate-300 leading-snug">
            {driverWalletBalance >= 2000 ? (
              <span className="text-emerald-300 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Tu saldo es suficiente para publicar nuevos trayectos (Mínimo $ 2.000 COP).</span>
              </span>
            ) : (
              <span className="text-rose-300 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
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
          className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 shadow-2xs"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="font-medium leading-relaxed">{mensajeExito}</p>
        </motion.div>
      )}

      {/* 3. RECARGA DE SALDO DIGITAL */}
      <section className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Recargar Saldo de Conductor
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
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ${monto.toLocaleString('es-CO')}
              </button>
            ))}
          </div>

          {/* Selector de Método de Pago */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600">Medio de Pago:</label>
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
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
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

        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-2xs overflow-hidden">
          {historialMovimientos.map((tx) => (
            <div key={tx.id} className="p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    tx.type === 'credit'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  {tx.type === 'credit' ? (
                    <ArrowDownRight className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-900 leading-tight">{tx.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{tx.desc}</p>
                </div>
              </div>

              <span
                className={`font-extrabold ${
                  tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
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
