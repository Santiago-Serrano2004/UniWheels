import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Emblem } from './Emblem';
import { MapPin, UserCheck, Car, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export const Header = () => {
  const { user, activeRole, toggleRole } = useAppStore();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 pt-4 pb-3 flex items-center justify-between shadow-2xs">
      {/* Isotipo / Emblema y Campus Universitario */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Emblem className="h-7 w-auto drop-shadow-xs" />
          <span className="font-extrabold text-slate-900 text-sm tracking-tight">UniWheels</span>
        </div>

        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-lochmara-50 border border-lochmara-200/70 text-lochmara-800 text-[11px] font-medium ml-1">
          <MapPin className="w-3 h-3 text-lochmara-500" />
          <span className="truncate max-w-[90px]">El Jardín</span>
        </div>
      </div>

      {/* Selector Pasajero / Conductor y Calificacion */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleRole}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer border shadow-2xs bg-slate-900 text-white border-slate-800 hover:bg-slate-800"
        >
          {activeRole === 'passenger' ? (
            <>
              <UserCheck className="w-3 h-3 text-lochmara-400" />
              <span>Pasajero</span>
            </>
          ) : (
            <>
              <Car className="w-3 h-3 text-emerald-400" />
              <span>Conductor</span>
            </>
          )}
        </button>

        {/* Rating del Usuario */}
        <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
          <span className="text-amber-500">★</span>
          <span>{user?.rating || 4.9}</span>
        </div>
      </div>
    </header>
  );
};
