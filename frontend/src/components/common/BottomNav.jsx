import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Home, Map, Wallet, User, PlusCircle, History } from 'lucide-react';
import { motion } from 'framer-motion';

export const BottomNav = () => {
  const { activeTab, setActiveTab, activeRole, activeDriverTrip, theme } = useAppStore();

  // Configuración estricta de pestañas según el ROL ACTIVO:
  // 1. CONDUCTOR: Inicio (Panel), Publicar, Historial de Conducción, Billetera, Perfil
  // 2. PASAJERO: Inicio, Buscar Ruta, Historial de Viajes / Reservas, Perfil
  const navItems =
    activeRole === 'driver'
      ? [
          { id: 'home', label: 'Mi Panel', icon: Home, badge: activeDriverTrip ? 'En curso' : null },
          { id: 'driver', label: 'Publicar', icon: PlusCircle },
          { id: 'history', label: 'Historial', icon: History },
          { id: 'wallet', label: 'Billetera', icon: Wallet },
          { id: 'profile', label: 'Perfil', icon: User },
        ]
      : [
          { id: 'home', label: 'Inicio', icon: Home },
          { id: 'map', label: 'Buscar Ruta', icon: Map },
          { id: 'history', label: 'Historial', icon: History },
          { id: 'profile', label: 'Perfil', icon: User },
        ];

  return (
    <nav
      className={`sticky bottom-0 z-40 backdrop-blur-lg px-2 py-1.5 shadow-lg select-none transition-colors border-t ${
        theme === 'dark'
          ? 'bg-slate-950/95 border-slate-800 text-slate-400'
          : 'bg-white/95 border-slate-200/80 text-slate-500'
      }`}
    >
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
              {/* Indicador de Fondo Activo (Solo en modo claro) */}
              {isActive && theme !== 'dark' && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 rounded-xl -z-10 bg-lochmara-50/80 border border-lochmara-200/60"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-all ${
                    isActive
                      ? theme === 'dark'
                        ? 'text-lochmara-400 scale-110'
                        : 'text-lochmara-600 scale-110'
                      : theme === 'dark'
                      ? 'text-slate-500 hover:text-slate-300'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-slate-900 animate-pulse" />
                )}
              </div>

              <span
                className={`text-[10px] font-semibold mt-1 transition-colors ${
                  isActive
                    ? theme === 'dark'
                      ? 'text-lochmara-400 font-bold'
                      : 'text-lochmara-700 font-bold'
                    : theme === 'dark'
                    ? 'text-slate-500'
                    : 'text-slate-400'
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
