import React from 'react';
import {
  ShieldCheck,
  MapPin,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const AvailableRideCard = ({
  ride,
  onSelectRide,
  isDark,
}) => {
  const isMoto =
    ride.vehicle?.toLowerCase().includes('moto') ||
    ride.vehicle?.toLowerCase().includes('yamaha') ||
    ride.vehicle?.toLowerCase().includes('mt-03');

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelectRide(ride)}
      className={`rounded-2xl p-3.5 border transition-all cursor-pointer shadow-2xs hover:shadow-md space-y-3 ${
        isDark
          ? 'bg-slate-900/90 border-slate-800 hover:border-lochmara-500/50 text-white'
          : 'bg-white border-slate-200 hover:border-lochmara-400 text-slate-900'
      }`}
    >
      {/* Cabecera: Conductor y Tarifa */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
              isMoto
                ? isDark
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                : isDark
                ? 'bg-lochmara-500/20 text-lochmara-300 border border-lochmara-400/30'
                : 'bg-lochmara-100 text-lochmara-800 border border-lochmara-200'
            }`}
          >
            {ride.driver_avatar_initials || ride.driver_name?.charAt(0) || 'U'}
          </div>

          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-black truncate">{ride.driver_name}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-lochmara-500 shrink-0" />
            </div>
            <p className="text-[10px] text-slate-400">
              {ride.vehicle} • <strong className="text-slate-600 dark:text-slate-300">{ride.plate}</strong>
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-sm font-black text-lochmara-600 dark:text-lochmara-400">
            {ride.fare}
          </span>
          <p className="text-[9px] text-slate-400 font-medium">
            {ride.available_seats} cupo(s) libre(s)
          </p>
        </div>
      </div>

      {/* Itinerario del Viaje */}
      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800/80 text-xs space-y-1">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3 h-3 text-lochmara-500 shrink-0" />
          <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate">De:</span>
          <strong className="text-[11px] truncate">{ride.origin}</strong>
        </div>
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
          <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate">A:</span>
          <strong className="text-[11px] truncate">{ride.destination}</strong>
        </div>
      </div>

      {/* Footer del Card: Horario, Desvío IA y Botón */}
      <div className="flex items-center justify-between text-[11px] pt-0.5">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
            <Clock className="w-3 h-3" />
            {ride.departure_time}
          </span>

          <span className="px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5" />
            {ride.detour_minutes}
          </span>
        </div>

        <span className="text-xs font-bold text-lochmara-600 dark:text-lochmara-400 flex items-center gap-0.5 hover:translate-x-0.5 transition-transform">
          Ver Ruta <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </motion.div>
  );
};
