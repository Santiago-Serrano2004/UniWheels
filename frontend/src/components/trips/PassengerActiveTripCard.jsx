import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  ShieldCheck,
  KeyRound,
  AlertTriangle,
  MapPin,
  Clock,
  Car,
  Navigation,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const PassengerActiveTripCard = () => {
  const { activePassengerBooking, cancelPassengerBooking, theme } = useAppStore();

  if (!activePassengerBooking) return null;
  const isDark = theme === 'dark';

  return (
    <div className="space-y-3 pb-6 select-none">
      <motion.section
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-3xl p-5 border space-y-4 transition-colors ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-white shadow-lg'
            : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Cupo Confirmado</span>
          </div>

          <span className={`text-xs font-mono font-bold ${isDark ? 'text-lochmara-300' : 'text-lochmara-600'}`}>
            {activePassengerBooking.departureTime || '06:45 AM'}
          </span>
        </div>

        {/* Conductor Asignado */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-2xl font-extrabold text-sm flex items-center justify-center border ${
                isDark
                  ? 'bg-slate-800 text-lochmara-300 border-slate-700'
                  : 'bg-lochmara-50 text-lochmara-700 border-lochmara-200'
              }`}
            >
              {activePassengerBooking.driverName?.charAt(0) || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {activePassengerBooking.driverName || 'Carlos Mendoza'}
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-lochmara-500" />
              </div>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {activePassengerBooking.vehicle || 'Mazda 3 (Rojo)'} •{' '}
                <strong className={`font-mono ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                  {activePassengerBooking.plate || 'KLU-492'}
                </strong>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-sm font-extrabold text-emerald-500">
              {activePassengerBooking.fare || '$ 4.500'}
            </span>
            <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Aporte acordado</p>
          </div>
        </div>

        {/* PIN de Abordaje Seguro de 4 Dígitos */}
        <div
          className={`p-3 rounded-2xl border flex items-center justify-between ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80'
          }`}
        >
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-500" />
            <div>
              <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                PIN de Abordaje
              </span>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Entrégalo al conductor al subir
              </p>
            </div>
          </div>
          <div
            className={`px-3 py-1 rounded-xl font-mono text-base font-extrabold tracking-widest border shadow-xs ${
              isDark
                ? 'bg-slate-900 text-amber-400 border-slate-700'
                : 'bg-white text-slate-900 border-slate-200'
            }`}
          >
            {activePassengerBooking.boardingPin || '4829'}
          </div>
        </div>

        {/* Puntos de Ruta e Información de Encuentro */}
        <div
          className={`space-y-2.5 rounded-2xl p-3 border text-xs ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80'
          }`}
        >
          <div className="flex items-start gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-lochmara-400 mt-1 shrink-0" />
            <div>
              <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Punto de Abordaje (Origen)
              </span>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {activePassengerBooking.origin || activePassengerBooking.pickup || 'Parque San Pío'}
              </p>
              {activePassengerBooking.meeting_point && (
                <p className="text-[10px] font-bold text-lochmara-600 dark:text-lochmara-400 mt-0.5 flex items-center gap-1">
                  <Navigation className="w-3 h-3 shrink-0" />
                  <span>Punto de encuentro: {activePassengerBooking.meeting_point}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
            <div>
              <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Punto de Llegada (Destino)
              </span>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {activePassengerBooking.destination || 'Campus El Jardín'}
              </p>
            </div>
          </div>
        </div>

        {/* Botón de Cancelar Reserva */}
        <button
          type="button"
          onClick={() => cancelPassengerBooking()}
          className="w-full py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          <span>Cancelar Mi Reserva de Cupo</span>
        </button>
      </motion.section>
    </div>
  );
};
