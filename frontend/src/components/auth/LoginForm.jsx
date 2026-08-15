import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Mail, Lock, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const LoginForm = ({ onBack }) => {
  const { login } = useAppStore();
  const [correoInstitucional, setCorreoInstitucional] = useState('sserrano@unab.edu.co');
  const [claveSegura, setClaveSegura] = useState('MiClaveUNAB2026!');
  const [mensajeError, setMensajeError] = useState('');
  const [estaCargando, setEstaCargando] = useState(false);

  const procesarInicioSesion = (evento) => {
    evento.preventDefault();
    setMensajeError('');

    if (!correoInstitucional.endsWith('@unab.edu.co')) {
      setMensajeError('El correo debe pertenecer al dominio institucional @unab.edu.co');
      return;
    }

    if (claveSegura.length < 6) {
      setMensajeError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setEstaCargando(true);

    setTimeout(() => {
      setEstaCargando(false);
      login({
        id: 'u1',
        name: 'Santiago Serrano',
        email: correoInstitucional,
        studentCode: 'U00123456',
        role: 'passenger',
        campus: 'Campus El Jardín',
        rating: 4.95,
        tripsCount: 14,
        walletBalance: 45000,
      });
    }, 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col justify-between h-full p-6 text-slate-900"
    >
      <div className="space-y-6">
        {/* Boton para regresar */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer w-fit p-1 -ml-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>

        {/* Titulo del formulario */}
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Iniciar Sesión</h2>
          <p className="text-xs text-slate-500">Ingresa con tus credenciales institucionales UNAB</p>
        </div>

        {/* Mensaje de Error */}
        {mensajeError && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{mensajeError}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={procesarInicioSesion} className="space-y-4">
          {/* Campo Correo */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Correo Institucional</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={correoInstitucional}
                onChange={(e) => setCorreoInstitucional(e.target.value)}
                placeholder="usuario@unab.edu.co"
                className="w-full bg-white text-xs rounded-2xl pl-10 pr-4 py-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Contraseña</label>
              <span className="text-[11px] text-lochmara-600 font-semibold cursor-pointer">
                ¿Olvidaste tu clave?
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={claveSegura}
                onChange={(e) => setClaveSegura(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white text-xs rounded-2xl pl-10 pr-4 py-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Boton de Envio */}
          <button
            type="submit"
            disabled={estaCargando}
            className="w-full py-3.5 mt-2 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-lochmara-600/25 disabled:opacity-50"
          >
            {estaCargando ? <span>Autenticando...</span> : <span>Ingresar a UniWheels</span>}
          </button>
        </form>
      </div>

      {/* Sello de seguridad institucional */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-600 pt-4">
        <ShieldCheck className="w-3.5 h-3.5 text-lochmara-600" />
        <span>Autenticación Segura Sanctum JWT</span>
      </div>
    </motion.div>
  );
};
