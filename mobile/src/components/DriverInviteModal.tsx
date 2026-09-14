import { Alert, Modal, Pressable, Text, View } from 'react-native';
import { ArrowRight, Car, CheckCircle2, X } from 'lucide-react-native';
import { useAppStore } from '@uniwheels/shared';

/**
 * Equivalente a frontend/src/components/common/DriverInviteModal.jsx — se
 * abre al tocar la píldora de rol "Pasajero" del header (para usuarios sin
 * conductor verificado), igual que en la web.
 */
export function DriverInviteModal() {
  const showDriverInviteModal = useAppStore((state) => state.showDriverInviteModal);
  const closeDriverInviteModal = useAppStore((state) => state.closeDriverInviteModal);

  const handleRegister = () => {
    closeDriverInviteModal();
    // El wizard completo de registro de conductor es Fase 2 de este plan —
    // por ahora se informa que está en camino, igual que el resto de la UI
    // de "conductor" que aparece con un CTA equivalente en Perfil.
    Alert.alert(
      'Registro de conductor',
      'El registro completo de conductor (vehículo, documentos, SOAT) llega en una próxima actualización.'
    );
  };

  return (
    <Modal visible={showDriverInviteModal} transparent animationType="fade" onRequestClose={closeDriverInviteModal}>
      <Pressable className="flex-1 bg-black/75 items-center justify-center p-4" onPress={closeDriverInviteModal}>
        <Pressable
          className="w-full max-w-[320px] bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 items-center gap-4"
          onPress={(e) => e.stopPropagation()}
        >
          <Pressable
            onPress={closeDriverInviteModal}
            hitSlop={8}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800"
          >
            <X size={16} color="#94a3b8" />
          </Pressable>

          <View className="w-14 h-14 rounded-3xl bg-lochmara-50 dark:bg-slate-800 border border-lochmara-200 dark:border-slate-700 items-center justify-center mt-1">
            <Car size={28} color="#0284c7" />
          </View>

          <View className="items-center gap-1">
            <Text className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">Activar Modo Conductor</Text>
            <Text className="text-xs leading-relaxed text-center text-slate-500 dark:text-slate-400">
              Actualmente tu cuenta opera como <Text className="font-bold text-slate-700 dark:text-white">Pasajero</Text>. Registra tu
              vehículo para publicar rutas y compartir gastos de gasolina.
            </Text>
          </View>

          <View className="w-full gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <View className="flex-row items-center gap-2">
              <CheckCircle2 size={16} color="#10b981" />
              <Text className="text-[11px] font-medium text-slate-700 dark:text-slate-300 flex-1">
                Ahorra hasta el 70% en tus gastos de viaje
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <CheckCircle2 size={16} color="#10b981" />
              <Text className="text-[11px] font-medium text-slate-700 dark:text-slate-300 flex-1">
                100% estudiantes y docentes verificados
              </Text>
            </View>
          </View>

          <View className="w-full flex-row gap-2 pt-1">
            <Pressable
              onPress={closeDriverInviteModal}
              className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 items-center"
            >
              <Text className="text-xs font-bold text-slate-600 dark:text-slate-300">Cerrar</Text>
            </Pressable>
            <Pressable onPress={handleRegister} className="flex-1 py-3 rounded-2xl bg-lochmara-600 flex-row items-center justify-center gap-1.5">
              <Text className="text-white text-xs font-bold">Registrarme</Text>
              <ArrowRight size={14} color="#ffffff" />
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
