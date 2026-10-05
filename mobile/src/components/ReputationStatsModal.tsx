import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Star, X } from 'lucide-react-native';

/**
 * Equivalente a frontend/src/components/profile/ReputationStatsModal.jsx.
 *
 * Diferencia real y documentada: la web destructura `estadisticasData?.passenger`
 * (con selector Pasajero/Conductor y un array `metrics` por rol) pero el
 * backend real (`GET /user/reputation-stats`, ver packages/shared/src/api.js)
 * devuelve campos planos (`puntualidad`, `amabilidad`, `conduccion_segura`,
 * `vehiculo_limpio`, `comunicacion`) — ese shape anidado nunca llega a existir
 * en producción, así que la web también termina mostrando sus valores mock
 * fijos ahí. Esta versión usa los campos PLANOS reales en vez de fingir un
 * desglose por rol que no existe en el backend.
 */
const METRIC_LABELS: Record<string, string> = {
  puntualidad: 'Puntualidad',
  amabilidad: 'Amabilidad y Respeto',
  conduccion_segura: 'Conducción Segura',
  vehiculo_limpio: 'Vehículo Limpio y Cómodo',
  comunicacion: 'Comunicación Clara',
};

export function ReputationStatsModal({
  isOpen,
  onClose,
  stats,
}: {
  isOpen: boolean;
  onClose: () => void;
  stats: any;
}) {
  const score: number | null = stats?.rating_average_passenger != null ? Number(stats.rating_average_passenger) : null;
  const totalRatings = stats?.reviews_count ?? 0;
  const metrics = Object.keys(METRIC_LABELS)
    .filter((key) => stats?.[key] != null)
    .map((key) => ({ label: METRIC_LABELS[key], scorePct: Math.round((Number(stats[key]) / 5) * 100) }));

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/75 items-center justify-center p-4" onPress={onClose}>
        <Pressable
          className="w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 gap-4"
          style={{ maxHeight: '85%' }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 items-center justify-center">
                <Star size={16} color="#fbbf24" fill="#fbbf24" />
              </View>
              <View>
                <Text className="text-xs font-bold text-slate-900 dark:text-white">Reputación y Desempeño</Text>
                <Text className="text-[10px] text-slate-500 dark:text-slate-400">Evaluaciones universitarias</Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={8} className="p-1">
              <X size={16} color="#94a3b8" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ gap: 16 }}>
            {/* Tarjeta de resumen */}
            <View className="rounded-2xl p-4 bg-slate-900 dark:bg-slate-950 border border-slate-800 gap-1">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-lochmara-400">
                Puntaje de Pasajero
              </Text>
              <View className="flex-row items-baseline gap-2">
                <Text className="text-3xl font-extrabold text-white">{score != null ? score.toFixed(2) : '—'}</Text>
                <View className="flex-row items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={14} color="#fbbf24" fill="#fbbf24" />
                  ))}
                </View>
              </View>
              <Text className="text-[11px] text-slate-300">
                Basado en <Text className="text-white font-bold">{totalRatings} calificaciones</Text> recibidas
              </Text>
            </View>

            {/* Barras por variable */}
            {metrics.length > 0 && (
              <View className="gap-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Variables de Calificación</Text>
                  <Text className="text-[10px] text-slate-400">Satisfacción</Text>
                </View>
                <View className="gap-2.5">
                  {metrics.map((m) => (
                    <View key={m.label} className="gap-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-[11px] font-semibold text-slate-800 dark:text-slate-300">{m.label}</Text>
                        <Text className="text-[11px] font-extrabold text-lochmara-700 dark:text-lochmara-400">{m.scorePct}%</Text>
                      </View>
                      <View className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-950 dark:border dark:border-slate-800 overflow-hidden">
                        <View className="h-full rounded-full bg-lochmara-500" style={{ width: `${m.scorePct}%` }} />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <Pressable onPress={onClose} className="py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 items-center">
            <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Cerrar Estadísticas</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
