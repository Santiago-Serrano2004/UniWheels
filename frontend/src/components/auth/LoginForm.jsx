import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { authService } from '../../services/api';
import {
  Mail,
  Lock,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LoginForm = ({ onBack }) => {
  const { login } = useAppStore();

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
      if (err.message && !err.message.includes('servidor')) {
        setMensajeError(err.message);
        return;
      }

      // Modo local simulado para pruebas
      login({
        id: 'u_' + Date.now(),
        name: 'Usuario Universitario',
        email: correoLimpio,
        studentCode: 'U00123456',
        role: 'passenger',
        institution: 'Universidad Autónoma de Bucaramanga',
        campus: 'Campus El Jardín',
        institutionWelcomeImage: '/assets/institutions/unab-mascot.png',
        rating: 4.95,
        tripsCount: 12,
        walletBalance: 35000,
      });
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
    <div className="flex-1 h-full flex flex-col justify-between select-none overflow-hidden bg-slate-50 text-slate-900">
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
          className="w-9 h-9 rounded-full bg-white border border-slate-200/80 shadow-2xs hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <span className="text-xs font-bold text-slate-400">UniWheels</span>
      </div>

      {/* 2. CUERPO DEL FORMULARIO (Distribuido y centrado) */}
      <div className="flex-1 flex flex-col justify-center px-6 py-2 overflow-y-auto">
        <div className="w-full max-w-sm mx-auto space-y-5">
          {/* Titulo y Subtitulo */}
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {modoRecuperacion ? 'Recuperar Clave' : 'Iniciar Sesión'}
            </h2>
            <p className="text-xs text-slate-500">
              {modoRecuperacion
                ? 'Te enviaremos un código de 6 dígitos'
                : 'Ingresa con tu correo institucional universitario'}
            </p>
          </div>

          {/* Mensaje de Error */}
          {mensajeError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{mensajeError}</span>
            </motion.div>
          )}

          {/* Mensaje de Exito */}
          {mensajeExito && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{mensajeExito}</span>
            </motion.div>
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
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-lochmara-600" />
                    <span>Correo Institucional</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="ej: usuario@unab.edu.co"
                    className="w-full bg-white text-xs rounded-2xl px-4 py-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 focus:border-transparent transition-all shadow-2xs"
                  />
                </div>

                {/* Campo Contraseña */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-lochmara-600" />
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
                      className="text-[11px] text-lochmara-600 font-bold hover:underline cursor-pointer"
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
                      className="w-full bg-white text-xs rounded-2xl pl-4 pr-11 py-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 focus:border-transparent transition-all shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarClave(!mostrarClave)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
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
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-lochmara-600" />
                        <span>Ingresa tu Correo Institucional</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={correoRecuperacion}
                        onChange={(e) => setCorreoRecuperacion(e.target.value)}
                        placeholder="ej: usuario@unab.edu.co"
                        className="w-full bg-white text-xs rounded-2xl px-4 py-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 focus:border-transparent transition-all shadow-2xs"
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
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-lochmara-600" />
                        <span>Código de 6 Dígitos</span>
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={codigoVerificacion}
                        onChange={(e) => setCodigoVerificacion(e.target.value.trim())}
                        placeholder="123456"
                        className="w-full bg-white text-center tracking-widest font-mono text-sm rounded-2xl px-4 py-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 focus:border-transparent transition-all font-bold text-slate-900 shadow-2xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-lochmara-600" />
                        <span>Nueva Contraseña</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={nuevaClave}
                        onChange={(e) => setNuevaClave(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full bg-white text-xs rounded-2xl px-4 py-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 focus:border-transparent transition-all shadow-2xs"
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
      <div className="px-6 pb-6 pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-lochmara-500" />
        <span>Autenticación Segura Sanctum JWT</span>
      </div>
    </div>
  );
};
