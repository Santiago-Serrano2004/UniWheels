import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Emblem } from './Emblem';
import { DriverInviteModal } from './DriverInviteModal';
import { NotificationCenterModal } from './NotificationCenterModal';
import { MapPin, UserCheck, Car, Bell } from 'lucide-react';

export const Header = () => {
  const { user, activeRole, toggleRole, setActiveTab } = useAppStore();
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);
  const [modalNotifAbierto, setModalNotifAbierto] = useState(false);

  const isDriverVerified = Boolean(user?.isDriver);

  const manejarClickRol = () => {
    if (isDriverVerified) {
      toggleRole();
      if (activeRole === 'passenger') {
        setActiveTab('driver');
      } else {
        setActiveTab('home');
      }
    } else {
      setModalRegistroAbierto(true);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 pt-4 pb-3 flex items-center justify-between shadow-2xs select-none">
      {/* Isotipo / Emblema */}
      <div className="flex items-center gap-2">
        <div
          onClick={() => setActiveTab(activeRole === 'driver' ? 'driver' : 'home')}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <Emblem className="h-7 w-auto drop-shadow-xs" />
          <span className="font-extrabold text-slate-900 text-sm tracking-tight">UniWheels</span>
        </div>
      </div>

      {/* Acciones de Cabecera: Rol + Campana de Notificaciones + Perfil */}
      <div className="flex items-center gap-2">
        <button
          onClick={manejarClickRol}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer border shadow-2xs ${
            isDriverVerified && activeRole === 'driver'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-emerald-600/20'
              : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-800'
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

        {/* Campana de Notificaciones con Badge */}
        <button
          type="button"
          onClick={() => setModalNotifAbierto(true)}
          className="relative p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          title="Centro de Notificaciones"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-lochmara-600 rounded-full border-2 border-white animate-pulse" />
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

      {/* Modal de Invitación a Registro de Conductor si aún no está verificado */}
      <DriverInviteModal
        isOpen={modalRegistroAbierto}
        onClose={() => setModalRegistroAbierto(false)}
        onRegister={() => {
          setModalRegistroAbierto(false);
          setActiveTab('driver');
        }}
      />
    </header>
  );
};

