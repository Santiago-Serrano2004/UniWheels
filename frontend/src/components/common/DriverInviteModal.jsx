import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, X, ArrowRight, CheckCircle2 } from 'lucide-react';

export const DriverInviteModal = ({ isOpen, onClose, onRegister }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="w-full max-w-[310px] max-h-[82vh] bg-white rounded-3xl p-4.5 shadow-2xl border border-slate-100 overflow-y-auto text-slate-900 mx-auto space-y-3.5"
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-lochmara-100 text-lochmara-700 flex items-center justify-center">
                <Car className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Activar Modo Conductor</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            Actualmente tu cuenta tiene el rol de <strong>Pasajero</strong>. Para habilitar el modo conductor y publicar trayectos, solo necesitas registrar los datos de tu vehículo y documentos vigentes.
          </p>

          <div className="space-y-2 bg-lochmara-50/70 p-2.5 rounded-2xl border border-lochmara-100 text-[10px] text-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Comparte gastos diarios de combustible</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Viajes 100% con tu comunidad universitaria</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-2xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onRegister();
              }}
              className="flex-1 py-2 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-lochmara-600/20"
            >
              <span>Registrarme</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
