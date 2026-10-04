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
                <Text className="text-sm font-bold text-slate-900 dark:text-white">Tratamiento de datos personales</Text>
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">Ley 1581 de 2012 y Decreto 1377 de 2013</Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={8} className="p-1.5">
              <X size={16} color="#94a3b8" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingVertical: 12, gap: 12 }}>
            <View className="p-2.5 rounded-2xl bg-lochmara-50/70 dark:bg-slate-950 border border-lochmara-100 dark:border-slate-800">
              <Text className="text-[11px] font-medium text-lochmara-900 dark:text-slate-300 leading-relaxed">
                <Text className="font-bold">Responsable del tratamiento.</Text> UniWheels. Contacto: uniwheelscontact@gmail.com. La institución educativa que ofrece UniWheels a su comunidad accede a los datos necesarios para administrar el servicio desde su panel de Bienestar.
              </Text>
            </View>

            <View className="gap-1">
              <View className="flex-row items-center gap-1.5">
                <FileText size={13} color="#0284c7" />
                <Text className="text-xs font-bold text-slate-800 dark:text-white">1. Qué datos tratamos</Text>
              </View>
              <View className="pl-3 gap-0.5">
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">• Nombre, correo institucional, código o rol en la universidad, sede y teléfono si lo registras.</Text>
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">• Rutas publicadas, reservas y ubicación durante los viajes activos.</Text>
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">• Si eres conductor: datos del vehículo y documentos (licencia de conducción, SOAT, revisión técnico-mecánica) y tu firma de autorización.</Text>
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">• Calificaciones, cancelaciones y reportes de seguridad (SOS).</Text>
              </View>
            </View>

            <View className="gap-1">
              <View className="flex-row items-center gap-1.5">
                <FileText size={13} color="#0284c7" />
                <Text className="text-xs font-bold text-slate-800 dark:text-white">2. Para qué los usamos</Text>
              </View>
              <View className="pl-3 gap-0.5">
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">• Verificar que perteneces a la comunidad universitaria.</Text>
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">• Conectar conductores y pasajeros con rutas compatibles.</Text>
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">• Permitir la revisión de los documentos del conductor por parte de Bienestar Universitario.</Text>
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">• Atender emergencias reportadas con el botón SOS y mejorar la seguridad de los viajes.</Text>
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">• Aplicar las reglas de uso, como las cancelaciones tardías y las suspensiones.</Text>
              </View>
            </View>

            <View className="gap-1">
              <View className="flex-row items-center gap-1.5">
                <ShieldCheck size={13} color="#0284c7" />
                <Text className="text-xs font-bold text-slate-800 dark:text-white">3. Lo que no hacemos</Text>
              </View>
              <View className="pl-3 gap-0.5">
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">• No vendemos ni compartimos tus datos con terceros para publicidad.</Text>
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">• No procesamos pagos ni guardamos datos de tarjetas o cuentas bancarias: los aportes se pagan directamente entre usuarios.</Text>
              </View>
            </View>

            <View className="gap-1">
              <View className="flex-row items-center gap-1.5">
                <ShieldCheck size={13} color="#0284c7" />
                <Text className="text-xs font-bold text-slate-800 dark:text-white">4. Seguridad y conservación</Text>
              </View>
              <View className="pl-3 gap-0.5">
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">• La comunicación entre la app y nuestros servidores viaja cifrada (HTTPS).</Text>
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">• El acceso a los documentos del conductor está restringido al personal autorizado de la institución.</Text>
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">• Los puntos de ubicación de los viajes se eliminan 7 días después de terminado el viaje.</Text>
              </View>
            </View>

            <View className="gap-1">
              <View className="flex-row items-center gap-1.5">
                <FileText size={13} color="#0284c7" />
                <Text className="text-xs font-bold text-slate-800 dark:text-white">5. Tus derechos</Text>
              </View>
              <Text className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Puedes conocer, actualizar y rectificar tus datos, solicitar prueba de la autorización, presentar quejas ante la Superintendencia de Industria y Comercio, y revocar la autorización o pedir que se eliminen tus datos. Para eliminarlos, usa Perfil &gt; Eliminar cuenta en la app, o escribe a uniwheelscontact@gmail.com. Respondemos en los plazos de ley: 10 días hábiles para consultas y 15 para reclamos.
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
