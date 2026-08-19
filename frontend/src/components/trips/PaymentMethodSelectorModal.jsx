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
  const { savedCards, theme, openPaymentSettings } = useAppStore();
  const isDark = theme === 'dark';
  const [metodo, setMetodo] = useState(selectedMethod);
  const [tarjetaSeleccionadaId, setTarjetaSeleccionadaId] = useState(
    savedCards?.find((c) => c.isDefault)?.id || savedCards?.[0]?.id || null
  );
  const [modalAddCardOpen, setModalAddCardOpen] = useState(false);

  if (!isOpen) return null;

  const hasCards = Array.isArray(savedCards) && savedCards.length > 0;
  const hasNoCardsWhenCardSelected = metodo === 'card_instant' && !hasCards;

  const METODOS = [
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
      id: 'card_instant',
      title: 'Tarjeta Débito / Crédito',
      subtitle: 'Cobro automático in-app inmediato',
      icon: <CreditCard className="w-5 h-5 text-lochmara-500" />,
      tag: 'Cobro Inmediato',
      tagColor: isDark ? 'bg-lochmara-500/10 text-lochmara-400 border-lochmara-500/30' : 'bg-lochmara-50 text-lochmara-700 border-lochmara-200',
      description: 'Se debita automáticamente de tu tarjeta tokenizada.',
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
    if (hasNoCardsWhenCardSelected) return;
    onSelectMethod(metodo);
    onClose();
  };

  const redirigirAConfiguracion = (e) => {
    e.stopPropagation();
    onClose();
    if (openPaymentSettings) {
      openPaymentSettings();
    }
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

                      {/* Si selecciona Tarjeta, validar existencia de tarjetas */}
                      {seleccionado && m.id === 'card_instant' && (
                        <div className={`mt-2 pt-2 border-t space-y-2 ${isDark ? 'border-slate-800' : 'border-slate-200/70'}`}>
                          {hasCards ? (
                            <>
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Seleccionar Tarjeta:</span>
                                <button
                                  type="button"
                                  onClick={redirigirAConfiguracion}
                                  className="text-[9px] font-bold text-lochmara-500 hover:text-lochmara-400 flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Administrar</span>
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
                                    className={`p-2 rounded-xl border flex items-center justify-between text-[10px] transition-all cursor-pointer ${
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
                            </>
                          ) : (
                            /* ESTADO CUANDO NO TIENE TARJETAS GUARDADAS */
                            <div className={`p-3 rounded-2xl border text-center space-y-2 ${
                              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                            }`}>
                              <div className="space-y-0.5">
                                <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  No tienes tarjetas guardadas
                                </p>
                                <p className="text-[10px] text-slate-400 leading-snug">
                                  Para pagar con tarjeta débito o crédito necesitas registrar una en tu cuenta.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={redirigirAConfiguracion}
                                className="w-full py-2 px-3 rounded-xl bg-lochmara-600 hover:bg-lochmara-500 text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-lochmara-600/20 cursor-pointer"
                              >
                                <span>Agregar tarjeta en Configuración</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
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
                  disabled={hasNoCardsWhenCardSelected}
                  onClick={confirmarSeleccion}
                  className={`w-full py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md ${
                    hasNoCardsWhenCardSelected
                      ? 'opacity-40 cursor-not-allowed bg-slate-700 text-slate-300 shadow-none'
                      : 'bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white shadow-lochmara-600/20 cursor-pointer'
                  }`}
                >
                  <span>
                    {hasNoCardsWhenCardSelected ? 'Agrega una tarjeta para continuar' : 'Confirmar Método de Pago'}
                  </span>
                  {!hasNoCardsWhenCardSelected && <ArrowRight className="w-3.5 h-3.5 text-white" />}
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
