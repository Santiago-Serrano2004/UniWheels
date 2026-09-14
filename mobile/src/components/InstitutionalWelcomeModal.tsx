import { Image, Modal, Pressable, Text, View } from 'react-native';
import { ArrowRight, MapPin, ShieldCheck } from 'lucide-react-native';
import { useAppStore } from '@uniwheels/shared';

// Mismo mascote institucional que la web (frontend/public/assets/institutions/
// unab-mascot.png) — el backend devuelve una ruta relativa a la propia web
// (`/assets/institutions/...`), que no resuelve a nada en RN, así que se
// empaqueta localmente igual que las fotos de campus.
const UNAB_MASCOT = require('../../assets/institutions/unab-mascot.png');

/**
 * Equivalente a frontend/src/components/common/InstitutionalWelcomeModal.jsx
 * — se muestra una vez, justo después de iniciar sesión o registrarse
 * (`showWelcomeMascot` en el store compartido, ya disparado por
 * `login()`/`register()` igual que en la web).
 */
export function InstitutionalWelcomeModal() {
  const user = useAppStore((state) => state.user);
  const showWelcomeMascot = useAppStore((state) => state.showWelcomeMascot);
  const closeWelcomeMascot = useAppStore((state) => state.closeWelcomeMascot);

  if (!user) return null;

  const nombreInstitucion = user?.institution?.name || user?.institution || 'Universidad Autónoma de Bucaramanga';
  const nombreSede = user?.campus?.name || user?.campus || 'Campus El Jardín';

  return (
    <Modal visible={showWelcomeMascot} transparent animationType="fade" onRequestClose={closeWelcomeMascot}>
      <View className="flex-1 bg-black/75 items-center justify-center p-4">
        <View className="w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 items-center">
          <View className="my-3 h-48 w-full items-center justify-center">
            <Image source={UNAB_MASCOT} style={{ maxHeight: 192, maxWidth: 200, width: '100%', height: '100%' }} resizeMode="contain" />
          </View>

          <View className="items-center gap-1.5 mb-5">
            <Text className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white text-center">
              ¡Hola, {user?.name ? user.name.split(' ')[0] : 'Estudiante'}!
            </Text>
            <Text className="text-xs font-semibold text-lochmara-500 dark:text-lochmara-400">{nombreInstitucion}</Text>
            <View className="flex-row items-center gap-1">
              <MapPin size={11} color="#0284c7" />
              <Text className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{nombreSede}</Text>
            </View>
            <Text className="text-xs leading-relaxed text-center text-slate-600 dark:text-slate-300 pt-1 max-w-xs">
              Tu cuenta universitaria ha sido validada. Ya puedes compartir y solicitar rutas diarias seguras con compañeros de tu comunidad.
            </Text>
          </View>

          <Pressable
            onPress={closeWelcomeMascot}
            className="w-full py-3.5 rounded-2xl bg-lochmara-600 flex-row items-center justify-center gap-2"
          >
            <Text className="text-white text-xs font-bold">Comenzar a Viajar</Text>
            <ArrowRight size={16} color="#ffffff" />
          </Pressable>

          <View className="flex-row items-center justify-center gap-1 pt-3">
            <ShieldCheck size={13} color="#0284c7" />
            <Text className="text-[10px] text-slate-400">Movilidad Universitaria Segura</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
