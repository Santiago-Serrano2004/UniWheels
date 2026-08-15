import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Home, Map, Car, Wallet, User } from 'lucide-react';
import { motion } from 'framer-motion';

export const BottomNav = () => {
  const { activeTab, setActiveTab, activeRole } = useAppStore();

  const navItems = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'map', label: 'Ruta', icon: Map },
    {
      id: 'driver',
      label: activeRole === 'driver' ? 'Mis Cupos' : 'Conducir',
      icon: Car,
      highlight: activeRole === 'driver',
    },
    { id: 'wallet', label: 'Billetera', icon: Wallet },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  return (
    <nav className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-colors cursor-pointer"
            >
              {/* Indicador de Fondo Activo con Framer Motion */}
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
                {item.highlight && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-lochmara-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </div>

              <span
                className={`text-[10px] font-semibold mt-1 transition-colors ${
                  isActive ? 'text-lochmara-700' : 'text-slate-400'
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
