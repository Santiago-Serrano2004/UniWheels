import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react-native';
import { authService, parseBackendError, useAppStore } from '@uniwheels/shared';
import { AlertBanner } from '@/components/AlertBanner';

/**
 * Mismo flujo y textos que frontend/src/components/auth/LoginForm.jsx —
 * incluye el sub-flujo de recuperación de clave (2 pasos: pedir código por
 * correo, luego código + contraseña nueva), que antes se había dejado fuera.
 */
export default function LoginScreen() {
  const login = useAppStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sub-flujo de recuperación de contraseña
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<1 | 2>(1);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleLogin = async () => {
    const correoLimpio = email.trim().toLowerCase();
    setErrorMessage('');

    if (!correoLimpio || !correoLimpio.includes('@') || !correoLimpio.includes('.')) {
      setErrorMessage('Por favor ingresa un correo institucional válido.');
      return;
    }
    if (!password) {
      setErrorMessage('Por favor ingresa tu contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login(correoLimpio, password);
      const u = response?.data?.user;
      if (!u) {
        throw { message: 'Respuesta de login inesperada del servidor.' };
      }
      // Mismo mapeo snake_case → forma del store que usa
      // frontend/src/components/auth/LoginForm.jsx.
      login({
        id: u.id,
        name: u.name,
        email: u.email,
        studentCode: u.academic_profile?.student_code || u.student_code || 'U000000',
        profilePhoto: u.profile_photo_url,
        role: u.roles?.includes('conductor') ? 'driver' : 'passenger',
        isAdmin: u.roles?.includes('administrador') || false,
        institution: u.institution?.name || 'Universidad Autónoma de Bucaramanga',
        campus: u.campus?.name || 'Campus El Jardín',
        institutionWelcomeImage: u.institution?.welcome_image_url,
        rating: u.reputation?.average_rating_as_passenger || 5.0,
        tripsCount: u.reputation?.total_trips_as_passenger || 0,
        walletBalance: u.wallet?.balance_cop || 0,
        token: response.data.access_token,
      });
    } catch (error) {
      setErrorMessage(parseBackendError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const solicitarCodigoRecuperacion = async () => {
    setErrorMessage('');
    const correoLimpio = recoveryEmail.trim().toLowerCase();
    if (!correoLimpio.includes('@')) {
      setErrorMessage('Ingresa un correo institucional válido.');
      return;
    }
    setIsLoading(true);
    try {
      const resp = await authService.forgotPassword(correoLimpio);
      setSuccessMessage(resp?.message || 'Código de verificación de 6 dígitos enviado.');
      setRecoveryStep(2);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al enviar el código de recuperación.');
    } finally {
      setIsLoading(false);
    }
  };

  const procesarRestablecimiento = async () => {
    setErrorMessage('');
    if (verificationCode.trim().length !== 6) {
      setErrorMessage('El código de verificación debe tener 6 dígitos.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setIsLoading(true);
    try {
      await authService.resetPassword(recoveryEmail, verificationCode.trim(), newPassword);
      setSuccessMessage('¡Contraseña restablecida exitosamente! Ya puedes iniciar sesión.');
      setRecoveryMode(false);
      setEmail(recoveryEmail);
      setPassword('');
    } catch (err: any) {
      setErrorMessage(err?.message || 'El código es inválido o ha expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    setErrorMessage('');
    setSuccessMessage('');
    if (recoveryMode) {
      setRecoveryMode(false);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-100 dark:bg-slate-950">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <View className="pt-2 px-4 pb-1 flex-row items-center justify-between">
          <Pressable
            onPress={goBack}
            className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 items-center justify-center"
          >
            <ArrowLeft size={16} color="#64748b" />
          </Pressable>
          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500">UniWheels</Text>
        </View>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 sm:px-8 py-6">
            <View className="w-full max-w-md mx-auto gap-5">
              <View className="gap-1">
                <Text className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {recoveryMode ? 'Recuperar Clave' : 'Iniciar Sesión'}
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  {recoveryMode
                    ? 'Te enviaremos un código de 6 dígitos'
                    : 'Ingresa con tu correo institucional universitario'}
                </Text>
              </View>

              <AlertBanner message={errorMessage} type="error" title="Error de Acceso" onClose={() => setErrorMessage('')} />
              <AlertBanner
                message={successMessage}
                type="success"
                title="Operación Exitosa"
                onClose={() => setSuccessMessage('')}
              />

              {!recoveryMode ? (
                <View className="gap-4">
                  <View className="gap-1.5">
                    <View className="flex-row items-center gap-1.5">
                      <Mail size={14} color="#0284c7" />
                      <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Correo Institucional</Text>
                    </View>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      placeholder="ej: usuario@unab.edu.co"
                      placeholderTextColor="#94a3b8"
                      className="text-xs rounded-2xl px-4 py-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </View>

                  <View className="gap-1.5">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1.5">
                        <Lock size={14} color="#0284c7" />
                        <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Contraseña</Text>
                      </View>
                      <Pressable
                        onPress={() => {
                          setRecoveryMode(true);
                          setRecoveryStep(1);
                          setRecoveryEmail(email);
                          setErrorMessage('');
                          setSuccessMessage('');
                        }}
                      >
                        <Text className="text-[11px] font-bold text-lochmara-500">¿Olvidaste tu clave?</Text>
                      </Pressable>
                    </View>
                    <View className="relative justify-center">
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        placeholder="••••••••••••"
                        placeholderTextColor="#94a3b8"
                        className="text-xs rounded-2xl pl-4 pr-11 py-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                      <Pressable onPress={() => setShowPassword((v) => !v)} style={{ position: 'absolute', right: 14 }} hitSlop={8}>
                        {showPassword ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                      </Pressable>
                    </View>
                  </View>

                  <Pressable
                    onPress={handleLogin}
                    disabled={isLoading || !email || !password}
                    className="mt-1 rounded-2xl bg-lochmara-600 py-3.5 items-center disabled:opacity-50"
                  >
                    {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white font-bold text-xs">Ingresar a UniWheels</Text>}
                  </Pressable>
                </View>
              ) : recoveryStep === 1 ? (
                <View className="gap-4">
                  <View className="gap-1.5">
                    <View className="flex-row items-center gap-1.5">
                      <Mail size={14} color="#0284c7" />
                      <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Ingresa tu Correo Institucional</Text>
                    </View>
                    <TextInput
                      value={recoveryEmail}
                      onChangeText={setRecoveryEmail}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      placeholder="ej: usuario@unab.edu.co"
                      placeholderTextColor="#94a3b8"
                      className="text-xs rounded-2xl px-4 py-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </View>
                  <Pressable
                    onPress={solicitarCodigoRecuperacion}
                    disabled={isLoading}
                    className="rounded-2xl bg-lochmara-600 py-3.5 items-center disabled:opacity-50"
                  >
                    {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white font-bold text-xs">Enviar Código</Text>}
                  </Pressable>
                </View>
              ) : (
                <View className="gap-4">
                  <View className="gap-1.5">
                    <View className="flex-row items-center gap-1.5">
                      <KeyRound size={14} color="#0284c7" />
                      <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Código de 6 Dígitos</Text>
                    </View>
                    <TextInput
                      value={verificationCode}
                      onChangeText={(v) => setVerificationCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
                      keyboardType="number-pad"
                      maxLength={6}
                      placeholder="123456"
                      placeholderTextColor="#94a3b8"
                      className="text-center tracking-widest font-mono text-sm font-bold rounded-2xl px-4 py-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </View>
                  <View className="gap-1.5">
                    <View className="flex-row items-center gap-1.5">
                      <Lock size={14} color="#0284c7" />
                      <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Nueva Contraseña</Text>
                    </View>
                    <TextInput
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                      placeholder="Mínimo 8 caracteres"
                      placeholderTextColor="#94a3b8"
                      className="text-xs rounded-2xl px-4 py-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </View>
                  <Pressable
                    onPress={procesarRestablecimiento}
                    disabled={isLoading}
                    className="rounded-2xl bg-lochmara-600 py-3.5 items-center disabled:opacity-50"
                  >
                    {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white font-bold text-xs">Restablecer Contraseña</Text>}
                  </Pressable>
                </View>
              )}

              <View className="flex-row items-center justify-center gap-1.5 pt-2">
                <ShieldCheck size={14} color="#0284c7" />
                <Text className="text-[11px] text-slate-400 dark:text-slate-500">Autenticación Segura Sanctum JWT</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
