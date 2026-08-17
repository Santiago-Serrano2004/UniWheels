import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Emblem } from '../common/Emblem';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ShieldCheck, UserPlus, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

export const AuthGatewayView = () => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const [pasoAutenticacion, setPasoAutenticacion] = useState('bienvenida'); // 'bienvenida' | 'login' | 'registro'

  if (pasoAutenticacion === 'login') {
    return <LoginForm onBack={() => setPasoAutenticacion('bienvenida')} />;
  }

  if (pasoAutenticacion === 'registro') {
    return <RegisterForm onBack={() => setPasoAutenticacion('bienvenida')} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`flex-1 h-full flex flex-col justify-between p-6 select-none transition-colors ${
        isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* 1. ESPACIO SUPERIOR LIMPIO */}
      <div className="pt-4" />

      {/* 2. ZONA CENTRAL CON EL ISOTIPO Y TÍTULO (Espacioso y aireado) */}
      <div className="flex flex-col items-center text-center space-y-6 max-w-xs mx-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="flex items-center justify-center"
        >
          <Emblem className="w-28 h-auto drop-shadow-md" />
        </motion.div>

        <div className="space-y-2">
          <h1 className={`text-3xl font-extrabold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            UniWheels
          </h1>
          <p className="text-sm font-semibold text-lochmara-500">
            Movilidad Inteligente
          </p>
          <p className={`text-xs pt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Comparte tus rutas universitarias.
          </p>
        </div>
      </div>

      {/* 3. ZONA INFERIOR DE ACCIÓN (Botones en alcance ergonómico del pulgar) */}
      <div className="space-y-4 max-w-xs w-full mx-auto pb-4">
        <div className="space-y-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setPasoAutenticacion('login')}
            className="w-full py-3.5 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-lochmara-600/25"
          >
            <LogIn className="w-4 h-4" />
            <span>Iniciar Sesión</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setPasoAutenticacion('registro')}
            className={`w-full py-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 active:bg-slate-850 text-white border-slate-800'
                : 'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4 text-lochmara-500" />
            <span>Registrarse</span>
          </motion.button>
        </div>

        {/* Sello Institucional */}
        <div className={`flex items-center justify-center gap-1.5 text-[11px] text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <ShieldCheck className="w-3.5 h-3.5 text-lochmara-500 shrink-0" />
          <span>Acceso exclusivo para comunidad universitaria</span>
        </div>
      </div>
    </motion.div>
  );
};
