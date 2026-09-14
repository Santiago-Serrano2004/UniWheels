import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { CheckCircle2, Home, MapPin, Search, X } from 'lucide-react-native';
import { placesApiService, useAppStore } from '@uniwheels/shared';

/**
 * Equivalente a frontend/src/components/common/SetHomeLocationModal.jsx —
 * guarda una dirección de "Casa" reutilizable en el store compartido. Se deja
 * fuera de esta pasada el selector de pin en mapa (LocationPickerModal — ver
 * plan de Fase 1): la búsqueda por texto cubre el mismo caso de uso real.
 */
export function SetHomeLocationModal({
  isOpen,
  onClose,
  onLocationSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  onLocationSaved?: (loc: { name: string; address: string; coords: [number, number] }) => void;
}) {
  const setSavedHomeLocation = useAppStore((state) => state.setSavedHomeLocation);
  const [direccionTexto, setDireccionTexto] = useState('');
  const [coords, setCoords] = useState<[number, number]>([7.1193, -73.1227]);
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (!isOpen) setDireccionTexto('');
  }, [isOpen]);

  useEffect(() => {
    if (!direccionTexto || direccionTexto.trim().length < 2) {
      setSugerencias([]);
      return;
    }
    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await placesApiService.buscarLugares(direccionTexto.trim());
        setSugerencias(res || []);
      } finally {
        setBuscando(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [direccionTexto]);

  const seleccionarSugerencia = (sug: any) => {
    const dir = sug.direccion || sug.nombre;
    setDireccionTexto(dir);
    if (sug.coords) setCoords(sug.coords);
    setSugerencias([]);
  };

  const guardar = () => {
    if (!direccionTexto.trim()) return;
    const nuevaCasa = { name: 'Casa', address: direccionTexto.trim(), coords };
    setSavedHomeLocation(nuevaCasa);
    onLocationSaved?.(nuevaCasa);
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/80 items-center justify-center p-4" onPress={onClose}>
        <Pressable
          className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 gap-3"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5">
              <View className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/30 items-center justify-center">
                <Home size={17} color="#f59e0b" />
              </View>
              <View>
                <Text className="text-sm font-black text-slate-900 dark:text-white">Configura tu Casa</Text>
                <Text className="text-[10px] text-slate-400">Guarda tu dirección habitual para usarla en 1 toque</Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={8} className="p-1">
              <X size={16} color="#94a3b8" />
            </Pressable>
          </View>

          <View>
            <Text className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              Dirección de tu Casa o Residencia:
            </Text>
            <View className="flex-row items-center bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2">
              <Search size={13} color="#94a3b8" />
              <TextInput
                value={direccionTexto}
                onChangeText={setDireccionTexto}
                placeholder="Ej: Cra 27 # 45-12, Provenza, Bucaramanga..."
                placeholderTextColor="#94a3b8"
                className="flex-1 text-xs font-bold text-slate-900 dark:text-white ml-1.5 py-0"
              />
              {buscando ? (
                <ActivityIndicator size="small" color="#f59e0b" />
              ) : direccionTexto ? (
                <Pressable onPress={() => setDireccionTexto('')} hitSlop={6}>
                  <X size={12} color="#94a3b8" />
                </Pressable>
              ) : null}
            </View>

            {sugerencias.length > 0 && (
              <ScrollView style={{ maxHeight: 140 }} className="mt-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                {sugerencias.map((sug, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => seleccionarSugerencia(sug)}
                    className="p-2.5 flex-row items-center gap-2 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                  >
                    <MapPin size={13} color="#f59e0b" />
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                        {sug.nombre}
                      </Text>
                      <Text className="text-[10px] text-slate-400" numberOfLines={1}>
                        {sug.direccion}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          <View className="flex-row gap-2 pt-1">
            <Pressable onPress={onClose} className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center">
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={guardar}
              disabled={!direccionTexto.trim()}
              className="flex-1 py-2.5 rounded-2xl bg-amber-600 flex-row items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 size={14} color="#ffffff" />
              <Text className="text-xs font-bold text-white">Guardar y Usar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
