import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Home, Map, Car, Wallet, User, PlusCircle, CalendarCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const BottomNav = () => {
  const { activeTab, setActiveTab, activeRole, activeDriverTrip } = useAppStore();

  // Configuración estricta de pestañas según el ROL ACTIVO:
  // 1. CONDUCTOR: Inicio (Panel de Viaje), Publicar, Billetera (Prepago Conductor), Perfil
  // 2. PASAJERO: Inicio, Buscar Ruta, Mis Viajes, Perfil (SIN BILLETERA)
  const navItems =
    activeRole === 'driver'
      ? [
          { id: 'home', label: 'Mi Panel', icon: Home, badge: activeDriverTrip ? 'En curso' : null },
          { id: 'driver', label: 'Publicar', icon: PlusCircle },
          { id: 'wallet', label: 'Billetera', icon: Wallet },
          { id: 'profile', label: 'Perfil', icon: User },
        ]
      : [
          { id: 'home', label: 'Inicio', icon: Home },
          { id: 'map', label: 'Buscar Ruta', icon: Map },
          { id: 'trips', label: 'Mis Viajes', icon: CalendarCheck },
          { id: 'profile', label: 'Perfil', icon: User },
        ];

  return (
    <nav className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-2 py-1.5 shadow-lg select-none">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative flex flex-col items-center justify-center py-1 px-3.5 rounded-2xl transition-colors cursor-pointer"
            >
              {/* Indicador de Fondo Activo */}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-lochmara-50 rounded-xl border border-lochmara-200/60 -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive
                      ? 'text-lochmara-600 scale-110'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </div>

              <span
                className={`text-[10px] font-semibold mt-1 transition-colors ${
                  isActive ? 'text-lochmara-700 font-bold' : 'text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
