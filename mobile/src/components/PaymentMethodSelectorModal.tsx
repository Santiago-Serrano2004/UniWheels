import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowRight, Banknote, CreditCard, Smartphone, X } from 'lucide-react-native';

export type PaymentMethodId = 'nequi_direct' | 'card_instant' | 'cash_direct';

const METODOS: {
  id: PaymentMethodId;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tag: string;
  tagBgClass: string;
  tagTextClass: string;
  description: string;
}[] = [
  {
    id: 'nequi_direct',
    title: 'Nequi / Daviplata Directo',
    subtitle: 'Transferencia QR al finalizar el viaje',
    icon: <Smartphone size={18} color="#a855f7" />,
    tag: 'Al Llegar a Destino',
    tagBgClass: 'bg-purple-500/10 border-purple-500/30',
    tagTextClass: 'text-purple-700 dark:text-purple-400',
    description: 'Le transfieres directamente al conductor al llegar al campus.',
  },
  {
    id: 'card_instant',
    title: 'Tarjeta Débito / Crédito',
    subtitle: 'Pago seguro al confirmar la reserva',
    icon: <CreditCard size={18} color="#0284c7" />,
    tag: 'Cobro Inmediato',
    tagBgClass: 'bg-lochmara-500/10 border-lochmara-500/30',
    tagTextClass: 'text-lochmara-700 dark:text-lochmara-400',
    description: 'Se abre una ventana segura de pago (Wompi) al confirmar tu reserva.',
  },
  {
    id: 'cash_direct',
    title: 'Efectivo Exacto',
    subtitle: 'Pago físico al conductor',
    icon: <Banknote size={18} color="#f59e0b" />,
    tag: 'En Mano',
    tagBgClass: 'bg-amber-500/10 border-amber-500/30',
    tagTextClass: 'text-amber-700 dark:text-amber-400',
    description: 'Pagas en billete o moneda al abordar o descender.',
  },
];

/**
 * Equivalente a frontend/src/components/trips/PaymentMethodSelectorModal.jsx.
 * Se excluye deliberadamente la sub-lista de "tarjetas guardadas" (savedCards
 * es mock sin backend real, ver packages/shared/README.md) — al elegir
 * Tarjeta, el flujo real abre directamente el Widget de Wompi, que ya pide
 * los datos de la tarjeta ahí mismo.
 */
export function PaymentMethodSelectorModal({
  isOpen,
  onClose,
  selectedMethod = 'nequi_direct',
  onSelectMethod,
  fareAmount = 4500,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedMethod?: PaymentMethodId;
  onSelectMethod: (method: PaymentMethodId) => void;
  fareAmount?: number;
}) {
  const [metodo, setMetodo] = useState<PaymentMethodId>(selectedMethod);

  const confirmar = () => {
    onSelectMethod(metodo);
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/75 items-center justify-center p-4" onPress={onClose}>
        <Pressable
          className="w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 gap-3.5"
          style={{ maxHeight: '85%' }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <View>
              <Text className="text-xs font-extrabold text-slate-900 dark:text-white">Método de Pago</Text>
              <Text className="text-[10px] text-slate-500 dark:text-slate-400">
                Aporte del viaje: <Text className="text-emerald-500 font-extrabold">$ {fareAmount.toLocaleString('es-CO')} COP</Text>
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} className="p-1">
              <X size={16} color="#94a3b8" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ gap: 8 }}>
            {METODOS.map((m) => {
              const seleccionado = metodo === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setMetodo(m.id)}
                  className={`p-3 rounded-2xl border gap-1.5 ${
                    seleccionado
                      ? 'bg-lochmara-50/50 dark:bg-slate-950 border-lochmara-400 dark:border-lochmara-500'
                      : 'bg-slate-50/60 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
                      <View className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        {m.icon}
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text className="text-xs font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                          {m.title}
                        </Text>
                        <Text className="text-[10px] text-slate-500 dark:text-slate-400" numberOfLines={1}>
                          {m.subtitle}
                        </Text>
                      </View>
                    </View>
                    <View
                      className={`w-4 h-4 rounded-full border items-center justify-center shrink-0 ${
                        seleccionado ? 'border-lochmara-500' : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {seleccionado && <View className="w-2.5 h-2.5 rounded-full bg-lochmara-500" />}
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-800">
                    <View className={`px-2 py-0.5 rounded-full border ${m.tagBgClass}`}>
                      <Text className={`text-[10px] font-bold ${m.tagTextClass}`}>{m.tag}</Text>
                    </View>
                    <Text className="text-[9px] text-slate-400 max-w-[150px] text-right" numberOfLines={1}>
                      {m.description}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable onPress={confirmar} className="py-3 rounded-2xl bg-lochmara-600 flex-row items-center justify-center gap-2">
            <Text className="text-white text-xs font-bold">Confirmar Método de Pago</Text>
            <ArrowRight size={14} color="#ffffff" />
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
