import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import {
  ShieldAlert,
  PhoneCall,
  Share2,
  X,
  Radio,
  Copy,
  Check,
  Ambulance,
} from 'lucide-react';

export const SosEmergencyModal = ({
  isOpen,
  onClose,
  currentCoords = [7.1193, -73.1042],
  tripInfo = null,
}) => {
  const { theme, activePassengerBooking, activeDriverTrip, user } = useAppStore();
  const isDark = theme === 'dark';
  const [copiadoLink, setCopiadoLink] = useState(false);

  if (!isOpen) return null;

  const lat = (currentCoords && currentCoords[0] ? currentCoords[0] : 7.1193).toFixed(5);
  const lng = (currentCoords && currentCoords[1] ? currentCoords[1] : -73.1042).toFixed(5);

  // Obtener datos del conductor y vehículo desde props o store
  const driverName =
    tripInfo?.driverName ||
    activePassengerBooking?.driverName ||
    activeDriverTrip?.driverName ||
    user?.name ||
    'Carlos Mendoza';

  const plate =
    tripInfo?.plate ||
    activePassengerBooking?.plate ||
    activeDriverTrip?.plate ||
    'KLU-492';

  const vehicle =
    tripInfo?.vehicle ||
    activePassengerBooking?.vehicle ||
    activeDriverTrip?.vehicle ||
    'Vehículo en servicio';

  const gpsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  const realizarLlamada = (numero) => {
    window.location.href = `tel:${numero}`;
  };

  const compartirSosWhatsApp = () => {
    const horaActual = new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const mensaje =
      `🚨 *¡EMERGENCIA SOS UNIWHEELS!* 🚨\n` +
      `Necesito ayuda urgente. Me encuentro en peligro o requiero asistencia inmediata durante mi viaje.\n\n` +
      `👤 *Conductor:* ${driverName}\n` +
      `🚗 *Vehículo / Placa:* ${vehicle} • *${plate}*\n` +
      `📍 *Ubicación GPS en Tiempo Real:*\n${gpsUrl}\n` +
      `⏱️ *Hora del reporte:* ${horaActual}\n\n` +
      `⚠️ *Por favor comunícate conmigo de inmediato o alerta a las autoridades.*`;

    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const copiarEnlaceGps = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(gpsUrl);
    } else {
      const el = document.createElement('textarea');
      el.value = gpsUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiadoLink(true);
    setTimeout(() => setCopiadoLink(false), 2500);
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
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-sm rounded-3xl p-5 border-2 shadow-2xl flex flex-col mx-auto space-y-3.5 transition-colors ${
            isDark
              ? 'bg-slate-900 border-rose-500/40 text-white shadow-black/80'
              : 'bg-white border-rose-300 text-slate-950 shadow-2xl'
          }`}
        >
          {/* Cabecera de Emergencia */}
          <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center animate-pulse border border-rose-500/40 shadow-xs">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="text-sm font-black text-rose-600 dark:text-rose-400 tracking-tight">
                  Botón de Pánico SOS
                </h3>
                <p className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Asistencia y Contacto de Emergencia
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-800'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tarjeta de Coordenadas GPS en Vivo */}
          <div
            className={`rounded-2xl p-3 space-y-1.5 border ${
              isDark
                ? 'bg-slate-950 border-rose-900/50 text-slate-300'
                : 'bg-rose-50/90 border-rose-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs text-rose-600 dark:text-rose-400">
                <Radio className="w-3.5 h-3.5 animate-ping" />
                <span>Transmisión GPS en Vivo</span>
              </div>
              <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded-md bg-rose-500/20 text-rose-500 border border-rose-500/30">
                {plate}
              </span>
            </div>

            <div className="space-y-0.5">
              <p className="text-[11px] font-mono">
                Lat: <strong className={isDark ? 'text-white font-black' : 'text-slate-950 font-black'}>{lat}</strong>, Lng: <strong className={isDark ? 'text-white font-black' : 'text-slate-950 font-black'}>{lng}</strong>
              </p>
              <p className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Conductor: <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>{driverName}</strong>
              </p>
            </div>
          </div>

          {/* LLAMADAS DE EMERGENCIA DIRECTAS (POLICÍA Y SERVICIOS) */}
          <div className="space-y-2">
            {/* 1. Llamar a la Policía Nacional */}
            <a
              href="tel:123"
              onClick={() => realizarLlamada('123')}
              className="w-full py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-black text-xs transition-all shadow-md shadow-rose-600/25 flex items-center justify-between cursor-pointer border border-rose-500"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black leading-tight">Llamar a la Policía Nacional</p>
                  <p className="text-[10px] text-rose-100 font-medium">Línea Nacional 123</p>
                </div>
              </div>
              <span className="text-xs font-mono font-black px-2 py-0.5 rounded-lg bg-white/20">
                123
              </span>
            </a>

            {/* 2. Llamar a Servicios de Emergencias Médicas (125) */}
            <a
              href="tel:125"
              onClick={() => realizarLlamada('125')}
              className={`w-full py-3 px-4 rounded-2xl border-2 font-black text-xs transition-all flex items-center justify-between cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-slate-950 hover:bg-slate-800 border-amber-500/50 text-amber-300'
                  : 'bg-amber-50 hover:bg-amber-100 border-amber-400 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-200 text-amber-800'
                }`}>
                  <Ambulance className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black leading-tight">Servicios de Emergencias Médicas</p>
                  <p className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-amber-800/80'}`}>
                    Ambulancias y Urgencias (CRUE)
                  </p>
                </div>
              </div>
              <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-lg border ${
                isDark ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-amber-200 border-amber-300 text-amber-900'
              }`}>
                125
              </span>
            </a>
          </div>

          {/* ACCIONES COMPLEMENTARIAS: WHATSAPP Y COPIAR GPS */}
          <div className={`grid grid-cols-2 gap-2 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            {/* 3. Enviar por WhatsApp */}
            <button
              type="button"
              onClick={compartirSosWhatsApp}
              className="py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/20 border border-emerald-500"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Enviar WhatsApp</span>
            </button>

            {/* 4. Copiar GPS */}
            <button
              type="button"
              onClick={copiarEnlaceGps}
              className={`py-2.5 px-3 rounded-2xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                copiadoLink
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500 dark:text-emerald-400 font-extrabold'
                  : isDark
                  ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              }`}
            >
              {copiadoLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar GPS</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
