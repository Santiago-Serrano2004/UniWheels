import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Wallet, ArrowDownRight, ArrowUpRight, PlusCircle, ShieldCheck, CreditCard } from 'lucide-react';

export const WalletView = () => {
  const { user } = useAppStore();
  const [balance, setBalance] = useState(user?.walletBalance || 0);

  const transactions = [
    {
      id: 't1',
      title: 'Billetera Digital Universitaria',
      date: 'Hoy',
      amount: '$ 0',
      type: 'credit',
    },
  ];

  return (
    <div className="space-y-4 pb-6 select-none">
      {/* Tarjeta de Saldo Principal */}
      <section className="bg-gradient-to-br from-[#082f49] to-slate-950 text-white rounded-3xl p-5 shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-lochmara-300 font-semibold tracking-wide">
              Billetera Estudiantil {user?.institution ? 'UNAB' : ''}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Protegida</span>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-300">Saldo Disponible</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white mt-0.5">
              $ {balance.toLocaleString('es-CO')}
            </h2>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setBalance((prev) => prev + 20000)}
              className="flex-1 bg-lochmara-500 hover:bg-lochmara-400 active:bg-lochmara-600 text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Recargar Saldo</span>
            </button>
          </div>
        </div>
      </section>

      {/* Historial de Transacciones */}
      <section className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Últimos Movimientos
        </h3>

        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-2xs overflow-hidden">
          {transactions.map((tx) => (
            <div key={tx.id} className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    tx.type === 'credit'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {tx.type === 'credit' ? (
                    <ArrowDownRight className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">{tx.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{tx.date}</p>
                </div>
              </div>

              <span
                className={`text-xs font-extrabold ${
                  tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'
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
