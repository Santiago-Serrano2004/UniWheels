import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { CheckCircle2, Star, ThumbsUp, X } from 'lucide-react-native';

const RATING_LABELS: Record<number, string> = {
  5: 'Excelente viaje',
  4: 'Muy buen servicio',
  3: 'Viaje promedio',
  2: 'Regular',
  1: 'Mala experiencia',
};

const DRIVER_TAGS = [
  'Manejo Prudente y Seguro',
  'Vehículo Limpio y Cómodo',
  'Puntualidad Perfecta',
  'Excelente Música y Charla',
  'Ruta Eficiente',
];
const PASSENGER_TAGS = [
  'Puntual en el Punto de Abordaje',
  'Excelente Compañero de Viaje',
  'Amable y Respetuoso',
  'Pago Rápido y Exacto',
  'Comunicación Clara',
];

/**
 * Equivalente a frontend/src/components/common/RatingFeedbackModal.jsx.
 * Nota de fidelidad: en la web, `selectedTags` se recolecta en la UI pero
 * `guardarCalificacion` en PassengerTripsView.jsx solo envía `{rating, comment}`
 * al backend — las etiquetas nunca llegan a la API ahí tampoco. Se replica el
 * mismo comportamiento (UI de etiquetas real, pero no se envían al submit).
 */
export function RatingFeedbackModal({
  isOpen,
  onClose,
  targetType = 'driver',
  targetName = 'Conductor Universitario',
  onSubmitRating,
}: {
  isOpen: boolean;
  onClose: () => void;
  targetType?: 'driver' | 'passenger';
  targetName?: string;
  onSubmitRating: (payload: { rating: number; tags: string[]; comment: string }) => void;
}) {
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comentario, setComentario] = useState('');
  const [enviado, setEnviado] = useState(false);

  const isRatingDriver = targetType === 'driver';
  const availableTags = isRatingDriver ? DRIVER_TAGS : PASSENGER_TAGS;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const reset = () => {
    setRating(5);
    setSelectedTags([]);
    setComentario('');
    setEnviado(false);
  };

  const enviarCalificacion = () => {
    setEnviado(true);
    setTimeout(() => {
      onSubmitRating({ rating, tags: selectedTags, comment: comentario });
      reset();
      onClose();
    }, 1200);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable className="flex-1 bg-black/75 items-center justify-center p-4" onPress={handleClose}>
        <Pressable
          className="w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800"
          style={{ maxHeight: '85%' }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 items-center justify-center">
                <Star size={16} color="#f59e0b" fill="#f59e0b" />
              </View>
              <View>
                <Text className="text-xs font-bold text-slate-900 dark:text-white">
                  {isRatingDriver ? 'Calificar Conductor' : 'Calificar Pasajero'}
                </Text>
                <Text className="text-[10px] text-slate-500 dark:text-slate-400">{targetName}</Text>
              </View>
            </View>
            <Pressable onPress={handleClose} hitSlop={8} className="p-1">
              <X size={16} color="#94a3b8" />
            </Pressable>
          </View>

          {enviado ? (
            <View className="py-6 items-center gap-2">
              <View className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 items-center justify-center">
                <CheckCircle2 size={24} color="#10b981" />
              </View>
              <Text className="text-xs font-bold text-slate-900 dark:text-white">¡Calificación Enviada!</Text>
              <Text className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                Gracias por contribuir a la reputación y confianza de tu comunidad universitaria.
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingTop: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
              {/* Estrellas */}
              <View className="items-center gap-1">
                <Text className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  ¿Cómo fue tu experiencia en este recorrido?
                </Text>
                <View className="flex-row items-center gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable key={star} onPress={() => setRating(star)} hitSlop={4} className="p-1">
                      <Star
                        size={28}
                        color={rating >= star ? '#fbbf24' : '#e2e8f0'}
                        fill={rating >= star ? '#fbbf24' : 'transparent'}
                      />
                    </Pressable>
                  ))}
                </View>
                <Text className="text-[11px] font-bold text-amber-500">{RATING_LABELS[rating]}</Text>
              </View>

              {/* Etiquetas */}
              <View className="gap-1.5">
                <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">¿Qué deseas destacar?</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <Pressable
                        key={tag}
                        onPress={() => toggleTag(tag)}
                        className={`px-2.5 py-1 rounded-xl border ${
                          isSelected
                            ? 'bg-lochmara-600 border-lochmara-600'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <Text className={`text-[10px] font-semibold ${isSelected ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                          {tag}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Comentario */}
              <View className="gap-1">
                <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Comentario (Opcional):</Text>
                <TextInput
                  value={comentario}
                  onChangeText={setComentario}
                  placeholder="Escribe un breve mensaje..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={2}
                  className="text-xs rounded-2xl p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  style={{ minHeight: 56, textAlignVertical: 'top' }}
                />
              </View>

              <Pressable onPress={enviarCalificacion} className="py-3 rounded-2xl bg-lochmara-600 flex-row items-center justify-center gap-1.5">
                <ThumbsUp size={14} color="#ffffff" />
                <Text className="text-white text-xs font-bold">Enviar Calificación</Text>
              </Pressable>
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
