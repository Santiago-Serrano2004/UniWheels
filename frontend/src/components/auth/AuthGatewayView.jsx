import React, { useState } from 'react';
import { Emblem } from '../common/Emblem';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ShieldCheck, UserPlus, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

export const AuthGatewayView = () => {
  const [pasoAutenticacion, setPasoAutenticacion] = useState('bienvenida'); // 'bienvenida' | 'login' | 'registro'

  if (pasoAutenticacion === 'login') {
    return <LoginForm onBack={() => setPasoAutenticacion('bienvenida')} />;
  }

  if (pasoAutenticacion === 'registro') {
    return <RegisterForm onBack={() => setPasoAutenticacion('bienvenida')} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="flex-1 h-full flex flex-col items-center justify-center p-6 text-slate-900 select-none"
    >
      {/* Contenedor Centrado en la Mitad de la Pantalla */}
      <div className="w-full max-w-xs flex flex-col items-center text-center space-y-6">
        {/* Isotipo Directo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="flex items-center justify-center"
        >
          <Emblem className="w-24 h-auto drop-shadow-md" />
        </motion.div>

        {/* Textos y Titulos */}
        <div className="space-y-1.5">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-tight">
            UniWheels
          </h1>
          <p className="text-sm font-semibold text-lochmara-600">
            Movilidad Inteligente
          </p>
          <p className="text-xs text-slate-500 pt-1">
            Comparte tus rutas universitarias.
          </p>
        </div>

        {/* Botones de Accion */}
        <div className="w-full space-y-3 pt-2">
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
            className="w-full py-3.5 rounded-2xl bg-white hover:bg-lochmara-50/80 active:bg-lochmara-100 text-slate-800 border border-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <UserPlus className="w-4 h-4 text-lochmara-600" />
            <span>Registrarse</span>
          </motion.button>
        </div>

        {/* Sello Institucional */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-600 pt-2">
          <ShieldCheck className="w-3.5 h-3.5 text-lochmara-600 shrink-0" />
          <span>Acceso exclusivo para comunidad universitaria</span>
        </div>
      </div>
    </motion.div>
  );
};
