import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { liveTripNotificationService } from '../../services/liveTripNotificationService';
import {
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  KeyRound,
  Clock,
  Star,
} from 'lucide-react';

// Modelo Vectorial SVG Superior de Carro (Mazda 3)
const TopDownCarSvg = ({ width = 48, height = 48, color = '#0284c7', isMoving = true }) => (
  <div style={{ position: 'relative', width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg width={width} height={height} viewBox="0 0 100 100" fill="none" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))' }}>
      {/* Cono de iluminación de faros delanteros */}
      {isMoving && <polygon points="50,15 18,-15 82,-15" fill="rgba(254,240,138,0.4)" />}
      {/* Ruedas */}
      <rect x="22" y="24" width="9" height="18" rx="3.5" fill="#0f172a" />
      <rect x="69" y="24" width="9" height="18" rx="3.5" fill="#0f172a" />
      <rect x="22" y="62" width="9" height="18" rx="3.5" fill="#0f172a" />
      <rect x="69" y="62" width="9" height="18" rx="3.5" fill="#0f172a" />
      {/* Chasis aerodinámico */}
      <rect x="27" y="14" width="46" height="74" rx="15" fill={color} stroke="#ffffff" strokeWidth="2.8" />
      {/* Parabrisas Delantero */}
      <path d="M 33 34 Q 50 28 67 34 L 64 45 Q 50 41 36 45 Z" fill="#e0f2fe" opacity="0.95" />
      {/* Techo panorámico */}
      <rect x="34" y="45" width="32" height="22" rx="6" fill="rgba(0,0,0,0.18)" />
      {/* Parabrisas Trasero */}
      <path d="M 36 69 Q 50 66 64 69 L 62 75 Q 50 73 38 75 Z" fill="#bae6fd" opacity="0.9" />
      {/* Faros delanteros LED */}
      <circle cx="34" cy="18" r="3.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
      <circle cx="66" cy="18" r="3.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
      {/* Luces de freno traseras */}
      <rect x="32" y="84" width="8" height="3" rx="1.5" fill="#ef4444" />
      <rect x="60" y="84" width="8" height="3" rx="1.5" fill="#ef4444" />
    </svg>
  </div>
);

// Modelo Vectorial SVG Superior de Motocicleta (Yamaha MT-03)
const TopDownMotoSvg = ({ width = 44, height = 44, color = '#f59e0b', isMoving = true }) => (
  <div style={{ position: 'relative', width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg width={width} height={height} viewBox="0 0 100 100" fill="none" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))' }}>
      {/* Haz de luz */}
      {isMoving && <polygon points="50,14 24,-12 76,-12" fill="rgba(254,240,138,0.42)" />}
      {/* Rueda delantera */}
      <rect x="46" y="8" width="8" height="22" rx="3.5" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
      {/* Manubrio y Espejos */}
      <rect x="27" y="25" width="46" height="4.5" rx="2" fill="#334155" stroke="#ffffff" strokeWidth="1" />
      <circle cx="27" cy="27" r="3.5" fill={color} />
      <circle cx="73" cy="27" r="3.5" fill={color} />
      {/* Tanque de combustible y chasis */}
      <path d="M 43 32 Q 50 26 57 32 L 60 48 Q 50 53 40 48 Z" fill={color} stroke="#ffffff" strokeWidth="2" />
      {/* Casco del Piloto con Visor */}
      <circle cx="50" cy="52" r="10.5" fill="#0f172a" stroke="#ffffff" strokeWidth="1.8" />
      <path d="M 43 49 Q 50 45 57 49 L 56 53 Q 50 50 44 53 Z" fill="#38bdf8" />
      {/* Chaqueta / Torso del conductor */}
      <path d="M 37 61 Q 50 57 63 61 L 59 71 Q 50 68 41 71 Z" fill="#1e293b" />
      {/* Rueda trasera y escape */}
      <rect x="46" y="70" width="8" height="24" rx="3.5" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
      <rect x="56" y="72" width="3.5" height="15" rx="1.5" fill="#94a3b8" />
      {/* Luz stop trasera */}
      <circle cx="50" cy="92" r="3" fill="#ef4444" />
    </svg>
  </div>
);

export const LiveTripIslandWidget = () => {
  const { activePassengerBooking, cancelPassengerBooking, activeTab, setActiveTab, theme } = useAppStore();
  const isDark = theme === 'dark';
  const [isExpanded, setIsExpanded] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState(4);

  const trip = activePassengerBooking;

  // Foto de conductor con fallback
  const driverPhotoUrl =
    trip?.driverPhoto ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256';

  const isMotorcycle = trip?.vehicle?.toLowerCase().includes('moto') || trip?.vehicle?.toLowerCase().includes('yamaha');

  useEffect(() => {
    if (!trip) return;

    if ('Notification' in window && Notification.permission === 'granted') {
      liveTripNotificationService.updateTripNotification({
        driverName: trip.driverName || 'Carlos Mendoza',
        vehicle: trip.vehicle || 'Mazda 3',
        plate: trip.plate || 'KLU-492',
        etaMinutes: etaMinutes,
        boardingPin: trip.boardingPin || '4829',
        destination: trip.destination || 'Campus El Jardín',
      });
    }

    const timer = setInterval(() => {
      setEtaMinutes((prev) => Math.max(1, prev - 1));
    }, 45000);

    return () => {
      clearInterval(timer);
    };
  }, [trip, etaMinutes]);

  // Si no hay viaje o si el usuario ya está viendo el mapa en vivo, ocultar el widget flotante
  if (!trip || activeTab === 'map') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed top-14 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-24px)] max-w-[366px] select-none pointer-events-auto"
      >
        <div
          className={`rounded-3xl p-3.5 shadow-xl border backdrop-blur-lg transition-colors ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white shadow-2xl'
              : 'bg-white border-slate-200 text-slate-900 shadow-xl'
          }`}
        >
          {/* MODO COMPACTO (ISLA DINÁMICA) */}
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between cursor-pointer"
          >
            {/* Lado Izquierdo: Foto Conductor + Modelo Vehicular + ETA */}
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Foto del Conductor con Insignia de Verificación */}
              <div className="relative w-10 h-10 shrink-0">
                <img
                  src={driverPhotoUrl}
                  alt="Conductor"
                  className="w-10 h-10 rounded-2xl object-cover border border-lochmara-400/40 shadow-2xs"
                />
                <div className={`absolute -bottom-1 -right-1 rounded-full p-0.5 shadow-xs ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                  <ShieldCheck className="w-3.5 h-3.5 text-lochmara-500" />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {trip.driverName || 'Carlos Mendoza'}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-300'
                        : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {trip.plate || 'KLU-492'}
                  </span>
                </div>
                <p className={`text-[11px] truncate flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span>Llega en</span>
                  <strong className={isDark ? 'text-lochmara-400 font-extrabold' : 'text-lochmara-700 font-extrabold'}>~{etaMinutes} min</strong>
                  <span>• {trip.pickup || 'San Pío'}</span>
                </p>
              </div>
            </div>

            {/* Lado Derecho: PIN + Botón Expandir */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`px-2.5 py-1 rounded-xl flex items-center gap-1 border shadow-2xs ${
                  isDark
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-lochmara-50 border-lochmara-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                <span
                  className={`text-xs font-mono font-extrabold tracking-wider ${
                    isDark ? 'text-amber-400' : 'text-lochmara-700'
                  }`}
                >
                  {trip.boardingPin || '4829'}
                </span>
              </div>

              <button
                type="button"
                className={`p-1 transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* MODO EXPANDIDO (DETALLES DEL VEHÍCULO Y ACCIONES) */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`pt-3 mt-3 border-t space-y-3 overflow-hidden text-xs ${isDark ? 'border-slate-800' : 'border-slate-100'}`}
              >
                {/* Vitrina Visual del Modelo Vehicular */}
                <div
                  className={`rounded-2xl p-3 flex items-center justify-between border ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {trip.vehicle || (isMotorcycle ? 'Yamaha MT-03 (Negra)' : 'Mazda 3 (Rojo)')}
                      </span>
                    </div>

                    <div className={`flex items-center gap-2 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span className="flex items-center gap-1 font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 rounded-md">
                        <Star className="w-3 h-3 fill-current" />
                        4.9 (128 viajes)
                      </span>
                      <span>• {isMotorcycle ? '1 cupo' : '3 cupos'}</span>
                    </div>

                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {trip.origin || 'Cañaveral'} ➔ {trip.destination || 'Campus El Jardín'}
                    </p>
                  </div>

                  {/* Renderizado del Modelo Vectorial Superior */}
                  <div
                    className={`p-1.5 rounded-2xl border shadow-xs flex items-center justify-center shrink-0 ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    {isMotorcycle ? (
                      <TopDownMotoSvg width={46} height={46} color="#f59e0b" isMoving={true} />
                    ) : (
                      <TopDownCarSvg width={50} height={50} color="#0284c7" isMoving={true} />
                    )}
                  </div>
                </div>

                {/* Barra de Progreso del Viaje */}
                <div className="space-y-1.5">
                  <div className={`flex items-center justify-between text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-lochmara-500" />
                      En camino al punto de recogida
                    </span>
                    <span className={`font-bold ${isDark ? 'text-lochmara-400' : 'text-lochmara-700'}`}>~ {etaMinutes} min restantes</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200/60'}`}>
                    <div
                      className="bg-lochmara-600 h-full rounded-full transition-all duration-500 shadow-xs"
                      style={{ width: `${Math.max(20, 100 - etaMinutes * 20)}%` }}
                    />
                  </div>
                </div>

                {/* Acciones Rápidas */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('map')}
                    className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all text-center cursor-pointer border ${
                      isDark
                        ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                    }`}
                  >
                    Ver Mapa en Vivo
                  </button>

                  <button
                    type="button"
                    onClick={() => cancelPassengerBooking()}
                    className="py-2.5 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
