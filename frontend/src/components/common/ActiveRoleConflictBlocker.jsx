import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  Car,
  CalendarCheck,
  ShieldAlert,
  ArrowRight,
  User,
  MapPin,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const ActiveRoleConflictBlocker = ({
  conflictType, // 'driver_active' | 'passenger_active'
  activeTrip,
  onRedirect,
}) => {
  const { setActiveTab, theme } = useAppStore();
  const isDark = theme === 'dark';

  const isDriverActive = conflictType === 'driver_active';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="space-y-4 pb-6 select-none"
    >
      {/* Tarjeta de Alerta de Exclusión Mutua */}
      <section
        className={`rounded-3xl p-5 shadow-lg border space-y-4 transition-colors ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-gradient-to-br from-slate-900 via-slate-900 to-[#082f49] text-white border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center shadow-xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-400/30">
            Operación Activa
          </span>
        </div>

        <div className="space-y-1">
          <h2 className="text-base font-extrabold text-white">
            {isDriverActive
              ? 'Tienes un viaje activo como Conductor'
              : 'Tienes una reserva activa como Pasajero'}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isDriverActive
              ? 'Por seguridad vial y coherencia del sistema, no puedes interactuar ni buscar viajes como pasajero mientras mantengas una ruta publicada en curso.'
              : 'Actualmente tienes un cupo reservado como pasajero. No puedes operar ni publicar viajes como conductor hasta completar o cancelar tu reserva.'}
          </p>
        </div>

        {/* Resumen del Viaje en Conflicto */}
        {activeTrip && (
          <div className="p-3.5 bg-white/10 rounded-2xl border border-white/10 text-xs space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span className="font-semibold text-lochmara-300">
                {isDriverActive ? 'Tu Ruta Publicada' : 'Tu Reserva Universitaria'}
              </span>
              <span className="font-mono text-white">
                {activeTrip.departureTime || activeTrip.time || 'En curso'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-white font-bold truncate">
              <MapPin className="w-3.5 h-3.5 text-lochmara-400 shrink-0" />
              <span className="truncate">
                {activeTrip.origin} ➔ {activeTrip.destination}
              </span>
            </div>
          </div>
        )}

        <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-slate-400 leading-snug">
          La navegación en esta sección está bloqueada para evitar duplicidad de roles. La pestaña <strong>Perfil</strong> permanece disponible.
        </div>
      </section>

      {/* Botones de Acción */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={onRedirect}
          className="w-full py-3.5 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-lochmara-600/25 cursor-pointer"
        >
          {isDriverActive ? (
            <>
              <Car className="w-4 h-4" />
              <span>Volver a Mi Panel de Conductor</span>
            </>
          ) : (
            <>
              <CalendarCheck className="w-4 h-4" />
              <span>Volver a Mis Viajes de Pasajero</span>
            </>
          )}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`w-full py-2.5 rounded-2xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
            isDark
              ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
          }`}
        >
          <User className="w-3.5 h-3.5 text-lochmara-500" />
          <span>Ir a Mi Perfil</span>
        </button>
      </div>
    </motion.div>
  );
};
