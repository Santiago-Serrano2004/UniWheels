import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Phone,
  RotateCw,
  School,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react-native';
import { authService, INSTITUCIONES_PREDETERMINADAS, parseBackendError, useAppStore } from '@uniwheels/shared';
import { AlertBanner } from '@/components/AlertBanner';
import { FormSelect } from '@/components/FormSelect';
import { HabeasDataModal } from '@/components/HabeasDataModal';
import { PhotoPickerModal } from '@/components/PhotoPickerModal';

/**
 * Equivalente a frontend/src/components/auth/RegisterForm.jsx — wizard de 3
 * pasos (Datos & Universidad → Credenciales & Seguridad → Verificación PIN
 * de correo institucional). Antes no existía ninguna pantalla de registro en mobile
 * (solo login) — un estudiante nuevo no podía crear cuenta desde la app.
 */
export default function RegisterScreen() {
  const login = useAppStore((state) => state.login);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [instituciones, setInstituciones] = useState<any[]>(INSTITUCIONES_PREDETERMINADAS);

  // Paso 1
  const [fotoPerfilPreview, setFotoPerfilPreview] = useState<string | null>(null);
  const [modalFotoAbierto, setModalFotoAbierto] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [institucionId, setInstitucionId] = useState<number>(1);
  const [sedeId, setSedeId] = useState<number>(1);

  // Paso 2
  const [usuarioCorreo, setUsuarioCorreo] = useState('');
  const [documentoId, setDocumentoId] = useState('');
  const [telefono, setTelefono] = useState('');
  const [clave, setClave] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [confirmarClave, setConfirmarClave] = useState('');
  const [mostrarConfirmarClave, setMostrarConfirmarClave] = useState(false);
  const [aceptaHabeasData, setAceptaHabeasData] = useState(false);
  const [modalHabeasAbierto, setModalHabeasAbierto] = useState(false);

  // Paso 3
  const [codigoPin, setCodigoPin] = useState('');
  const [reenviandoCodigo, setReenviandoCodigo] = useState(false);

  const [mensajeError, setMensajeError] = useState('');
  const [mensajeReenvio, setMensajeReenvio] = useState('');
  const [estaProcesando, setEstaProcesando] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(false);

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

  useEffect(() => {
    authService.getInstitutions().then((data: any) => {
      if (data && data.length > 0) {
        setInstituciones(data);
        setInstitucionId(data[0].id);
        if (data[0].campuses?.length > 0) setSedeId(data[0].campuses[0].id);
      }
    });
  }, []);

  const institucionSeleccionada = instituciones.find((i) => i.id === Number(institucionId)) || instituciones[0];
  const sedesDisponibles = institucionSeleccionada?.campuses || [];

  const manejarCambioInstitucion = (id: string | number) => {
    setInstitucionId(Number(id));
    const inst = instituciones.find((i) => i.id === Number(id));
    if (inst?.campuses?.length > 0) setSedeId(inst.campuses[0].id);
  };

  const avanzarPasoDos = () => {
    setMensajeError('');
    if (nombreCompleto.trim().length < 3) {
      setMensajeError('Por favor ingresa tu nombre completo (mínimo 3 caracteres).');
      return;
    }
    if (!sedeId) {
      setMensajeError('Por favor selecciona tu sede o campus.');
      return;
    }
    setStep(2);
  };

  const solicitarCodigoYPasarPasoTres = async () => {
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
      const faltantes: string[] = [];
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
      await authService.sendVerificationCode(correoCompleto);
      setStep(3);
    } catch (err) {
      setMensajeError(parseBackendError(err));
    } finally {
      setEstaProcesando(false);
    }
  };

  const reenviarPin = async () => {
    const usuarioLimpio = usuarioCorreo.trim().toLowerCase().replace(/@.*$/, '');
    const correoCompleto = `${usuarioLimpio}@${institucionSeleccionada.domain}`;
    setReenviandoCodigo(true);
    setMensajeError('');
    setMensajeReenvio('');
    try {
      await authService.sendVerificationCode(correoCompleto);
      setMensajeReenvio('¡Nuevo código enviado a tu correo institucional!');
      setTimeout(() => setMensajeReenvio(''), 4000);
    } catch (err) {
      setMensajeError(parseBackendError(err));
    } finally {
      setReenviandoCodigo(false);
    }
  };

  const procesarRegistroFinal = async () => {
    setMensajeError('');
    const pinLimpio = codigoPin.trim();
    if (pinLimpio.length !== 6) {
      setMensajeError('El código de verificación PIN de correo debe tener exactamente 6 dígitos.');
      return;
    }

    setEstaProcesando(true);
    const usuarioLimpio = usuarioCorreo.trim().toLowerCase().replace(/@.*$/, '');
    const docLimpio = documentoId.trim().toUpperCase();
    const telefonoLimpio = telefono.trim().replace(/\D/g, '');
    const correoCompleto = `${usuarioLimpio}@${institucionSeleccionada.domain}`;

    try {
      const res: any = await authService.register({
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
        is_driver: false,
        verification_code: pinLimpio,
      });

      setRegistroExitoso(true);
      const sedeObj = sedesDisponibles.find((s: any) => s.id === Number(sedeId));

      setTimeout(() => {
        login({
          id: res.data?.user?.id || 'u_' + Date.now(),
          name: res.data?.user?.name || nombreCompleto.trim(),
          email: res.data?.user?.email || correoCompleto,
          studentCode: res.data?.user?.student_code || docLimpio,
          profilePhoto: fotoPerfilPreview,
          role: 'passenger',
          institution: institucionSeleccionada.name,
          campus: sedeObj?.name || 'Campus Principal',
          institutionWelcomeImage: institucionSeleccionada?.welcome_image_url,
          rating: 5.0,
          tripsCount: 0,
          token: res.data?.access_token,
        });
      }, 1200);
    } catch (err) {
      setMensajeError(parseBackendError(err));
    } finally {
      setEstaProcesando(false);
    }
  };

  const usuarioLimpio = usuarioCorreo.trim().toLowerCase().replace(/@.*$/, '');
  const correoVisual = `${usuarioLimpio || 'tu_usuario'}@${institucionSeleccionada?.domain || 'unab.edu.co'}`;

  const goBack = () => {
    setMensajeError('');
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
    else router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-100 dark:bg-slate-950">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        {/* Barra superior con indicador de progreso de 3 pasos */}
        <View className="pt-2 px-4 pb-1 flex-row items-center justify-between">
          <Pressable
            onPress={goBack}
            className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 items-center justify-center"
          >
            <ArrowLeft size={16} color="#64748b" />
          </Pressable>
          <View className="flex-row items-center gap-2">
            <Text className="text-[11px] font-bold text-slate-400">Paso {step} de 3</Text>
            <View className="flex-row items-center gap-1.5">
              {[1, 2, 3].map((n) => (
                <View
                  key={n}
                  className={`h-1.5 rounded-full ${step === n ? 'w-6 bg-lochmara-600' : 'w-2 bg-slate-300 dark:bg-slate-800'}`}
                />
              ))}
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <View className="px-6 py-4">
            <View className="w-full max-w-md mx-auto gap-3.5">
              <View className="gap-1">
                <Text className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  {step === 1 ? 'Únete a UniWheels' : step === 2 ? 'Seguridad y Acceso' : 'Verifica tu Cuenta'}
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  {step === 1
                    ? 'Completa tu información institucional básica'
                    : step === 2
                    ? 'Configura tu acceso institucional seguro'
                    : 'Ingresa el código de 6 dígitos que te enviamos a tu correo institucional'}
                </Text>
              </View>

              <AlertBanner message={mensajeError} type="error" onClose={() => setMensajeError('')} />
              <AlertBanner message={mensajeReenvio} type="success" onClose={() => setMensajeReenvio('')} />

              {step === 1 && (
                <View className="gap-3">
                  {/* Foto de perfil */}
                  <View className="items-center py-1">
                    <View className="relative">
                      <Pressable
                        onPress={() => setModalFotoAbierto(true)}
                        className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 items-center justify-center"
                      >
                        {fotoPerfilPreview ? (
                          <Image source={{ uri: fotoPerfilPreview }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                          <View className="items-center gap-1">
                            <Camera size={22} color="#0284c7" />
                            <Text className="text-[9px] font-bold text-lochmara-500 uppercase">Subir Foto</Text>
                          </View>
                        )}
                      </Pressable>
                      {fotoPerfilPreview && (
                        <Pressable
                          onPress={() => setFotoPerfilPreview(null)}
                          className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-500 items-center justify-center"
                        >
                          <Trash2 size={12} color="#ffffff" />
                        </Pressable>
                      )}
                    </View>
                    <Text className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1.5">
                      Foto de Perfil Universitaria (Opcional)
                    </Text>
                  </View>

                  <View className="gap-1">
                    <View className="flex-row items-center gap-1.5">
                      <User size={14} color="#0284c7" />
                      <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Nombre Completo</Text>
                    </View>
                    <TextInput
                      value={nombreCompleto}
                      onChangeText={setNombreCompleto}
                      placeholder="Ej: Santiago Duque Galvis"
                      placeholderTextColor="#94a3b8"
                      className="text-xs rounded-2xl px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </View>

                  <FormSelect
                    label="Universidad / Institución"
                    icon={School}
                    value={institucionId}
                    onChange={manejarCambioInstitucion}
                    options={instituciones.map((inst) => ({ value: inst.id, label: inst.name }))}
                  />

                  <FormSelect
                    label="Sede o Campus Principal"
                    icon={MapPin}
                    value={sedeId}
                    onChange={(v) => setSedeId(Number(v))}
                    options={sedesDisponibles.map((sede: any) => ({
                      value: sede.id,
                      label: `${sede.name}${sede.is_main_campus ? ' (Sede Principal)' : ''}`,
                    }))}
                  />

                  <Pressable onPress={avanzarPasoDos} className="py-3 mt-1 rounded-2xl bg-lochmara-600 flex-row items-center justify-center gap-2">
                    <Text className="text-white text-xs font-bold">Continuar a Seguridad</Text>
                    <ArrowRight size={14} color="#ffffff" />
                  </Pressable>
                </View>
              )}

              {step === 2 && (
                <View className="gap-3">
                  <View className="gap-1">
                    <View className="flex-row items-center gap-1.5">
                      <Mail size={14} color="#0284c7" />
                      <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Correo Institucional</Text>
                    </View>
                    <View className="flex-row items-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3">
                      <TextInput
                        value={usuarioCorreo}
                        onChangeText={(v) => setUsuarioCorreo(v.toLowerCase().replace(/@.*$/, ''))}
                        autoCapitalize="none"
                        placeholder="usuario"
                        placeholderTextColor="#94a3b8"
                        className="flex-1 text-xs py-3 text-slate-900 dark:text-white"
                      />
                      <Text className="text-xs font-bold text-lochmara-600 dark:text-lochmara-400 shrink-0">
                        @{institucionSeleccionada?.domain || 'unab.edu.co'}
                      </Text>
                    </View>
                  </View>

                  <View className="gap-1">
                    <View className="flex-row items-center gap-1.5">
                      <CreditCard size={14} color="#0284c7" />
                      <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Código Estudiantil (ID Institucional)</Text>
                    </View>
                    <TextInput
                      value={documentoId}
                      onChangeText={(v) => setDocumentoId(v.toUpperCase())}
                      placeholder="U00123456"
                      placeholderTextColor="#94a3b8"
                      autoCapitalize="characters"
                      className="text-xs rounded-2xl px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </View>

                  <View className="gap-1">
                    <View className="flex-row items-center gap-1.5">
                      <Phone size={14} color="#0284c7" />
                      <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Número de Celular</Text>
                    </View>
                    <TextInput
                      value={telefono}
                      onChangeText={(v) => setTelefono(v.replace(/[^0-9]/g, '').slice(0, 10))}
                      keyboardType="phone-pad"
                      placeholder="3151234567"
                      placeholderTextColor="#94a3b8"
                      className="text-xs rounded-2xl px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </View>

                  <View className="gap-1">
                    <View className="flex-row items-center gap-1.5">
                      <Lock size={14} color="#0284c7" />
                      <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Contraseña</Text>
                    </View>
                    <View className="relative justify-center">
                      <TextInput
                        value={clave}
                        onChangeText={setClave}
                        secureTextEntry={!mostrarClave}
                        placeholder="Mínimo 8 caracteres"
                        placeholderTextColor="#94a3b8"
                        className="text-xs rounded-2xl pl-4 pr-11 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                      <Pressable onPress={() => setMostrarClave((v) => !v)} style={{ position: 'absolute', right: 14 }} hitSlop={8}>
                        {mostrarClave ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                      </Pressable>
                    </View>

                    <View className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 gap-1.5">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Fortaleza de Contraseña</Text>
                        <Text className={`text-[10px] font-bold ${requisitosCompletos ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {requisitosCumplidosCount} de 5 cumplidos
                        </Text>
                      </View>
                      <View className="flex-row flex-wrap gap-x-3 gap-y-1">
                        {requisitosLista.map((req) => (
                          <View key={req.id} className="flex-row items-center gap-1 w-[46%]">
                            {req.cumplido ? (
                              <CheckCircle2 size={12} color="#10b981" />
                            ) : (
                              <View className="w-3 h-3 rounded-full border border-slate-400" />
                            )}
                            <Text className={`text-[10px] ${req.cumplido ? 'font-bold text-emerald-500' : 'text-slate-400'}`} numberOfLines={1}>
                              {req.texto}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View className="gap-1">
                    <View className="flex-row items-center gap-1.5">
                      <Lock size={14} color="#0284c7" />
                      <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Confirmar Contraseña</Text>
                    </View>
                    <View className="relative justify-center">
                      <TextInput
                        value={confirmarClave}
                        onChangeText={setConfirmarClave}
                        secureTextEntry={!mostrarConfirmarClave}
                        placeholder="Repite tu contraseña exactamente igual"
                        placeholderTextColor="#94a3b8"
                        className={`text-xs rounded-2xl pl-4 pr-11 py-3 border bg-white dark:bg-slate-900 text-slate-900 dark:text-white ${
                          confirmarClave.length > 0 ? (clavesCoinciden ? 'border-emerald-500' : 'border-rose-500') : 'border-slate-200 dark:border-slate-800'
                        }`}
                      />
                      <Pressable onPress={() => setMostrarConfirmarClave((v) => !v)} style={{ position: 'absolute', right: 14 }} hitSlop={8}>
                        {mostrarConfirmarClave ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                      </Pressable>
                    </View>
                  </View>

                  <Pressable onPress={() => setAceptaHabeasData((v) => !v)} className="flex-row items-start gap-2.5 pt-0.5">
                    <View
                      className={`mt-0.5 w-4 h-4 rounded border items-center justify-center shrink-0 ${
                        aceptaHabeasData ? 'bg-lochmara-600 border-lochmara-600' : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {aceptaHabeasData && <CheckCircle2 size={12} color="#ffffff" />}
                    </View>
                    <Text className="flex-1 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
                      He leído y autorizo el{' '}
                      <Text className="text-lochmara-500 font-bold underline" onPress={() => setModalHabeasAbierto(true)}>
                        tratamiento de datos personales (Ley 1581)
                      </Text>
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={solicitarCodigoYPasarPasoTres}
                    disabled={estaProcesando}
                    className="py-3 mt-1 rounded-2xl bg-lochmara-600 flex-row items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {estaProcesando ? (
                      <>
                        <ActivityIndicator color="#ffffff" />
                        <Text className="text-white text-xs font-bold">Enviando código...</Text>
                      </>
                    ) : (
                      <>
                        <Text className="text-white text-xs font-bold">Enviar Código de Verificación</Text>
                        <ArrowRight size={14} color="#ffffff" />
                      </>
                    )}
                  </Pressable>
                </View>
              )}

              {step === 3 && (
                <View className="gap-4">
                  <View className="p-4 rounded-2xl bg-lochmara-50/70 dark:bg-slate-900 border border-lochmara-200/80 dark:border-slate-800 items-center gap-2">
                    <View className="w-10 h-10 rounded-2xl bg-lochmara-600/10 border border-lochmara-500/20 items-center justify-center">
                      <KeyRound size={18} color="#0284c7" />
                    </View>
                    <Text className="text-xs font-bold text-slate-900 dark:text-white">Código de correo enviado</Text>
                    <Text className="text-[11px] font-mono text-lochmara-600 dark:text-lochmara-400">{correoVisual}</Text>
                  </View>

                  <View className="gap-1.5">
                    <Text className="text-xs font-bold text-center text-slate-700 dark:text-slate-300">Código de Correo</Text>
                    <TextInput
                      value={codigoPin}
                      onChangeText={(v) => setCodigoPin(v.replace(/[^0-9]/g, '').slice(0, 6))}
                      keyboardType="number-pad"
                      maxLength={6}
                      placeholder="• • • • • •"
                      placeholderTextColor="#cbd5e1"
                      className="text-center text-2xl font-mono font-extrabold tracking-widest rounded-2xl py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <Pressable onPress={reenviarPin} disabled={reenviandoCodigo} className="flex-row items-center justify-center gap-1.5 py-1">
                      <RotateCw size={12} color="#0284c7" />
                      <Text className="text-[11px] font-bold text-lochmara-600 dark:text-lochmara-400">
                        {reenviandoCodigo ? 'Reenviando...' : 'Reenviar código de correo'}
                      </Text>
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={procesarRegistroFinal}
                    disabled={estaProcesando || codigoPin.length !== 6 || registroExitoso}
                    className="py-3.5 rounded-2xl bg-lochmara-600 flex-row items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {estaProcesando ? (
                      <>
                        <ActivityIndicator color="#ffffff" />
                        <Text className="text-white text-xs font-bold">Verificando y creando cuenta...</Text>
                      </>
                    ) : registroExitoso ? (
                      <>
                        <CheckCircle2 size={16} color="#a7f3d0" />
                        <Text className="text-white text-xs font-bold">¡Cuenta Verificada Exitosamente!</Text>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} color="#ffffff" />
                        <Text className="text-white text-xs font-bold">Confirmar y Crear Cuenta</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              )}

              <View className="flex-row items-center justify-center gap-1.5 pt-1">
                <ShieldCheck size={13} color="#0284c7" />
                <Text className="text-[11px] text-slate-400 dark:text-slate-500">Comunidad Universitaria Verificada</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PhotoPickerModal isOpen={modalFotoAbierto} onClose={() => setModalFotoAbierto(false)} onPhotoSelected={setFotoPerfilPreview} />
      <HabeasDataModal isOpen={modalHabeasAbierto} onClose={() => setModalHabeasAbierto(false)} onAccept={() => setAceptaHabeasData(true)} />
    </SafeAreaView>
  );
}
