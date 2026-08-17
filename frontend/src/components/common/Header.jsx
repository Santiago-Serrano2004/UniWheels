import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Emblem } from './Emblem';
import { NotificationCenterModal } from './NotificationCenterModal';
import { SosEmergencyModal } from './SosEmergencyModal';
import { UserCheck, Car, Bell, ShieldAlert, Sun, Moon } from 'lucide-react';

export const Header = () => {
  const {
    user,
    activeRole,
    toggleRole,
    setActiveTab,
    activeDriverTrip,
    activePassengerBooking,
    openDriverInviteModal,
    theme,
    toggleTheme,
  } = useAppStore();
  const [modalNotifAbierto, setModalNotifAbierto] = useState(false);
  const [modalSosAbierto, setModalSosAbierto] = useState(false);

  const isDriverVerified = Boolean(user?.isDriver);
  const hasActiveTrip = Boolean(activeDriverTrip || activePassengerBooking);

  const manejarClickRol = () => {
    if (isDriverVerified) {
      toggleRole();
      if (activeRole === 'passenger') {
        setActiveTab('driver');
      } else {
        setActiveTab('home');
      }
    } else {
      openDriverInviteModal();
    }
  };

  return (
    <header
      className={`sticky top-0 z-30 backdrop-blur-md px-4 pt-4 pb-3 flex items-center justify-between shadow-2xs select-none transition-colors border-b ${
        theme === 'dark'
          ? 'bg-slate-950/95 border-slate-800/80 text-white'
          : 'bg-white/95 border-slate-100 text-slate-900'
      }`}
    >
      {/* Isotipo / Emblema */}
      <div className="flex items-center gap-2">
        <div
          onClick={() => setActiveTab(activeRole === 'driver' ? 'driver' : 'home')}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <Emblem className="h-7 w-auto drop-shadow-xs" />
          <span
            className={`font-extrabold text-sm tracking-tight ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}
          >
            UniWheels
          </span>
        </div>
      </div>

      {/* Acciones de Cabecera: Tema + Rol + SOS + Notificaciones + Perfil */}
      <div className="flex items-center gap-1.5">
        {/* Alternador de Tema Rápido en la Cabecera Móvil */}
        <button
          type="button"
          onClick={toggleTheme}
          className={`p-1.5 rounded-full transition-all cursor-pointer border ${
            theme === 'dark'
              ? 'bg-slate-900 border-slate-800 text-amber-300 hover:bg-slate-800'
              : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
          }`}
          title="Cambiar tema de la app"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Botón de Pánico SOS si hay viaje activo */}
        {hasActiveTrip && (
          <button
            type="button"
            onClick={() => setModalSosAbierto(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-extrabold shadow-sm shadow-rose-600/30 animate-pulse cursor-pointer"
            title="Botón de Pánico SOS"
          >
            <ShieldAlert className="w-3 h-3" />
            <span>SOS</span>
          </button>
        )}

        <button
          onClick={manejarClickRol}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer border shadow-2xs ${
            isDriverVerified && activeRole === 'driver'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-emerald-600/20'
              : theme === 'dark'
              ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-800'
              : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
          }`}
          title={isDriverVerified ? 'Cambiar modo de la aplicación' : 'Toca para registrarte como conductor'}
        >
          {isDriverVerified && activeRole === 'driver' ? (
            <>
              <Car className="w-3.5 h-3.5 text-emerald-200" />
              <span>Conductor</span>
            </>
          ) : (
            <>
              <UserCheck className="w-3.5 h-3.5 text-lochmara-300" />
              <span>Pasajero</span>
            </>
          )}
        </button>

        {/* Centro de Notificaciones Institucionales */}
        <button
          onClick={() => setModalNotifAbierto(true)}
          className={`relative p-2 rounded-full border transition-colors cursor-pointer ${
            theme === 'dark'
              ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
          }`}
          title="Notificaciones"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-lochmara-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Foto de Perfil del Usuario */}
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

      {/* Modal de Notificaciones */}
      <NotificationCenterModal
        isOpen={modalNotifAbierto}
        onClose={() => setModalNotifAbierto(false)}
      />

      {/* Modal de Emergencia SOS */}
      <SosEmergencyModal
        isOpen={modalSosAbierto}
        onClose={() => setModalSosAbierto(false)}
        tripInfo={{
          driverName: activeDriverTrip?.driverName || 'Carlos Mendoza',
          plate: activeDriverTrip?.plate || 'KLU-492',
        }}
      />
    </header>
  );
};

