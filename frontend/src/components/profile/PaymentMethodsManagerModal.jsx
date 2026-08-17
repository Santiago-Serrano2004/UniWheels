import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { AddCardModal } from '../wallet/AddCardModal';
import {
  CreditCard,
  Plus,
  Star,
  Trash2,
  Smartphone,
  ShieldCheck,
  Lock,
  X,
  CheckCircle2,
} from 'lucide-react';

export const PaymentMethodsManagerModal = ({ isOpen, onClose }) => {
  const { savedCards, deleteCard, setDefaultCard, linkedNequi, theme } = useAppStore();
  const isDark = theme === 'dark';
  const [modalAddCardOpen, setModalAddCardOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  if (!isOpen) return null;

  return (
    <>
      {createPortal(
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
              {/* Cabecera */}
              <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                      isDark
                        ? 'bg-slate-800 text-lochmara-400 border-slate-700'
                        : 'bg-lochmara-50 text-lochmara-700 border-lochmara-200'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Métodos de Pago</h3>
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tarjetas y Cuentas Vinculadas</p>
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

              {feedbackMsg && (
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{feedbackMsg}</span>
                </div>
              )}

              {/* Botón Agregar Tarjeta */}
              <button
                type="button"
                onClick={() => setModalAddCardOpen(true)}
                className={`w-full py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                  isDark
                    ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-lochmara-400'
                    : 'bg-lochmara-50 hover:bg-lochmara-100 border-lochmara-200 text-lochmara-800'
                }`}
              >
                <Plus className="w-4 h-4 text-lochmara-500" />
                <span>Agregar Nueva Tarjeta Débito / Crédito</span>
              </button>

              {/* Listado de Tarjetas Guardadas */}
              <div className="space-y-2 overflow-y-auto max-h-[48vh] pr-0.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider block px-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Tarjetas Tokenizadas ({savedCards.length})
                </span>

                {savedCards.map((card) => (
                  <div
                    key={card.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                      card.isDefault
                        ? isDark
                          ? 'bg-slate-950 border-lochmara-900/80 shadow-xs'
                          : 'bg-lochmara-50/40 border-lochmara-300 shadow-2xs'
                        : isDark
                        ? 'bg-slate-950 border-slate-800 hover:bg-slate-800/60'
                        : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Logo Franquicia */}
                      <div className="w-10 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold italic text-[10px] tracking-wider shrink-0 shadow-2xs">
                        {card.brand === 'visa' ? 'VISA' : 'MC'}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {card.bank} •••• {card.last4}
                          </span>
                          {card.isDefault && (
                            <span className="text-[8px] font-extrabold px-1.5 py-0.2 rounded-md bg-lochmara-600 text-white">
                              Predeterminada
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Vence {card.expMonth}/{card.expYear} • {card.holderName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!card.isDefault && (
                        <button
                          type="button"
                          onClick={() => {
                            setDefaultCard(card.id);
                            setFeedbackMsg(`Tarjeta •••• ${card.last4} establecida como predeterminada.`);
                            setTimeout(() => setFeedbackMsg(''), 3000);
                          }}
                          className={`p-1.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
                            isDark
                              ? 'text-slate-400 hover:text-lochmara-400 hover:bg-slate-800'
                              : 'text-slate-400 hover:text-lochmara-600 hover:bg-white'
                          }`}
                          title="Hacer predeterminada"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {savedCards.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            deleteCard(card.id);
                            setFeedbackMsg('Tarjeta eliminada de tu bóveda.');
                            setTimeout(() => setFeedbackMsg(''), 3000);
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isDark
                              ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-white'
                          }`}
                          title="Eliminar tarjeta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Cuenta Nequi Vinculada */}
                <span className={`text-[10px] font-bold uppercase tracking-wider block px-1 pt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Cuentas Digitales
                </span>

                <div
                  className={`p-3 rounded-2xl border flex items-center justify-between ${
                    isDark
                      ? 'bg-slate-950 border-purple-900/40 text-white'
                      : 'bg-purple-50/60 border-purple-200/80 text-purple-950'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-7 rounded-lg bg-purple-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                      NEQUI
                    </div>
                    <div>
                      <span className={`text-xs font-bold ${isDark ? 'text-purple-300' : 'text-purple-950'}`}>Cuenta Nequi Vinculada</span>
                      <p className={`text-[10px] font-mono ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>{linkedNequi}</p>
                    </div>
                  </div>

                  <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                    Verificado
                  </span>
                </div>
              </div>

              {/* Mensaje de Seguridad */}
              <div className={`pt-2 border-t flex items-center justify-center gap-1.5 text-[10px] ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-400'}`}>
                <Lock className="w-3 h-3 text-emerald-500" />
                <span>Cifrado de extremo a extremo de grado bancario (PCI-DSS)</span>
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
        onSuccess={() => {
          setFeedbackMsg('¡Tarjeta agregada y tokenizada exitosamente!');
          setTimeout(() => setFeedbackMsg(''), 3500);
        }}
      />
    </>
  );
};
