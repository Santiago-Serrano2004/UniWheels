import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import {
  ShieldAlert,
  PhoneCall,
  Share2,
  X,
  CheckCircle2,
  Radio,
} from 'lucide-react';

export const SosEmergencyModal = ({ isOpen, onClose, currentCoords = [7.1193, -73.1042], tripInfo = null }) => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const [sosSent, setSosSent] = useState(false);
  const [copiadoLink, setCopiadoLink] = useState(false);

  if (!isOpen) return null;

  const lat = currentCoords[0].toFixed(5);
  const lng = currentCoords[1].toFixed(5);

  const enviarAlertaCentralSeguridad = () => {
    setSosSent(true);
  };

  const compartirSosWhatsApp = () => {
    const texto = encodeURIComponent(
      `🚨 ALERTA DE EMERGENCIA UNIWHEELS UNAB 🚨\nMe encuentro en trayecto y necesito asistencia.\n📍 Mi ubicación en vivo: https://www.google.com/maps?q=${lat},${lng}\n🚗 Conductor/Vehículo: ${tripInfo?.driverName || 'Carlos Mendoza'} (${tripInfo?.plate || 'KLU-492'})\n🛡️ Central de Seguridad UNAB informada.`
    );
    window.open(`https://wa.me/?text=${texto}`, '_blank');
  };

  const copiarEnlaceSeguimiento = () => {
    navigator.clipboard?.writeText(`https://www.google.com/maps?q=${lat},${lng}`);
    setCopiadoLink(true);
    setTimeout(() => setCopiadoLink(false), 2000);
  };

  return createPortal(
    <AnimatePresence>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            e.stopPropagation();
            onClose();
          }
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 select-none backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-sm rounded-3xl p-5 border shadow-2xl flex flex-col mx-auto space-y-3.5 transition-colors ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Cabecera de Emergencia */}
          <div className={`flex items-center justify-between pb-2.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center animate-pulse border border-rose-500/30">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-rose-500">Botón de Pánico SOS</h3>
                <p className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Asistencia de Seguridad UNAB</p>
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

          {/* Coordenadas en Vivo */}
          <div
            className={`rounded-2xl p-2.5 space-y-1 text-xs border ${
              isDark
                ? 'bg-slate-950 border-rose-900/40 text-slate-300'
                : 'bg-rose-50/80 border-rose-200/80 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-rose-500">
              <Radio className="w-3.5 h-3.5 text-rose-500 animate-ping" />
              <span>Transmisión GPS en Vivo</span>
            </div>
            <p className="text-[11px] font-mono">
              Lat: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{lat}</strong>, Lng: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{lng}</strong>
            </p>
            <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Sector: Bucaramanga / Floridablanca (AMB)
            </p>
          </div>

          {/* Estado de Alerta Despachada */}
          {sosSent ? (
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Alerta emitida a la Central de Vigilancia del Campus UNAB.</span>
            </div>
          ) : (
            <button
              onClick={enviarAlertaCentralSeguridad}
              className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-black text-xs transition-all shadow-md shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Activar Alerta Central UNAB</span>
            </button>
          )}
          {/* Llamadas de Emergencia */}
          <div className="space-y-1.5 pt-1">
            <p className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Llamada Telefónica Directa
            </p>
            <div className="grid grid-cols-2 gap-2">
              <a
                href="tel:6076436111"
                className={`py-2.5 px-3 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all text-center ${
                  isDark
                    ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
                }`}
              >
                <PhoneCall className="w-3 h-3 text-emerald-400" />
                <span>Seguridad UNAB</span>
              </a>

              <a
                href="tel:123"
                className={`py-2.5 px-3 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all text-center ${
                  isDark
                    ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-200'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-900'
                }`}
              >
                <PhoneCall className="w-3 h-3 text-rose-500" />
                <span>Policía 123</span>
              </a>
            </div>
          </div>

          {/* Compartir por WhatsApp y Copiar Enlace */}
          <div className={`flex gap-2 pt-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <button
              type="button"
              onClick={compartirSosWhatsApp}
              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Share2 className="w-3 h-3" />
              <span>Enviar por WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={copiarEnlaceSeguimiento}
              className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                copiadoLink
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                  : isDark
                  ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              {copiadoLink ? '¡Copiado!' : 'Copiar GPS'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
