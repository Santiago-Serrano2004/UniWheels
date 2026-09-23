import { Modal, Pressable, Text, View } from 'react-native';

export type PickedLocation = { coords: [number, number]; address: string };

/**
 * Fallback web — el picker de mapa interactivo en WebView está optimizado
 * para la app móvil (Android/iOS).
 */
export function LocationPickerModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialCoords?: [number, number] | null;
  initialPlaceName?: string;
  title?: string;
  confirmButtonText?: string;
  onConfirm: (loc: PickedLocation) => void;
}) {
  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 items-center justify-center p-6">
        <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 gap-3 max-w-sm">
          <Text className="text-sm font-black text-slate-900 dark:text-white">No disponible en web</Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400">
            Seleccionar un punto en el mapa solo está disponible en la app nativa (Android/iOS).
          </Text>
          <Pressable onPress={onClose} className="py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center">
            <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Cerrar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
