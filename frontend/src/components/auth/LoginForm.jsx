import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { authService, parseBackendError } from '../../services/api';
import { AlertBanner } from '../common/AlertBanner';
import {
  Mail,
  Lock,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LoginForm = ({ onBack }) => {
  const { login, theme } = useAppStore();
  const isDark = theme === 'dark';

  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [estaCargando, setEstaCargando] = useState(false);

  // Sub-flujo de Recuperacion de Contraseña
  const [modoRecuperacion, setModoRecuperacion] = useState(false);
  const [pasoRecuperacion, setPasoRecuperacion] = useState(1);
  const [correoRecuperacion, setCorreoRecuperacion] = useState('');
  const [codigoVerificacion, setCodigoVerificacion] = useState('');
  const [nuevaClave, setNuevaClave] = useState('');

  const procesarInicioSesion = async (e) => {
    e.preventDefault();
    setMensajeError('');
    setMensajeExito('');

    const correoLimpio = correo.trim().toLowerCase();

    if (!correoLimpio || !correoLimpio.includes('@') || !correoLimpio.includes('.')) {
      setMensajeError('Por favor ingresa un correo institucional válido.');
      return;
    }

    if (!clave) {
      setMensajeError('Por favor ingresa tu contraseña.');
      return;
    }

    setEstaCargando(true);

    try {
      const respuesta = await authService.login(correoLimpio, clave);
      setEstaCargando(false);

      if (respuesta.data?.user) {
        const u = respuesta.data.user;
        login({
          id: u.id,
          name: u.name,
          email: u.email,
          studentCode: u.academic_profile?.student_code || u.student_code || 'U000000',
          profilePhoto: u.profile_photo_url,
          role: u.roles?.includes('conductor') ? 'driver' : 'passenger',
          institution: u.institution?.name || 'Universidad Autónoma de Bucaramanga',
          campus: u.campus?.name || 'Campus El Jardín',
          institutionWelcomeImage: u.institution?.welcome_image_url || '/assets/institutions/unab-mascot.png',
          rating: u.reputation?.average_rating_as_passenger || 5.0,
          tripsCount: u.reputation?.total_trips_as_passenger || 0,
          walletBalance: u.wallet?.balance_cop || 0,
          token: respuesta.data.access_token,
        });
      }
    } catch (err) {
      setEstaCargando(false);
      setMensajeError(parseBackendError(err));
    }
  };

  const solicitarCodigoRecuperacion = async (e) => {
    e.preventDefault();
    setMensajeError('');
    const correoLimpio = correoRecuperacion.trim().toLowerCase();

    if (!correoLimpio.includes('@')) {
      setMensajeError('Ingresa un correo institucional válido.');
      return;
    }

    setEstaCargando(true);
    try {
      const resp = await authService.forgotPassword(correoLimpio);
      setEstaCargando(false);
      setMensajeExito(resp.message || 'Código de verificación de 6 dígitos enviado.');
      setPasoRecuperacion(2);
    } catch (err) {
      setEstaCargando(false);
      setMensajeError(err.message || 'Error al enviar el código de recuperación.');
    }
  };

  const procesarRestablecimiento = async (e) => {
    e.preventDefault();
    setMensajeError('');

    if (codigoVerificacion.trim().length !== 6) {
      setMensajeError('El código de verificación debe tener 6 dígitos.');
      return;
    }

    if (nuevaClave.length < 8) {
      setMensajeError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setEstaCargando(true);
    try {
      await authService.resetPassword(correoRecuperacion, codigoVerificacion, nuevaClave);
      setEstaCargando(false);
      setMensajeExito('¡Contraseña restablecida exitosamente! Ya puedes iniciar sesión.');
      setModoRecuperacion(false);
      setCorreo(correoRecuperacion);
      setClave('');
    } catch (err) {
      setEstaCargando(false);
      setMensajeError(err.message || 'El código es inválido o ha expirado.');
    }
  };

  return (
    <div className={`flex-1 h-full flex flex-col justify-between select-none overflow-hidden transition-colors ${
      isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* 1. BARRA SUPERIOR DE NAVEGACION */}
      <div className="pt-6 sm:pt-4 px-6 pb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (modoRecuperacion) {
              setModoRecuperacion(false);
              setMensajeError('');
              setMensajeExito('');
            } else {
              onBack();
            }
          }}
          className={`w-9 h-9 rounded-full border shadow-2xs flex items-center justify-center transition-all cursor-pointer ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              : 'bg-white border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>UniWheels</span>
      </div>

      {/* 2. CUERPO DEL FORMULARIO (Distribuido y centrado) */}
      <div className="flex-1 flex flex-col justify-center px-6 py-2 overflow-y-auto">
        <div className="w-full max-w-sm mx-auto space-y-5">
          {/* Titulo y Subtitulo */}
          <div className="space-y-1">
            <h2 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {modoRecuperacion ? 'Recuperar Clave' : 'Iniciar Sesión'}
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {modoRecuperacion
                ? 'Te enviaremos un código de 6 dígitos'
                : 'Ingresa con tu correo institucional universitario'}
            </p>
          </div>

          {/* Mensaje de Error */}
          {mensajeError && (
            <AlertBanner
              message={mensajeError}
              type="error"
              title="Error de Acceso"
              onClose={() => setMensajeError('')}
            />
          )}

          {/* Mensaje de Exito */}
          {mensajeExito && (
            <AlertBanner
              message={mensajeExito}
              type="success"
              title="Operación Exitosa"
              onClose={() => setMensajeExito('')}
            />
          )}

          {/* Formulario */}
          <AnimatePresence mode="wait">
            {!modoRecuperacion ? (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                onSubmit={procesarInicioSesion}
                className="space-y-4"
              >
                {/* Campo Correo */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <Mail className="w-3.5 h-3.5 text-lochmara-500" />
                    <span>Correo Institucional</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="ej: usuario@unab.edu.co"
                    className={`w-full text-xs rounded-2xl px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-lochmara-500 transition-all shadow-2xs ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                {/* Campo Contraseña */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <Lock className="w-3.5 h-3.5 text-lochmara-500" />
                      <span>Contraseña</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setModoRecuperacion(true);
                        setPasoRecuperacion(1);
                        setCorreoRecuperacion(correo);
                        setMensajeError('');
                        setMensajeExito('');
                      }}
                      className="text-[11px] text-lochmara-500 font-bold hover:underline cursor-pointer"
                    >
                      ¿Olvidaste tu clave?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={mostrarClave ? 'text' : 'password'}
                      required
                      value={clave}
                      onChange={(e) => setClave(e.target.value)}
                      placeholder="••••••••••••"
                      className={`w-full text-xs rounded-2xl pl-4 pr-11 py-3 border focus:outline-none focus:ring-2 focus:ring-lochmara-500 transition-all shadow-2xs ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarClave(!mostrarClave)}
                      className={`absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer p-1 ${
                        isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {mostrarClave ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Boton Ingresar */}
                <button
                  type="submit"
                  disabled={estaCargando}
                  className="w-full py-3.5 mt-2 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-lochmara-600/25 disabled:opacity-50"
                >
                  {estaCargando ? <span>Autenticando...</span> : <span>Ingresar a UniWheels</span>}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="recuperacion-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {pasoRecuperacion === 1 ? (
                  <form onSubmit={solicitarCodigoRecuperacion} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <Mail className="w-3.5 h-3.5 text-lochmara-500" />
                        <span>Ingresa tu Correo Institucional</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={correoRecuperacion}
                        onChange={(e) => setCorreoRecuperacion(e.target.value)}
                        placeholder="ej: usuario@unab.edu.co"
                        className={`w-full text-xs rounded-2xl px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-lochmara-500 transition-all shadow-2xs ${
                          isDark
                            ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
                            : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={estaCargando}
                      className="w-full py-3.5 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-lochmara-600/25 disabled:opacity-50"
                    >
                      {estaCargando ? <span>Enviando código...</span> : <span>Enviar Código</span>}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={procesarRestablecimiento} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <KeyRound className="w-3.5 h-3.5 text-lochmara-500" />
                        <span>Código de 6 Dígitos</span>
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={codigoVerificacion}
                        onChange={(e) => setCodigoVerificacion(e.target.value.trim())}
                        placeholder="123456"
                        className={`w-full text-center tracking-widest font-mono text-sm rounded-2xl px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-lochmara-500 transition-all font-bold shadow-2xs ${
                          isDark
                            ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
                            : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <Lock className="w-3.5 h-3.5 text-lochmara-500" />
                        <span>Nueva Contraseña</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={nuevaClave}
                        onChange={(e) => setNuevaClave(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className={`w-full text-xs rounded-2xl px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-lochmara-500 transition-all shadow-2xs ${
                          isDark
                            ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
                            : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={estaCargando}
                      className="w-full py-3.5 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-lochmara-600/25 disabled:opacity-50"
                    >
                      {estaCargando ? <span>Actualizando...</span> : <span>Restablecer Contraseña</span>}
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. PIE DE SEGURIDAD */}
      <div className={`px-6 pb-6 pt-2 flex items-center justify-center gap-1.5 text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        <ShieldCheck className="w-3.5 h-3.5 text-lochmara-500" />
        <span>Autenticación Segura Sanctum JWT</span>
      </div>
    </div>
  );
};
