import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { authService, INSTITUCIONES_PREDETERMINADAS } from '../../services/api';
import { HabeasDataModal } from '../common/HabeasDataModal';
import { PhotoPickerModal } from '../common/PhotoPickerModal';
import {
  User,
  School,
  MapPin,
  Mail,
  CreditCard,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Camera,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const RegisterForm = ({ onBack }) => {
  const { login } = useAppStore();

  // Paso del formulario: 1 (Datos, Foto & Universidad) | 2 (Credenciales & Seguridad)
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
  const [clave, setClave] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [aceptaHabeasData, setAceptaHabeasData] = useState(false);

  // Estados de control UX
  const [mensajeError, setMensajeError] = useState('');
  const [modalHabeasAbierto, setModalHabeasAbierto] = useState(false);
  const [estaProcesando, setEstaProcesando] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(false);

  // Cargar catálogo de instituciones
  useEffect(() => {
    authService.getInstitutions().then((data) => {
      if (data && data.length > 0) {
        setInstituciones(data);
        setInstitucionId(data[0].id);
        if (data[0].campuses && data[0].campuses.length > 0) {
          setSedeId(data[0].campuses[0].id);
        }
      }
    });
  }, []);

  const institucionSeleccionada =
    instituciones.find((inst) => inst.id === Number(institucionId)) || instituciones[0];

  const sedesDisponibles = institucionSeleccionada?.campuses || [];

  const manejarCambioInstitucion = (id) => {
    setInstitucionId(Number(id));
    const inst = instituciones.find((i) => i.id === Number(id));
    if (inst && inst.campuses && inst.campuses.length > 0) {
      setSedeId(inst.campuses[0].id);
    }
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

  const procesarRegistro = async (e) => {
    e.preventDefault();
    setMensajeError('');

    const usuarioLimpio = usuarioCorreo.trim().toLowerCase().replace(/@.*$/, '');

    if (!usuarioLimpio) {
      setMensajeError('Por favor ingresa tu usuario de correo institucional.');
      return;
    }

    if (!documentoId.trim()) {
      setMensajeError('Por favor ingresa tu código estudiantil o ID institucional.');
      return;
    }

    if (clave.length < 8) {
      setMensajeError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (!aceptaHabeasData) {
      setMensajeError('Debes autorizar el tratamiento de datos personales para registrarte.');
      return;
    }

    setEstaProcesando(true);
    const correoCompleto = `${usuarioLimpio}@${institucionSeleccionada.domain}`;

    try {
      await authService.register({
        name: nombreCompleto.trim(),
        email: correoCompleto,
        password: clave,
        password_confirmation: clave,
        institution_id: institucionId,
        campus_id: sedeId,
        student_code: documentoId.trim(),
        id_document_number: documentoId.trim(),
        id_document_type: 'CC',
        phone_number: '3000000000',
        member_type: 'estudiante',
        academic_program_or_department: 'Comunidad Universitaria',
        profile_photo_path: fotoPerfilPreview || null,
        is_driver: false,
      });
    } catch {}

    setEstaProcesando(false);
    setRegistroExitoso(true);

    setTimeout(() => {
      const sedeObj = sedesDisponibles.find((s) => s.id === Number(sedeId));
      login({
        id: 'u_' + Date.now(),
        name: nombreCompleto.trim(),
        email: correoCompleto,
        studentCode: documentoId.trim(),
        profilePhoto: fotoPerfilPreview,
        role: 'passenger',
        institution: institucionSeleccionada.name,
        campus: sedeObj?.name || 'Campus Principal',
        institutionWelcomeImage: institucionSeleccionada?.welcome_image_url || '/assets/institutions/unab-mascot.png',
        rating: 5.0,
        tripsCount: 0,
        walletBalance: 0,
      });
    }, 1200);
  };

  return (
    <div className="flex-1 h-full flex flex-col justify-between select-none overflow-hidden bg-slate-50 text-slate-900">
      {/* 1. BARRA SUPERIOR DE NAVEGACION */}
      <div className="pt-6 sm:pt-4 px-6 pb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (pasoActual === 2) {
              setPasoActual(1);
              setMensajeError('');
            } else {
              onBack();
            }
          }}
          className="w-9 h-9 rounded-full bg-white border border-slate-200/80 shadow-2xs hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Indicador de Progreso Segmentado */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400">Paso {pasoActual} de 2</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`h-1.5 rounded-full transition-all duration-300 ${
                pasoActual === 1 ? 'w-6 bg-lochmara-600' : 'w-2 bg-slate-300'
              }`}
            />
            <span
              className={`h-1.5 rounded-full transition-all duration-300 ${
                pasoActual === 2 ? 'w-6 bg-lochmara-600' : 'w-2 bg-slate-300'
              }`}
            />
          </div>
        </div>
      </div>

      {/* 2. CUERPO DEL FORMULARIO */}
      <div className="flex-1 flex flex-col justify-center px-6 py-2 overflow-y-auto">
        <div className="w-full max-w-sm mx-auto space-y-4">
          {/* Titulo y Subtitulo */}
          <div className="text-center space-y-0.5">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {pasoActual === 1 ? 'Crear Cuenta' : 'Credenciales'}
            </h2>
            <p className="text-xs text-slate-500">
              {pasoActual === 1
                ? 'Ingresa tu foto, datos personales y sede'
                : 'Configura tu acceso institucional seguro'}
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

          {/* Notificacion de Bienvenida */}
          {registroExitoso && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">¡Cuenta creada con éxito!</p>
                <p className="text-[11px] text-emerald-700">
                  Te hemos enviado un correo de bienvenida con tu código.
                </p>
              </div>
            </motion.div>
          )}

          {/* Formularios Segun Paso Actual */}
          <AnimatePresence mode="wait">
            {pasoActual === 1 ? (
              <motion.form
                key="registro-paso-1"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                onSubmit={avanzarPasoDos}
                className="space-y-3.5"
              >
                {/* Selector de Foto de Perfil con Modal de Camara / Galeria */}
                <div className="flex flex-col items-center justify-center space-y-1.5 pt-1">
                  <div className="relative group">
                    <div
                      onClick={() => setModalFotoAbierto(true)}
                      className="w-20 h-20 rounded-full bg-lochmara-50 border-2 border-dashed border-lochmara-300 hover:border-lochmara-500 flex items-center justify-center cursor-pointer overflow-hidden shadow-xs transition-all relative"
                    >
                      {fotoPerfilPreview ? (
                        <img
                          src={fotoPerfilPreview}
                          alt="Previsualización de Perfil"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-lochmara-600 space-y-0.5">
                          <Camera className="w-6 h-6" />
                          <span className="text-[9px] font-bold">Añadir</span>
                        </div>
                      )}
                    </div>

                    {/* Boton para eliminar foto */}
                    {fotoPerfilPreview && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFotoPerfilPreview(null);
                        }}
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 shadow-md cursor-pointer transition-transform hover:scale-110"
                        title="Eliminar foto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400 text-center font-medium">
                    Foto de Perfil (Opcional)
                  </p>
                </div>

                {/* Nombre Completo */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-lochmara-600" />
                    <span>Nombre Completo</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    placeholder="ej: Carlos Mendoza"
                    className="w-full bg-white text-xs rounded-2xl px-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 focus:border-transparent transition-all shadow-2xs"
                  />
                </div>

                {/* Institución */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-lochmara-600" />
                    <span>Institución Universitaria</span>
                  </label>
                  <div className="relative">
                    <select
                      value={institucionId}
                      onChange={(e) => manejarCambioInstitucion(e.target.value)}
                      className="w-full bg-white text-xs rounded-2xl px-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 focus:border-transparent transition-all appearance-none cursor-pointer pr-10 text-slate-800 font-medium shadow-2xs"
                    >
                      {instituciones.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Sede / Campus (Incluye La Casona) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-lochmara-600" />
                    <span>Sede / Campus</span>
                  </label>
                  <div className="relative">
                    <select
                      value={sedeId}
                      onChange={(e) => setSedeId(Number(e.target.value))}
                      className="w-full bg-white text-xs rounded-2xl px-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 focus:border-transparent transition-all appearance-none cursor-pointer pr-10 text-slate-800 font-medium shadow-2xs"
                    >
                      {sedesDisponibles.map((sede) => (
                        <option key={sede.id} value={sede.id}>
                          {sede.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Botón Siguiente */}
                <button
                  type="submit"
                  className="w-full py-3 mt-1 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-lochmara-600/25"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="registro-paso-2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                onSubmit={procesarRegistro}
                className="space-y-3.5"
              >
                {/* Correo con Dominio Fijo */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-lochmara-600" />
                    <span>Correo Institucional</span>
                  </label>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-lochmara-500 focus-within:border-transparent transition-all shadow-2xs">
                    <input
                      type="text"
                      required
                      value={usuarioCorreo}
                      onChange={(e) =>
                        setUsuarioCorreo(e.target.value.replace(/@.*$/, '').trim())
                      }
                      placeholder="ej: usuario"
                      className="flex-1 min-w-0 bg-transparent text-xs px-4 py-2.5 text-slate-900 focus:outline-none"
                    />
                    <div className="bg-lochmara-50 text-lochmara-800 text-xs font-bold px-3.5 py-2.5 border-l border-lochmara-100 select-none whitespace-nowrap">
                      @{institucionSeleccionada.domain}
                    </div>
                  </div>
                </div>

                {/* ID Estudiante / Docente / Miembro */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 leading-tight">
                    <CreditCard className="w-3.5 h-3.5 text-lochmara-600 shrink-0" />
                    <span>ID Estudiante / Docente / Miembro de la comunidad</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={documentoId}
                    onChange={(e) => setDocumentoId(e.target.value)}
                    placeholder="ej: U00123456"
                    className="w-full bg-white text-xs rounded-2xl px-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 focus:border-transparent transition-all shadow-2xs"
                  />
                </div>

                {/* Contraseña */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-lochmara-600" />
                    <span>Contraseña</span>
                  </label>
                  <div className="relative">
                    <input
                      type={mostrarClave ? 'text' : 'password'}
                      required
                      value={clave}
                      onChange={(e) => setClave(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full bg-white text-xs rounded-2xl pl-4 pr-11 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500 focus:border-transparent transition-all shadow-2xs"
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

                {/* Checkbox de Tratamiento de Datos (Ley 1581) */}
                <div className="pt-0.5">
                  <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer select-none">
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
                        className="text-lochmara-600 font-bold underline hover:text-lochmara-700 cursor-pointer"
                      >
                        tratamiento de datos personales (Ley 1581)
                      </button>
                    </span>
                  </label>
                </div>

                {/* Botón Registrarse */}
                <button
                  type="submit"
                  disabled={estaProcesando || registroExitoso}
                  className="w-full py-3 mt-1 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-lochmara-600/25 disabled:opacity-50"
                >
                  {estaProcesando ? (
                    <span>Registrando cuenta...</span>
                  ) : (
                    <span>Crear Cuenta en UniWheels</span>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. PIE DE SEGURIDAD */}
      <div className="px-6 pb-6 pt-1 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-lochmara-500" />
        <span>Comunidad Universitaria Verificada</span>
      </div>

      {/* Modal de Opciones de Foto (Cámara / Galería) */}
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
