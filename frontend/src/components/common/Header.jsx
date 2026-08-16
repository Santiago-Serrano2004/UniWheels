import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Emblem } from './Emblem';
import { MapPin, UserCheck, Car, ShieldCheck } from 'lucide-react';

export const Header = () => {
  const { user, activeRole, toggleRole, setActiveTab } = useAppStore();

  const isDriverVerified = Boolean(user?.isDriver);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 pt-4 pb-3 flex items-center justify-between shadow-2xs">
      {/* Isotipo / Emblema y Campus */}
      <div className="flex items-center gap-2">
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <Emblem className="h-7 w-auto drop-shadow-xs" />
          <span className="font-extrabold text-slate-900 text-sm tracking-tight">UniWheels</span>
        </div>

        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-lochmara-50 border border-lochmara-200/70 text-lochmara-800 text-[11px] font-medium ml-1">
          <MapPin className="w-3 h-3 text-lochmara-500" />
          <span className="truncate max-w-[90px]">{user?.campus?.replace('Campus ', '') || 'El Jardín'}</span>
        </div>
      </div>

      {/* Acciones de Cabecera: Selector de Rol solo si es conductor verificado */}
      <div className="flex items-center gap-2">
        {isDriverVerified ? (
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
        ) : (
          <div className="hidden xs:flex items-center gap-1 px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-semibold">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Comunidad</span>
          </div>
        )}

        {/* Foto de Perfil del Usuario o Iniciales */}
        <button
          onClick={() => setActiveTab('profile')}
          className="w-7 h-7 rounded-full bg-lochmara-100 border border-lochmara-300 text-lochmara-800 font-bold text-[10px] flex items-center justify-center overflow-hidden cursor-pointer shadow-xs hover:scale-105 transition-transform"
          title="Ver Perfil"
        >
          {user?.profilePhoto ? (
            <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
          ) : user?.name ? (
            user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
          ) : (
            'UN'
          )}
        </button>
      </div>
    </header>
  );
};
