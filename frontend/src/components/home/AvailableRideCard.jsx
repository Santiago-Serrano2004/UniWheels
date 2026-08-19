import React from 'react';
import {
  ShieldCheck,
  Clock,
  ArrowRight,
  Sparkles,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const AvailableRideCard = ({
  ride,
  onSelectRide,
  isDark,
  directionFilter = 'towards',
  selectedDate,
  todayStr,
  tomorrowStr,
}) => {
  const isMoto =
    ride.vehicle?.toLowerCase().includes('moto') ||
    ride.vehicle?.toLowerCase().includes('yamaha') ||
    ride.vehicle?.toLowerCase().includes('mt-03');

  // Evaluar estado de desvío IA
  const isDetourFeasible = ride.is_detour_feasible !== false;
  const isDirectRoute = ride.detour_minutes === '+0 min' || ride.is_direct;

  // Formato de badge de fecha
  const isForTomorrow = ride.scheduled_date === tomorrowStr;
  const isCustomFuture =
    ride.scheduled_date &&
    ride.scheduled_date !== todayStr &&
    ride.scheduled_date !== tomorrowStr;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelectRide(ride)}
      className={`rounded-2xl p-3.5 border transition-all cursor-pointer shadow-2xs hover:shadow-md space-y-3 ${
        isDark
          ? 'bg-slate-900 border-slate-800 hover:border-lochmara-500/50 text-white'
          : 'bg-white border-slate-200 hover:border-lochmara-400 text-slate-900'
      }`}
    >
      {/* Cabecera: Conductor, Vehículo y Tarifa */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
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

          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black truncate">{ride.driver_name}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-lochmara-500 shrink-0" />
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {ride.vehicle} • <strong className={`font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{ride.plate}</strong>
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-sm font-black text-lochmara-600 dark:text-lochmara-400">
            {ride.fare}
          </span>
          <p className="text-[9px] text-slate-400 font-medium">
            {ride.available_seats} cupo(s)
          </p>
        </div>
      </div>

      {/* Itinerario del Viaje */}
      <div
        className={`p-2.5 rounded-xl border text-xs space-y-1.5 transition-colors ${
          isDark
            ? 'bg-slate-950 border-slate-800 text-white'
            : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <div className="w-2 h-2 rounded-full bg-lochmara-500 shrink-0 ring-2 ring-lochmara-500/20" />
          <span className={`text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            De:
          </span>
          <span className={`text-xs font-black truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {ride.origin}
          </span>
        </div>
        <div className="flex items-center gap-2 truncate">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ring-2 ring-emerald-500/20" />
          <span className={`text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            A:
          </span>
          <span className={`text-xs font-black truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {ride.destination}
          </span>
        </div>

        {/* Punto de Encuentro en el Campus (para salidas desde campus o inter-campus) */}
        {(directionFilter === 'from' || directionFilter === 'inter_campus' || ride.meeting_point) && (
          <div className="pt-1 border-t dark:border-slate-800/80 border-slate-200/80 flex items-center gap-1.5 text-[10px]">
            <Navigation className="w-3 h-3 text-lochmara-500 shrink-0" />
            <span className="text-slate-400 font-bold shrink-0">Punto de encuentro:</span>
            <span className="font-extrabold text-lochmara-600 dark:text-lochmara-400 truncate">
              {ride.meeting_point || 'Portería Principal'}
            </span>
          </div>
        )}
      </div>

      {/* Footer del Card: Horarios Explícitos, Insignia de Fecha y Evaluación IA */}
      <div className="flex items-center justify-between text-[11px] pt-0.5 gap-2">
        <div className="flex items-center gap-2 truncate min-w-0 flex-wrap">
          {/* Badge de Fecha Programada si es Mañana o Futura */}
          {isForTomorrow ? (
            <span className="px-1.5 py-0.5 rounded-md bg-lochmara-500/10 text-lochmara-600 dark:text-lochmara-400 font-extrabold text-[9px] flex items-center gap-0.5 shrink-0">
              <Calendar className="w-2.5 h-2.5" />
              <span>Mañana</span>
            </span>
          ) : isCustomFuture ? (
            <span className="px-1.5 py-0.5 rounded-md bg-lochmara-500/10 text-lochmara-600 dark:text-lochmara-400 font-extrabold text-[9px] flex items-center gap-0.5 shrink-0">
              <Calendar className="w-2.5 h-2.5" />
              <span>{ride.scheduled_date}</span>
            </span>
          ) : null}

          {/* Horario Explícito según Sentido */}
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-bold shrink-0">
            <Clock className="w-3 h-3 text-lochmara-500" />
            <span>
              {directionFilter === 'towards'
                ? `Llegada: ${ride.arrival_time || '07:00 AM'}`
                : `Salida: ${ride.departure_time}`}
            </span>
          </div>

          {/* Insignia de Evaluación de Desvío IA */}
          {isDirectRoute ? (
            <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] flex items-center gap-0.5 shrink-0">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>Ruta directa</span>
            </span>
          ) : isDetourFeasible ? (
            <span className="px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[9px] flex items-center gap-0.5 shrink-0">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Desvío viable ({ride.detour_minutes})</span>
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded-md bg-slate-500/10 text-slate-500 dark:text-slate-400 font-bold text-[9px] flex items-center gap-0.5 shrink-0">
              <AlertCircle className="w-2.5 h-2.5" />
              <span>Desvío no disponible</span>
            </span>
          )}
        </div>

        <span className="text-xs font-bold text-lochmara-600 dark:text-lochmara-400 flex items-center gap-0.5 hover:translate-x-0.5 transition-transform shrink-0">
          <span>Ver Ruta</span>
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </motion.div>
  );
};
