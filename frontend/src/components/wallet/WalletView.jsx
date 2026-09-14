import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { tripsService, authService, walletService } from '../../services/api';
import { openWompiWidget } from '../../utils/wompiWidget';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';

const ETIQUETAS_TRANSACCION = {
  recarga_nequi: 'Recarga Nequi',
  recarga_pse: 'Recarga PSE',
  recarga_tarjeta: 'Recarga con Tarjeta',
  cobro_comision_viaje: 'Comisión de Viaje',
  pago_recibido_billetera: 'Pago de Viaje (Tarjeta)',
  ajuste_administrativo: 'Ajuste Administrativo',
};

export const WalletView = () => {
  const { driverWalletBalance, setDriverWalletBalance, theme } = useAppStore();

  const isDark = theme === 'dark';
  const [montoRecarga, setMontoRecarga] = useState(20000);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [estaProcesando, setEstaProcesando] = useState(false);
  const [historialMovimientos, setHistorialMovimientos] = useState([]);
  const [cargandoSaldo, setCargandoSaldo] = useState(true);

  const cargarSaldoYMovimientos = useCallback(async () => {
    const [perfil, transacciones] = await Promise.all([
      authService.me(),
      tripsService.getWalletTransactions(),
    ]);
    if (perfil?.wallet?.balance_cop != null) {
      setDriverWalletBalance(perfil.wallet.balance_cop);
    }
    setHistorialMovimientos(Array.isArray(transacciones) ? transacciones : []);
    setCargandoSaldo(false);
  }, [setDriverWalletBalance]);

  useEffect(() => {
    cargarSaldoYMovimientos();
  }, [cargarSaldoYMovimientos]);

  const ejecutarRecarga = async (e) => {
    e.preventDefault();
    setEstaProcesando(true);
    setMensajeError('');
    setMensajeExito('');

    try {
      const widgetParams = await walletService.initRecharge(montoRecarga);
      const resultado = await openWompiWidget(widgetParams);

      if (!resultado.success) {
        setMensajeError('El pago no se completó. Puedes intentarlo de nuevo.');
        setEstaProcesando(false);
        return;
      }

      // El saldo se acredita cuando llega el webhook de Wompi (asíncrono) — se
      // reintenta la consulta unas veces en vez de asumir que ya se reflejó.
      setMensajeExito('Pago aprobado. Actualizando tu saldo...');
      for (let intento = 0; intento < 5; intento++) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await cargarSaldoYMovimientos();
      }
      setMensajeExito(`¡Recarga de $ ${montoRecarga.toLocaleString('es-CO')} COP acreditada a tu saldo UniWheels!`);
    } catch (err) {
      setMensajeError(err?.message || 'No se pudo procesar la recarga.');
    } finally {
      setEstaProcesando(false);
      setTimeout(() => setMensajeExito(''), 6000);
    }
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
            {cargandoSaldo ? (
              <div className="h-9 flex items-center">
                <Loader2 className="w-5 h-5 animate-spin text-lochmara-500" />
              </div>
            ) : (
              <h2 className={`text-3xl font-extrabold tracking-tight mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                $ {driverWalletBalance.toLocaleString('es-CO')} <span className={`text-sm font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>COP</span>
              </h2>
            )}
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

      {/* 2. MENSAJES DE ESTADO DE LA RECARGA */}
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
      {mensajeError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-start gap-2.5 shadow-2xs font-bold"
        >
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <p className="font-medium leading-relaxed">{mensajeError}</p>
        </motion.div>
      )}

      {/* 3. RECARGA DE SALDO DIGITAL (Wompi: tarjeta, PSE, Nequi según el widget) */}
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

          <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Al continuar se abre una ventana segura de pago (Wompi) con tarjeta, PSE o Nequi.
          </p>

          <button
            type="submit"
            disabled={estaProcesando}
            className="w-full py-3 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-lochmara-600/20 cursor-pointer disabled:opacity-60"
          >
            {estaProcesando ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
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
          {historialMovimientos.length > 0 ? (
            historialMovimientos.map((tx) => {
              const esCredito = Number(tx.amount_cop) > 0;
              return (
                <div key={tx.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                        esCredito
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                      }`}
                    >
                      {esCredito ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className={`font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {ETIQUETAS_TRANSACCION[tx.transaction_type] || tx.transaction_type}
                      </p>
                      <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {tx.created_at ? new Date(tx.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>

                  <span className={`font-extrabold ${esCredito ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {esCredito ? '+' : ''} $ {Number(tx.amount_cop).toLocaleString('es-CO')}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">
              No hay movimientos recientes en tu billetera.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
