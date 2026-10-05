import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  Mail,
  BookOpen,
  Star,
  LogOut,
  Trash2,
  Car,
  ChevronRight,
  AlertTriangle,
  Home,
  X,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import { authService, tripsService, useAppStore } from '@uniwheels/shared';
import { SetHomeLocationModal } from '@/components/SetHomeLocationModal';
import { ReputationStatsModal } from '@/components/ReputationStatsModal';
import { SmartMatchAlertsModal } from '@/components/SmartMatchAlertsModal';

/**
 * Equivalente a frontend/src/components/profile/ProfileView.jsx — tarjeta de
 * identidad + gestión de rol conductor + reputación real + sesión.
 */
export default function ProfileScreen() {
  const user = useAppStore((state) => state.user);
  const activeRole = useAppStore((state) => state.activeRole);
  const toggleRole = useAppStore((state) => state.toggleRole);
  const openDriverInviteModal = useAppStore((state) => state.openDriverInviteModal);
  const logout = useAppStore((state) => state.logout);
  const savedHomeLocation = useAppStore((state) => state.savedHomeLocation);
  const isDriver = Boolean(user?.isDriver);

  const [stats, setStats] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [modalCasaAbierto, setModalCasaAbierto] = useState(false);
  const [modalReputacionAbierto, setModalReputacionAbierto] = useState(false);
  const [modalAlertasAbierto, setModalAlertasAbierto] = useState(false);

  useEffect(() => {
    tripsService.getUserReputationStats().then(setStats);
  }, []);

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'UN';

  const confirmarEliminarCuenta = async () => {
    setIsDeleting(true);
    try {
      await authService.deleteAccount();
    } catch (error: any) {
      setIsDeleting(false);
      Alert.alert('No se pudo eliminar la cuenta', error?.message || 'Inténtalo de nuevo más tarde.');
      return;
    }
    setIsDeleting(false);
    setModalEliminarAbierto(false);
    logout();
    Alert.alert('Tu cuenta fue eliminada.');
  };

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-slate-100 dark:bg-slate-950">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* Tarjeta de identidad */}
        <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 items-center gap-3">
          <View className="relative">
            <View className="w-20 h-20 rounded-full bg-lochmara-600 p-1">
              <View className="w-full h-full rounded-full bg-white dark:bg-slate-950 items-center justify-center">
                <Text className="text-2xl font-extrabold text-lochmara-800 dark:text-lochmara-300">{initials}</Text>
              </View>
            </View>
            <View className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 items-center justify-center">
              <ShieldCheck size={13} color="#ffffff" />
            </View>
          </View>

          <View className="items-center">
            <Text className="text-base font-extrabold text-slate-900 dark:text-white">{user?.name || 'Estudiante'}</Text>
            <View className="flex-row items-center gap-1 mt-0.5">
              <Mail size={11} color="#0284c7" />
              <Text className="text-xs text-slate-400">{user?.email || '—'}</Text>
            </View>
          </View>

          <View className="flex-row gap-2">
            <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-lochmara-50 dark:bg-slate-950 border border-lochmara-200 dark:border-slate-800">
              <BookOpen size={13} color="#0284c7" />
              <Text className="text-xs font-semibold text-lochmara-800 dark:text-lochmara-300">
                Código: {user?.studentCode || '—'}
              </Text>
            </View>
            <View className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <Text className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {isDriver ? 'Conductor Verificado' : user?.driverStatus === 'pending' ? 'Verificación en Trámite' : 'Pasajero Institucional'}
              </Text>
            </View>
          </View>
        </View>

        {/* Sección de Conductor */}
        {user?.isDriver ? (
          <View className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 gap-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 items-center justify-center">
                  <ShieldCheck size={18} color="#10b981" />
                </View>
                <View>
                  <Text className="text-xs font-bold text-slate-900 dark:text-white">Estado de Conductor</Text>
                  <Text className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Verificado · {activeRole === 'driver' ? 'Modo Conductor Activo' : 'Modo Pasajero Activo'}
                  </Text>
                </View>
              </View>
              <View className="bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
                <Text className="text-[10px] font-bold text-emerald-500 uppercase">Verificado</Text>
              </View>
            </View>

            <Pressable
              onPress={toggleRole}
              className={`w-full py-2.5 rounded-2xl flex-row items-center justify-center gap-2 ${
                activeRole === 'driver'
                  ? 'bg-slate-900 dark:bg-slate-800'
                  : 'bg-emerald-600 active:bg-emerald-700'
              }`}
            >
              <Car size={15} color="#ffffff" />
              <Text className="text-white text-xs font-bold">
                {activeRole === 'driver' ? 'Cambiar a Modo Pasajero' : 'Cambiar a Modo Conductor'}
              </Text>
            </Pressable>
          </View>
        ) : user?.driverStatus === 'pending' ? (
          <View className="bg-amber-50 dark:bg-slate-900 rounded-3xl p-4 border border-amber-200 dark:border-amber-500/30 flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 items-center justify-center">
              <Clock size={18} color="#f59e0b" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-900 dark:text-white">Verificación en Trámite</Text>
              <Text className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                Tu solicitud de conductor está siendo revisada por Bienestar Universitario.
              </Text>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={openDriverInviteModal}
            className="bg-lochmara-50 dark:bg-slate-900 rounded-3xl p-4 border border-lochmara-200 dark:border-slate-800 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3 flex-1">
              <View className="w-10 h-10 rounded-2xl bg-lochmara-600 items-center justify-center">
                <Car size={18} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-900 dark:text-white">¿Tienes vehículo propio?</Text>
                <Text className="text-[11px] text-slate-600 dark:text-slate-400">
                  Conduce en UniWheels y comparte gastos de gasolina
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color="#0284c7" />
          </Pressable>
        )}

        {/* Menú de opciones — mismo patrón que menuOptions en ProfileView.jsx */}
        <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <Pressable
            onPress={() => setModalCasaAbierto(true)}
            className="flex-row items-center gap-3 p-3.5 border-b border-slate-100 dark:border-slate-800"
          >
            <View className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 items-center justify-center">
              <Home size={16} color="#f59e0b" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-900 dark:text-white">Ubicación Favorita (Casa)</Text>
              <Text className="text-[10px] text-slate-500" numberOfLines={1}>
                {savedHomeLocation?.address || 'Configura tu dirección habitual de recogida'}
              </Text>
            </View>
            <ChevronRight size={15} color="#94a3b8" />
          </Pressable>

          <Pressable
            onPress={() => setModalAlertasAbierto(true)}
            className="flex-row items-center gap-3 p-3.5 border-b border-slate-100 dark:border-slate-800"
          >
            <View className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 items-center justify-center">
              <Sparkles size={16} color="#f59e0b" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-900 dark:text-white">Alertas Smart Match</Text>
              <Text className="text-[10px] text-slate-500" numberOfLines={1}>
                Rutinas de clase y sugerencias automáticas de conductores
              </Text>
            </View>
            <ChevronRight size={15} color="#94a3b8" />
          </Pressable>

          <Pressable onPress={() => setModalReputacionAbierto(true)} className="flex-row items-center gap-3 p-3.5">
            <View className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 items-center justify-center">
              <Star size={16} color="#f59e0b" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-900 dark:text-white">Reputación y Calificaciones</Text>
              <Text className="text-[10px] text-slate-500">
                {stats
                  ? `${stats.rating_average?.toFixed(1) ?? '—'} ★ · ${stats.total_trips ?? 0} viaje(s) · ${stats.reviews_count ?? 0} reseña(s)`
                  : 'Cargando...'}
              </Text>
            </View>
            <ChevronRight size={15} color="#94a3b8" />
          </Pressable>
        </View>

        {/* Sesión */}
        <View className="gap-2 mt-1">
          <Pressable
            onPress={logout}
            className="w-full py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-row items-center justify-center gap-2"
          >
            <LogOut size={15} color="#94a3b8" />
            <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Cerrar Sesión</Text>
          </Pressable>

          <Pressable
            onPress={() => setModalEliminarAbierto(true)}
            className="w-full py-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex-row items-center justify-center gap-2"
          >
            <Trash2 size={15} color="#e11d48" />
            <Text className="text-xs font-bold text-rose-600 dark:text-rose-400">Eliminar Cuenta</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Modal de confirmación de eliminación de cuenta — mismo diseño que
          frontend/src/components/profile/ProfileView.jsx */}
      <Modal visible={modalEliminarAbierto} transparent animationType="fade" onRequestClose={() => setModalEliminarAbierto(false)}>
        <Pressable className="flex-1 bg-black/70 items-center justify-center p-4" onPress={() => setModalEliminarAbierto(false)}>
          <Pressable
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 gap-4"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between">
              <View className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 items-center justify-center">
                <AlertTriangle size={22} color="#f43f5e" />
              </View>
              <Pressable onPress={() => setModalEliminarAbierto(false)} hitSlop={8} className="w-8 h-8 rounded-full items-center justify-center">
                <X size={16} color="#94a3b8" />
              </Pressable>
            </View>

            <View className="gap-1">
              <Text className="text-base font-extrabold text-rose-500">¿Deseas eliminar tu cuenta?</Text>
              <Text className="text-xs text-slate-600 dark:text-slate-400">
                Esta acción desactivará tu perfil, tus estadísticas de viaje y tus métodos de pago bajo el cumplimiento de la Ley 1581 (Habeas Data).
              </Text>
            </View>

            <View className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 gap-1">
              <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300">Te enviaremos un correo de despedida:</Text>
              <Text className="text-[11px] font-mono text-lochmara-600 dark:text-lochmara-400">{user?.email}</Text>
            </View>

            <View className="flex-row gap-2 pt-1">
              <Pressable
                onPress={() => setModalEliminarAbierto(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 items-center disabled:opacity-50"
              >
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={confirmarEliminarCuenta}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 flex-row items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text className="text-white text-xs font-bold">Eliminando...</Text>
                  </>
                ) : (
                  <Text className="text-white text-xs font-bold">Sí, Eliminar</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <SetHomeLocationModal isOpen={modalCasaAbierto} onClose={() => setModalCasaAbierto(false)} />
      <ReputationStatsModal isOpen={modalReputacionAbierto} onClose={() => setModalReputacionAbierto(false)} stats={stats} />
      <SmartMatchAlertsModal isOpen={modalAlertasAbierto} onClose={() => setModalAlertasAbierto(false)} />
    </SafeAreaView>
  );
}
