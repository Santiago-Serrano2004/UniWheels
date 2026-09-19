import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { authService, parseBackendError, INSTITUCIONES_PREDETERMINADAS } from '../../services/api';
import { HabeasDataModal } from '../common/HabeasDataModal';
import { PhotoPickerModal } from '../common/PhotoPickerModal';
import { AlertBanner } from '../common/AlertBanner';
import { FormSelect } from '../common/FormSelect';
import {
  User,
  School,
  MapPin,
  Mail,
  Phone,
  CreditCard,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Camera,
  Trash2,
  KeyRound,
  MessageSquare,
  RotateCw,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const RegisterForm = ({ onBack }) => {
  const { login, theme } = useAppStore();
  const isDark = theme === 'dark';

  // Paso del formulario: 1 (Datos & Universidad) | 2 (Credenciales & Seguridad) | 3 (Verificación PIN por Correo)
  const [pasoActual, setPasoActual] = useState(1);

  // Lista de instituciones y sedes
  const [instituciones, setInstituciones] = useState(INSTITUCIONES_PREDETERMINADAS);

  // Campos del Paso 1
  const [fotoPerfilPreview, setFotoPerfilPreview] = useState(null);
  const [modalFotoAbierto, setModalFotoAbierto] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [institucionId, setInstitucionId] = useState(1);
  const [sedeId, setSedeId] = useState(1);

  // Campos del Paso 2
  const [usuarioCorreo, setUsuarioCorreo] = useState('');
  const [documentoId, setDocumentoId] = useState('');
  const [telefono, setTelefono] = useState('');
  const [clave, setClave] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [confirmarClave, setConfirmarClave] = useState('');
  const [mostrarConfirmarClave, setMostrarConfirmarClave] = useState(false);
  const [aceptaHabeasData, setAceptaHabeasData] = useState(false);

  // Campos del Paso 3 (Verificación PIN de correo + código SMS, canales independientes)
  const [codigoPin, setCodigoPin] = useState('');
  const [codigoSms, setCodigoSms] = useState('');
  const [reenviandoCodigo, setReenviandoCodigo] = useState(false);
  const [reenviandoSms, setReenviandoSms] = useState(false);
  const [mensajeReenvio, setMensajeReenvio] = useState('');

  // Estados de control UX
  const [mensajeError, setMensajeError] = useState('');
  const [modalHabeasAbierto, setModalHabeasAbierto] = useState(false);
  const [estaProcesando, setEstaProcesando] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(false);

  // Requisitos individuales de seguridad de contraseña
  const reqMin8 = clave.length >= 8;
  const reqMayuscula = /[A-Z]/.test(clave);
  const reqMinuscula = /[a-z]/.test(clave);
  const reqNumero = /[0-9]/.test(clave);
  const reqEspecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(clave);

  const requisitosLista = [
    { id: 'min8', texto: 'Mínimo 8 caracteres', cumplido: reqMin8 },
    { id: 'mayus', texto: '1 mayúscula (A-Z)', cumplido: reqMayuscula },
    { id: 'minus', texto: '1 minúscula (a-z)', cumplido: reqMinuscula },
    { id: 'num', texto: '1 número (0-9)', cumplido: reqNumero },
    { id: 'esp', texto: '1 símbolo (@$!%*?&#)', cumplido: reqEspecial },
  ];

  const requisitosCumplidosCount = requisitosLista.filter((r) => r.cumplido).length;
  const requisitosCompletos = requisitosCumplidosCount === 5;

  const clavesCoinciden = confirmarClave.length > 0 && clave === confirmarClave;

  // La sede por defecto debe ser la marcada como sede principal, no la primera
  // que devuelva el backend — el orden de filas de una consulta sin ORDER BY
  // explícito no está garantizado, así que no se puede asumir que campuses[0]
  // sea la principal.
  const sedePorDefecto = (campuses) =>
    campuses?.find((sede) => sede.is_main_campus) || campuses?.[0];

  // Cargar catálogo de instituciones
  useEffect(() => {
    authService.getInstitutions().then((data) => {
      if (data && data.length > 0) {
        setInstituciones(data);
        setInstitucionId(data[0].id);
        const sede = sedePorDefecto(data[0].campuses);
        if (sede) setSedeId(sede.id);
      }
    });
  }, []);

  const institucionSeleccionada =
    instituciones.find((inst) => inst.id === Number(institucionId)) || instituciones[0];

  const sedesDisponibles = institucionSeleccionada?.campuses || [];

  const manejarCambioInstitucion = (id) => {
    setInstitucionId(Number(id));
    const inst = instituciones.find((i) => i.id === Number(id));
    const sede = sedePorDefecto(inst?.campuses);
    if (sede) setSedeId(sede.id);
  };

  const avanzarPasoDos = (e) => {
    e.preventDefault();
    setMensajeError('');

    if (nombreCompleto.trim().length < 3) {
      setMensajeError('Por favor ingresa tu nombre completo (mínimo 3 caracteres).');
      return;
    }

    if (!sedeId) {
      setMensajeError('Por favor selecciona tu sede o campus.');
      return;
    }

    setPasoActual(2);
  };

  // Validar Paso 2 y Enviar Código PIN al correo institucional
  const solicitarCodigoYPasarPasoTres = async (e) => {
    e.preventDefault();
    setMensajeError('');

    const usuarioLimpio = usuarioCorreo.trim().toLowerCase().replace(/@.*$/, '');

    if (!usuarioLimpio) {
      setMensajeError('Por favor ingresa tu usuario de correo institucional (ej: jduque).');
      return;
    }

    const docLimpio = documentoId.trim().toUpperCase();
    if (!docLimpio) {
      setMensajeError('Por favor ingresa tu código estudiantil o ID institucional.');
      return;
    }

    if (!docLimpio.startsWith('U') || docLimpio.length < 8) {
      setMensajeError('El código estudiantil debe iniciar con "U" seguido de tus números (ejemplo: U00123456).');
      return;
    }

    const telefonoLimpio = telefono.trim().replace(/\D/g, '');
    if (!/^3[0-9]{9}$/.test(telefonoLimpio)) {
      setMensajeError('Ingresa un número de celular colombiano válido de 10 dígitos (ej: 3151234567).');
      return;
    }

    if (!requisitosCompletos) {
      const faltantes = [];
      if (!reqMin8) faltantes.push('mínimo 8 caracteres');
      if (!reqMayuscula) faltantes.push('una letra mayúscula');
      if (!reqMinuscula) faltantes.push('una letra minúscula');
      if (!reqNumero) faltantes.push('un número');
      if (!reqEspecial) faltantes.push('un caracter especial (@$!%*?&#)');

      setMensajeError(`Tu contraseña aún no cumple con todos los requisitos de seguridad. Le falta: ${faltantes.join(', ')}.`);
      return;
    }

    if (!confirmarClave) {
      setMensajeError('Por favor confirma tu contraseña en el campo correspondiente.');
      return;
    }

    if (clave !== confirmarClave) {
      setMensajeError('Las contraseñas no coinciden. Por favor asegúrate de escribir la misma contraseña en ambos campos.');
      return;
    }

    if (!aceptaHabeasData) {
      setMensajeError('Debes autorizar el tratamiento de datos personales para registrarte.');
      return;
    }

    setEstaProcesando(true);
    const correoCompleto = `${usuarioLimpio}@${institucionSeleccionada.domain}`;

    try {
      await Promise.all([
        authService.sendVerificationCode(correoCompleto),
        authService.sendSmsCode(telefonoLimpio),
      ]);
      setEstaProcesando(false);
      setPasoActual(3);
    } catch (err) {
      setEstaProcesando(false);
      setMensajeError(parseBackendError(err));
    }
  };

  // Reenviar código PIN de correo
  const reenviarPin = async () => {
    const usuarioLimpio = usuarioCorreo.trim().toLowerCase().replace(/@.*$/, '');
    const correoCompleto = `${usuarioLimpio}@${institucionSeleccionada.domain}`;
    setReenviandoCodigo(true);
    setMensajeError('');
    setMensajeReenvio('');

    try {
      await authService.sendVerificationCode(correoCompleto);
      setReenviandoCodigo(false);
      setMensajeReenvio('¡Nuevo código enviado a tu correo institucional!');
      setTimeout(() => setMensajeReenvio(''), 4000);
    } catch (err) {
      setReenviandoCodigo(false);
      setMensajeError(parseBackendError(err));
    }
  };

  // Reenviar código SMS
  const reenviarSms = async () => {
    const telefonoLimpio = telefono.trim().replace(/\D/g, '');
    setReenviandoSms(true);
    setMensajeError('');
    setMensajeReenvio('');

    try {
      await authService.sendSmsCode(telefonoLimpio);
      setReenviandoSms(false);
      setMensajeReenvio('¡Nuevo código enviado por SMS!');
      setTimeout(() => setMensajeReenvio(''), 4000);
    } catch (err) {
      setReenviandoSms(false);
      setMensajeError(parseBackendError(err));
    }
  };

  // Validar PIN y Crear la Cuenta definitivamente
  const procesarRegistroFinal = async (e) => {
    e.preventDefault();
    setMensajeError('');

    const pinLimpio = codigoPin.trim();
    if (pinLimpio.length !== 6) {
      setMensajeError('El código de verificación PIN de correo debe tener exactamente 6 dígitos.');
      return;
    }

    const smsLimpio = codigoSms.trim();
    if (smsLimpio.length !== 6) {
      setMensajeError('El código de verificación SMS debe tener exactamente 6 dígitos.');
      return;
    }

    setEstaProcesando(true);
    const usuarioLimpio = usuarioCorreo.trim().toLowerCase().replace(/@.*$/, '');
    const docLimpio = documentoId.trim().toUpperCase();
    const telefonoLimpio = telefono.trim().replace(/\D/g, '');
    const correoCompleto = `${usuarioLimpio}@${institucionSeleccionada.domain}`;

    try {
      const res = await authService.register({
        name: nombreCompleto.trim(),
        email: correoCompleto,
        password: clave,
        password_confirmation: confirmarClave,
        institution_id: institucionId,
        campus_id: sedeId,
        student_code: docLimpio,
        id_document_number: docLimpio.replace(/^U/i, ''),
        id_document_type: 'CC',
        phone_number: telefonoLimpio,
        member_type: 'estudiante',
        academic_program_or_department: 'Comunidad Universitaria',
        profile_photo_path: fotoPerfilPreview || null,
        is_driver: false,
        verification_code: pinLimpio,
        phone_verification_code: smsLimpio,
      });

      setEstaProcesando(false);
      setRegistroExitoso(true);

      setTimeout(() => {
        const sedeObj = sedesDisponibles.find((s) => s.id === Number(sedeId));
        login({
          id: res.data?.user?.id || 'u_' + Date.now(),
          name: res.data?.user?.name || nombreCompleto.trim(),
          email: res.data?.user?.email || correoCompleto,
          studentCode: res.data?.user?.student_code || docLimpio,
          profilePhoto: fotoPerfilPreview,
          role: 'passenger',
          institution: institucionSeleccionada.name,
          campus: sedeObj?.name || 'Campus Principal',
          institutionWelcomeImage: institucionSeleccionada?.welcome_image_url || '/assets/institutions/unab-mascot.png',
          rating: 5.0,
          tripsCount: 0,
          walletBalance: 0,
          token: res.data?.access_token,
        });
      }, 1200);
    } catch (err) {
      setEstaProcesando(false);
      setMensajeError(parseBackendError(err));
    }
  };

  const usuarioLimpio = usuarioCorreo.trim().toLowerCase().replace(/@.*$/, '');
  const correoVisual = `${usuarioLimpio || 'tu_usuario'}@${institucionSeleccionada?.domain || 'unab.edu.co'}`;

  return (
    <div className={`flex-1 h-full w-full flex flex-col justify-between select-none overflow-hidden transition-colors ${
      isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* 1. BARRA SUPERIOR DE NAVEGACION */}
      <div className="pt-4 px-4 sm:px-6 pb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (pasoActual === 3) {
              setPasoActual(2);
              setMensajeError('');
            } else if (pasoActual === 2) {
              setPasoActual(1);
              setMensajeError('');
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

        {/* Indicador de Progreso Segmentado (3 Pasos) */}
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Paso {pasoActual} de 3</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`h-1.5 rounded-full transition-all duration-300 ${
                pasoActual === 1 ? 'w-6 bg-lochmara-600' : isDark ? 'w-2 bg-slate-800' : 'w-2 bg-slate-300'
              }`}
            />
            <span
              className={`h-1.5 rounded-full transition-all duration-300 ${
                pasoActual === 2 ? 'w-6 bg-lochmara-600' : isDark ? 'w-2 bg-slate-800' : 'w-2 bg-slate-300'
              }`}
            />
            <span
              className={`h-1.5 rounded-full transition-all duration-300 ${
                pasoActual === 3 ? 'w-6 bg-lochmara-600' : isDark ? 'w-2 bg-slate-800' : 'w-2 bg-slate-300'
              }`}
            />
          </div>
        </div>
      </div>

      {/* 2. CUERPO DEL FORMULARIO */}
      <div className="px-6 sm:px-8 flex-1 flex flex-col justify-center max-w-md mx-auto w-full py-2 overflow-y-auto">
        <div className="space-y-3.5">
          {/* Encabezado Dinámico según Paso */}
          <div className="space-y-1 text-center sm:text-left">
            <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {pasoActual === 1
                ? 'Únete a UniWheels'
                : pasoActual === 2
                ? 'Seguridad y Acceso'
                : 'Verifica tu Cuenta'}
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {pasoActual === 1
                ? 'Completa tu información institucional básica'
                : pasoActual === 2
                ? 'Configura tu acceso institucional seguro'
                : 'Ingresa los dos códigos de 6 dígitos que te enviamos por correo y por SMS'}
            </p>
          </div>

          {/* Banner de Errores */}
          <AlertBanner
            type="error"
            message={mensajeError}
            isOpen={!!mensajeError}
            onClose={() => setMensajeError('')}
          />

          {/* Banner de Reenvío Exitoso */}
          <AlertBanner
            type="success"
            message={mensajeReenvio}
            isOpen={!!mensajeReenvio}
            onClose={() => setMensajeReenvio('')}
          />

          <AnimatePresence mode="wait">
            {/* PASO 1: DATOS PERSONALES, FOTO & UNIVERSIDAD */}
            {pasoActual === 1 && (
              <motion.form
                key="paso-1"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
                onSubmit={avanzarPasoDos}
                className="space-y-3"
              >
                {/* Selector de Foto de Perfil */}
                <div className="flex flex-col items-center justify-center py-1">
                  <div className="relative group">
                    <div
                      onClick={() => setModalFotoAbierto(true)}
                      className={`w-20 h-20 rounded-3xl overflow-hidden border-2 flex items-center justify-center shadow-md cursor-pointer transition-all ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 hover:border-lochmara-500'
                          : 'bg-white border-slate-200 hover:border-lochmara-400'
                      }`}
                    >
                      {fotoPerfilPreview ? (
                        <img src={fotoPerfilPreview} alt="Foto de Perfil" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-400">
                          <Camera className="w-6 h-6 text-lochmara-500" />
                          <span className="text-[9px] font-bold text-lochmara-500 uppercase">Subir Foto</span>
                        </div>
                      )}
                    </div>

                    {fotoPerfilPreview && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFotoPerfilPreview(null);
                        }}
                        className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-xs hover:bg-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Foto de Perfil Universitaria (Opcional)
                  </span>
                </div>

                {/* Nombre Completo */}
                <div className="space-y-1">
                  <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <User className="w-3.5 h-3.5 text-lochmara-500" />
                    <span>Nombre Completo</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    placeholder="Ej: Santiago Duque Galvis"
                    className={`w-full text-xs rounded-2xl px-4 py-2.5 border transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-lochmara-500 ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                {/* Selección de Universidad */}
                <FormSelect
                  label="Universidad / Institución"
                  icon={School}
                  value={institucionId}
                  onChange={(e) => manejarCambioInstitucion(e.target.value)}
                  options={instituciones.map((inst) => ({
                    value: inst.id,
                    label: inst.name,
                  }))}
                />

                {/* Selección de Sede */}
                <FormSelect
                  label="Sede o Campus Principal"
                  icon={MapPin}
                  value={sedeId}
                  onChange={(e) => setSedeId(Number(e.target.value))}
                  options={sedesDisponibles.map((sede) => ({
                    value: sede.id,
                    label: `${sede.name}${sede.is_main_campus ? ' (Sede Principal)' : ''}`,
                  }))}
                />

                {/* Botón Siguiente */}
                <button
                  type="submit"
                  className="w-full py-3 mt-1 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-lochmara-600/25"
                >
                  <span>Continuar a Seguridad</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.form>
            )}

            {/* PASO 2: CREDENCIALES, CODIGO Y REGLAS DE CONTRASEÑA */}
            {pasoActual === 2 && (
              <motion.form
                key="paso-2"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
                onSubmit={solicitarCodigoYPasarPasoTres}
                className="space-y-3"
              >
                {/* Correo Institucional */}
                <div className="space-y-1">
                  <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <Mail className="w-3.5 h-3.5 text-lochmara-500" />
                    <span>Correo Institucional</span>
                  </label>
                  <div
                    className={`flex items-center rounded-2xl border px-3 py-1 shadow-2xs transition-all focus-within:ring-2 focus-within:ring-lochmara-500 ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <input
                      type="text"
                      required
                      value={usuarioCorreo}
                      onChange={(e) => setUsuarioCorreo(e.target.value.toLowerCase().replace(/@.*$/, ''))}
                      placeholder="usuario"
                      className={`flex-1 text-xs py-1.5 bg-transparent border-none focus:outline-none min-w-0 ${
                        isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                      }`}
                    />
                    <span className="text-xs font-bold text-lochmara-600 dark:text-lochmara-400 select-none pl-1 shrink-0">
                      @{institucionSeleccionada?.domain || 'unab.edu.co'}
                    </span>
                  </div>
                </div>

                {/* Código Estudiantil */}
                <div className="space-y-1">
                  <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <CreditCard className="w-3.5 h-3.5 text-lochmara-500" />
                    <span>Código Estudiantil (ID Institucional)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={documentoId}
                    onChange={(e) => setDocumentoId(e.target.value.toUpperCase())}
                    placeholder="U00123456"
                    className={`w-full text-xs rounded-2xl px-4 py-2.5 border transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-lochmara-500 ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                {/* Número de Celular (para verificación SMS, independiente del correo) */}
                <div className="space-y-1">
                  <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <Phone className="w-3.5 h-3.5 text-lochmara-500" />
                    <span>Número de Celular</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                    placeholder="3151234567"
                    className={`w-full text-xs rounded-2xl px-4 py-2.5 border transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-lochmara-500 ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Te enviaremos un código de verificación por SMS, aparte del de tu correo.
                  </p>
                </div>

                {/* Contraseña */}
                <div className="space-y-1">
                  <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <Lock className="w-3.5 h-3.5 text-lochmara-500" />
                    <span>Contraseña</span>
                  </label>
                  <div className="relative">
                    <input
                      type={mostrarClave ? 'text' : 'password'}
                      required
                      value={clave}
                      onChange={(e) => setClave(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className={`w-full text-xs rounded-2xl pl-4 pr-11 py-2.5 border transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-lochmara-500 ${
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

                  {/* Checklist Dinámico de Seguridad */}
                  <div
                    className={`p-2.5 rounded-xl border space-y-1.5 transition-colors ${
                      isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Fortaleza de Contraseña</span>
                      <span className={requisitosCompletos ? 'text-emerald-500' : 'text-amber-500'}>
                        {requisitosCumplidosCount} de 5 cumplidos
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                      {requisitosLista.map((req) => (
                        <div
                          key={req.id}
                          className={`flex items-center gap-1 text-[10px] font-medium transition-colors ${
                            req.cumplido
                              ? 'text-emerald-500 font-bold'
                              : isDark
                              ? 'text-slate-500'
                              : 'text-slate-400'
                          }`}
                        >
                          {req.cumplido ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                          ) : (
                            <div className="w-3 h-3 rounded-full border border-current shrink-0 flex items-center justify-center text-[7px]">
                              ○
                            </div>
                          )}
                          <span className="truncate">{req.texto}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Confirmar Contraseña */}
                <div className="space-y-1">
                  <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <Lock className="w-3.5 h-3.5 text-lochmara-500" />
                    <span>Confirmar Contraseña</span>
                  </label>
                  <div className="relative">
                    <input
                      type={mostrarConfirmarClave ? 'text' : 'password'}
                      required
                      value={confirmarClave}
                      onChange={(e) => setConfirmarClave(e.target.value)}
                      placeholder="Repite tu contraseña exactamente igual"
                      className={`w-full text-xs rounded-2xl pl-4 pr-11 py-2.5 border transition-all shadow-2xs focus:outline-none ${
                        confirmarClave.length > 0
                          ? clavesCoinciden
                            ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500'
                            : 'border-red-500 focus:ring-2 focus:ring-red-500'
                          : isDark
                          ? 'bg-slate-900 border-slate-800 text-white focus:ring-2 focus:ring-lochmara-500'
                          : 'bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-lochmara-500'
                      } ${isDark ? 'bg-slate-900 text-white placeholder-slate-500' : 'bg-white text-slate-900 placeholder-slate-400'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarConfirmarClave(!mostrarConfirmarClave)}
                      className={`absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer p-1 ${
                        isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {mostrarConfirmarClave ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Checkbox de Tratamiento de Datos (Ley 1581) */}
                <div className="pt-0.5">
                  <label className={`flex items-start gap-2.5 text-xs cursor-pointer select-none ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <input
                      type="checkbox"
                      checked={aceptaHabeasData}
                      onChange={(e) => setAceptaHabeasData(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-lochmara-600 focus:ring-lochmara-500 border-slate-300 cursor-pointer shrink-0"
                    />
                    <span className="leading-snug text-[11px]">
                      He leído y autorizo el{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setModalHabeasAbierto(true);
                        }}
                        className="text-lochmara-500 font-bold underline hover:text-lochmara-400 cursor-pointer"
                      >
                        tratamiento de datos personales (Ley 1581)
                      </button>
                    </span>
                  </label>
                </div>

                {/* Botón Enviar Código y Pasar al Paso 3 */}
                <button
                  type="submit"
                  disabled={estaProcesando}
                  className="w-full py-3 mt-1 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-lochmara-600/25 disabled:opacity-50"
                >
                  {estaProcesando ? (
                    <span>Enviando códigos a tu correo y celular...</span>
                  ) : (
                    <>
                      <span>Enviar Códigos de Verificación</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {/* PASO 3: VERIFICACIÓN PIN DE CORREO INSTITUCIONAL + CÓDIGO SMS (canales independientes) */}
            {pasoActual === 3 && (
              <motion.form
                key="paso-3"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
                onSubmit={procesarRegistroFinal}
                className="space-y-4"
              >
                <div
                  className={`p-4 rounded-2xl border text-center space-y-2 ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-lochmara-50/70 border-lochmara-200/80'
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-lochmara-600/10 border border-lochmara-500/20 text-lochmara-600 dark:text-lochmara-400 flex items-center justify-center mx-auto">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Código de correo enviado
                    </p>
                    <p className={`text-[11px] font-mono text-lochmara-600 dark:text-lochmara-400`}>
                      {correoVisual}
                    </p>
                  </div>
                </div>

                {/* Input de PIN de correo */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold text-center block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Código de Correo
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={codigoPin}
                    onChange={(e) => setCodigoPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    className={`w-full text-center text-2xl font-mono font-extrabold tracking-widest rounded-2xl py-3 border transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-lochmara-500 ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600'
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-300'
                    }`}
                  />
                  <div className="text-center">
                    <button
                      type="button"
                      disabled={reenviandoCodigo}
                      onClick={reenviarPin}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-lochmara-600 dark:text-lochmara-400 hover:underline cursor-pointer disabled:opacity-50"
                    >
                      <RotateCw className={`w-3 h-3 ${reenviandoCodigo ? 'animate-spin' : ''}`} />
                      <span>{reenviandoCodigo ? 'Reenviando...' : 'Reenviar código de correo'}</span>
                    </button>
                  </div>
                </div>

                {/* Input de código SMS (canal independiente) */}
                <div
                  className={`p-3 rounded-2xl border space-y-2 ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-emerald-50/70 border-emerald-200/80'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                    <p className={`text-[11px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Código SMS enviado a {telefono || 'tu celular'}
                    </p>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={codigoSms}
                    onChange={(e) => setCodigoSms(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    className={`w-full text-center text-2xl font-mono font-extrabold tracking-widest rounded-2xl py-3 border transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600'
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-300'
                    }`}
                  />
                  <div className="text-center">
                    <button
                      type="button"
                      disabled={reenviandoSms}
                      onClick={reenviarSms}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer disabled:opacity-50"
                    >
                      <RotateCw className={`w-3 h-3 ${reenviandoSms ? 'animate-spin' : ''}`} />
                      <span>{reenviandoSms ? 'Reenviando...' : 'Reenviar código SMS'}</span>
                    </button>
                  </div>
                </div>

                {/* Botón Finalizar Registro */}
                <button
                  type="submit"
                  disabled={estaProcesando || codigoPin.length !== 6 || codigoSms.length !== 6 || registroExitoso}
                  className="w-full py-3.5 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-lochmara-600/25 disabled:opacity-50"
                >
                  {estaProcesando ? (
                    <span>Verificando y creando cuenta...</span>
                  ) : registroExitoso ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>¡Cuenta Verificada Exitosamente!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Confirmar y Crear Cuenta</span>
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. PIE DE SEGURIDAD */}
      <div className={`px-6 pb-6 pt-1 flex items-center justify-center gap-1.5 text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        <ShieldCheck className="w-3.5 h-3.5 text-lochmara-500" />
        <span>Comunidad Universitaria Verificada</span>
      </div>

      {/* Modal de Opciones de Foto */}
      <PhotoPickerModal
        isOpen={modalFotoAbierto}
        onClose={() => setModalFotoAbierto(false)}
        onPhotoSelected={(fotoDataUrl) => setFotoPerfilPreview(fotoDataUrl)}
      />

      {/* Modal de Habeas Data */}
      <HabeasDataModal
        isOpen={modalHabeasAbierto}
        onClose={() => setModalHabeasAbierto(false)}
        onAccept={() => setAceptaHabeasData(true)}
      />
    </div>
  );
};
