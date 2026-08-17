import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { AddCardModal } from '../wallet/AddCardModal';
import {
  CreditCard,
  Wallet,
  Smartphone,
  Banknote,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Clock,
  X,
  Plus,
  ArrowRight,
} from 'lucide-react';

export const PaymentMethodSelectorModal = ({
  isOpen,
  onClose,
  tripPrice = 5800,
  selectedMethod = 'nequi_direct',
  onSelectMethod,
}) => {
  const { savedCards, theme } = useAppStore();
  const isDark = theme === 'dark';
  const [metodo, setMetodo] = useState(selectedMethod);
  const [tarjetaSeleccionadaId, setTarjetaSeleccionadaId] = useState(
    savedCards.find((c) => c.isDefault)?.id || savedCards[0]?.id
  );
  const [modalAddCardOpen, setModalAddCardOpen] = useState(false);

  if (!isOpen) return null;

  const METODOS = [
    {
      id: 'card_instant',
      title: 'Tarjeta Débito / Crédito',
      subtitle: 'Cobro automático in-app inmediato',
      icon: <CreditCard className="w-5 h-5 text-lochmara-500" />,
      tag: 'Cobro Inmediato',
      tagColor: isDark ? 'bg-lochmara-500/10 text-lochmara-400 border-lochmara-500/30' : 'bg-lochmara-50 text-lochmara-700 border-lochmara-200',
      description: 'Se debita automáticamente de tu tarjeta tokenizada.',
    },
    {
      id: 'wallet_balance',
      title: 'Billetera Digital UniWheels',
      subtitle: 'Saldo prepagado institucional',
      icon: <Wallet className="w-5 h-5 text-emerald-500" />,
      tag: 'Saldo In-App',
      tagColor: isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Descuento instantáneo de tu saldo disponible.',
    },
    {
      id: 'nequi_direct',
      title: 'Nequi / Daviplata Directo',
      subtitle: 'Transferencia QR al finalizar el viaje',
      icon: <Smartphone className="w-5 h-5 text-purple-500" />,
      tag: 'Al Llegar a Destino',
      tagColor: isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200',
      description: 'Le transfieres directamente al conductor al llegar al campus.',
    },
    {
      id: 'cash_direct',
      title: 'Efectivo Exacto',
      subtitle: 'Pago físico al conductor',
      icon: <Banknote className="w-5 h-5 text-amber-500" />,
      tag: 'En Mano',
      tagColor: isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200',
      description: 'Pagas en billete o moneda al abordar o descender.',
    },
  ];

  const confirmarSeleccion = () => {
    onSelectMethod(metodo);
    onClose();
  };

  return (
    <>
      {createPortal(
        <AnimatePresence>
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose();
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 select-none backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={`relative w-full max-w-[340px] max-h-[85vh] rounded-3xl p-4.5 shadow-2xl border flex flex-col mx-auto space-y-3.5 overflow-hidden transition-colors ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-white'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              {/* Cabecera */}
              <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <div>
                  <h3 className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Método de Pago</h3>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Aporte del viaje: <strong className="text-emerald-400 font-extrabold">$ {tripPrice.toLocaleString('es-CO')} COP</strong>
                  </p>
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

              {/* Listado de Métodos */}
              <div className="space-y-2 overflow-y-auto max-h-[50vh] pr-0.5">
                {METODOS.map((m) => {
                  const seleccionado = metodo === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setMetodo(m.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                        seleccionado
                          ? isDark
                            ? 'bg-slate-950 border-lochmara-500 ring-2 ring-lochmara-500/20 shadow-xs'
                            : 'bg-lochmara-50/50 border-lochmara-400 ring-2 ring-lochmara-500/20 shadow-xs'
                          : isDark
                          ? 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/50'
                          : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl border shadow-2xs ${
                            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                          }`}>
                            {m.icon}
                          </div>
                          <div>
                            <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{m.title}</h4>
                            <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{m.subtitle}</p>
                          </div>
                        </div>

                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          seleccionado ? 'border-lochmara-500' : isDark ? 'border-slate-700' : 'border-slate-300'
                        }`}>
                          {seleccionado ? (
                            <div className="w-2.5 h-2.5 rounded-full bg-lochmara-500" />
                          ) : (
                            <div className="w-2.5 h-2.5 rounded-full bg-transparent" />
                          )}
                        </div>
                      </div>

                      {/* Si selecciona Tarjeta, mostrar tarjetas disponibles */}
                      {seleccionado && m.id === 'card_instant' && (
                        <div className={`mt-2 pt-2 border-t space-y-1.5 ${isDark ? 'border-slate-800' : 'border-slate-200/70'}`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Seleccionar Tarjeta:</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalAddCardOpen(true);
                              }}
                              className="text-[9px] font-bold text-lochmara-500 hover:text-lochmara-400 flex items-center gap-0.5 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Nueva Tarjeta</span>
                            </button>
                          </div>

                          <div className="space-y-1">
                            {savedCards.map((card) => (
                              <div
                                key={card.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTarjetaSeleccionadaId(card.id);
                                }}
                                className={`p-2 rounded-xl border flex items-center justify-between text-[10px] transition-all ${
                                  tarjetaSeleccionadaId === card.id
                                    ? isDark
                                      ? 'bg-slate-900 border-lochmara-500 font-bold shadow-2xs text-white'
                                      : 'bg-white border-lochmara-500 font-bold shadow-2xs text-slate-900'
                                    : isDark
                                    ? 'bg-slate-900/70 border-slate-800 text-slate-400'
                                    : 'bg-slate-100/70 border-slate-200 text-slate-600'
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  <span className="uppercase font-mono font-black">{card.brand}</span>
                                  <span>•••• {card.last4} ({card.bank})</span>
                                </span>
                                {tarjetaSeleccionadaId === card.id && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-lochmara-500" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className={`flex items-center justify-between pt-1 border-t text-[10px] ${isDark ? 'border-slate-800' : 'border-slate-200/50'}`}>
                        <span className={`px-2 py-0.5 rounded-full font-bold border ${m.tagColor}`}>
                          {m.tag}
                        </span>
                        <span className="text-slate-400 text-[9px] max-w-[150px] truncate text-right">
                          {m.description}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botón de Confirmar */}
              <div className={`pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={confirmarSeleccion}
                  className="w-full py-3 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-lochmara-600/20"
                >
                  <span>Confirmar Método de Pago</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* MODAL PARA AGREGAR NUEVA TARJETA */}
      <AddCardModal
        isOpen={modalAddCardOpen}
        onClose={() => setModalAddCardOpen(false)}
      />
    </>
  );
};
