import React from 'react';
import { CalendarCheck, X, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

export const ActiveTripCompactBanner = ({
  activePassengerBooking,
  isDark,
  setActiveTab,
  cancelPassengerBooking,
}) => {
  if (!activePassengerBooking) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`rounded-3xl p-3.5 border shadow-md flex items-center justify-between gap-3 ${
        isDark
          ? 'bg-slate-900/90 border-emerald-500/30 text-white'
          : 'bg-emerald-50/80 border-emerald-200 text-slate-900'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md shadow-emerald-500/20">
          {activePassengerBooking.driverName?.charAt(0) || 'C'}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-xs font-black truncate">{activePassengerBooking.driverName}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
              {activePassengerBooking.plate}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            PIN: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{activePassengerBooking.boardingPin}</strong> • Salida: {activePassengerBooking.departureTime || '06:45 AM'}
          </p>
          {activePassengerBooking.meeting_point && (
            <p className="text-[10px] text-lochmara-600 dark:text-lochmara-400 font-bold truncate flex items-center gap-1 mt-0.5">
              <Navigation className="w-2.5 h-2.5 shrink-0" />
              <span>Encuentro: {activePassengerBooking.meeting_point}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('map')}
          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          <span>Ver Mapa</span>
        </button>
        <button
          type="button"
          onClick={() => cancelPassengerBooking()}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
          title="Cancelar reserva"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
