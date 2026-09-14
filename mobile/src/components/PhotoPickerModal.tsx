import * as ImagePicker from 'expo-image-picker';
import { Modal, Pressable, Text, View } from 'react-native';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';

/**
 * Equivalente FUNCIONAL a frontend/src/components/common/PhotoPickerModal.jsx.
 * La web dibuja una vista previa de cámara en vivo con `<video>`/`<canvas>` y
 * `navigator.mediaDevices.getUserMedia` — eso no existe en RN. En su lugar se
 * usa `expo-image-picker`, que abre la app de cámara nativa del sistema
 * (mismo resultado real: una foto elegida por cámara o galería), sin
 * reconstruir una previsualización en vivo propia.
 */
export function PhotoPickerModal({
  isOpen,
  onClose,
  onPhotoSelected,
  title = 'Foto de Perfil',
  subtitle = 'Usa la cámara o sube desde tu galería',
}: {
  isOpen: boolean;
  onClose: () => void;
  onPhotoSelected: (dataUrl: string) => void;
  title?: string;
  subtitle?: string;
}) {
  const tomarFoto = async () => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      onClose();
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!resultado.canceled && resultado.assets[0]?.base64) {
      onPhotoSelected(`data:image/jpeg;base64,${resultado.assets[0].base64}`);
      onClose();
    }
  };

  const elegirDeGaleria = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      onClose();
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!resultado.canceled && resultado.assets[0]?.base64) {
      onPhotoSelected(`data:image/jpeg;base64,${resultado.assets[0].base64}`);
      onClose();
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/70 items-center justify-center p-4" onPress={onClose}>
        <Pressable
          className="w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 gap-3"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <View>
              <Text className="text-sm font-bold text-slate-900 dark:text-white">{title}</Text>
              <Text className="text-[10px] text-slate-500 dark:text-slate-400">{subtitle}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} className="p-1.5">
              <X size={16} color="#94a3b8" />
            </Pressable>
          </View>

          <Pressable
            onPress={tomarFoto}
            className="p-4 rounded-2xl bg-lochmara-50/80 dark:bg-slate-950 border border-lochmara-200/80 dark:border-slate-800 flex-row items-center gap-3.5"
          >
            <View className="w-11 h-11 rounded-2xl bg-lochmara-600 items-center justify-center">
              <Camera size={20} color="#ffffff" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-900 dark:text-white">Tomar Foto con Cámara</Text>
              <Text className="text-[10px] text-slate-500 dark:text-slate-400">Usa la cámara de tu dispositivo</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={elegirDeGaleria}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex-row items-center gap-3.5"
          >
            <View className="w-11 h-11 rounded-2xl bg-slate-800 items-center justify-center">
              <ImageIcon size={20} color="#ffffff" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-900 dark:text-white">Subir desde Galería</Text>
              <Text className="text-[10px] text-slate-500 dark:text-slate-400">Selecciona una imagen en JPG o PNG</Text>
            </View>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
