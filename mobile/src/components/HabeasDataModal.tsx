import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Check, FileText, ShieldCheck, X } from 'lucide-react-native';

/** Equivalente a frontend/src/components/common/HabeasDataModal.jsx — contenido legal estático (Ley 1581 de 2012). */
export function HabeasDataModal({
  isOpen,
  onClose,
  onAccept,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}) {
  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/70 items-center justify-center p-4" onPress={onClose}>
        <Pressable
          className="w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800"
          style={{ maxHeight: '78%' }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <View className="flex-row items-center gap-2">
              <View className="p-2 rounded-xl bg-lochmara-50 dark:bg-slate-800 border border-lochmara-200 dark:border-slate-700">
                <ShieldCheck size={18} color="#0284c7" />
              </View>
              <View>
                <Text className="text-sm font-bold text-slate-900 dark:text-white">Tratamiento de Datos</Text>
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">Ley 1581 de 2012 — UniWheels</Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={8} className="p-1.5">
              <X size={16} color="#94a3b8" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingVertical: 12, gap: 12 }}>
            <View className="p-2.5 rounded-2xl bg-lochmara-50/70 dark:bg-slate-950 border border-lochmara-100 dark:border-slate-800">
              <Text className="text-[11px] font-medium text-lochmara-900 dark:text-slate-300 leading-relaxed">
                En cumplimiento de la Ley Estatutaria 1581 de 2012 y el Decreto 1377 de 2013 de la República de Colombia, te
                informamos sobre el tratamiento de tus datos personales.
              </Text>
            </View>

            <View className="gap-1">
              <View className="flex-row items-center gap-1.5">
                <FileText size={13} color="#0284c7" />
                <Text className="text-xs font-bold text-slate-800 dark:text-white">1. Finalidad del Tratamiento</Text>
              </View>
              <Text className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Los datos suministrados (nombre, código institucional, correo universitario, sede y coordenadas de ruta)
                serán utilizados exclusivamente para:
              </Text>
              <View className="pl-3 gap-0.5">
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">• Validar tu pertenencia activa a la comunidad universitaria.</Text>
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">• Calcular emparejamientos y optimización de rutas compartidas.</Text>
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">• Monitorear la seguridad y telemetría de los recorridos.</Text>
              </View>
            </View>

            <View className="gap-1">
              <View className="flex-row items-center gap-1.5">
                <ShieldCheck size={13} color="#0284c7" />
                <Text className="text-xs font-bold text-slate-800 dark:text-white">2. Protección y Cero Comercialización</Text>
              </View>
              <Text className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                UniWheels no comercializa, transfiere ni comparte tu información con terceros con fines publicitarios. Tus
                trayectorias se procesan bajo cifrado y anonimización geoespacial.
              </Text>
            </View>

            <View className="gap-1">
              <View className="flex-row items-center gap-1.5">
                <FileText size={13} color="#0284c7" />
                <Text className="text-xs font-bold text-slate-800 dark:text-white">3. Derechos del Titular (Habeas Data)</Text>
              </View>
              <Text className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Como titular tienes derecho a conocer, actualizar, rectificar y revocar la autorización de tus datos en
                cualquier momento desde la sección de Perfil o mediante solicitud a Bienestar Universitario.
              </Text>
            </View>
          </ScrollView>

          <View className="pt-3 border-t border-slate-100 dark:border-slate-800 flex-row gap-2">
            <Pressable onPress={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 items-center">
              <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cerrar</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onAccept();
                onClose();
              }}
              className="flex-1 py-2.5 rounded-xl bg-lochmara-600 flex-row items-center justify-center gap-1.5"
            >
              <Check size={14} color="#ffffff" />
              <Text className="text-white text-xs font-bold">Autorizar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
