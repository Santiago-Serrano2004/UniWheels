import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import {
  CheckCircle2,
  CreditCard,
  Info,
  Lock,
  Star,
  Trash2,
  X,
} from 'lucide-react-native';
import { useAppStore } from '@uniwheels/shared';

export interface PaymentMethodsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentMethodsManagerModal({ isOpen, onClose }: PaymentMethodsManagerModalProps) {
  const savedCards = useAppStore((state) => state.savedCards);
  const deleteCard = useAppStore((state) => state.deleteCard);
  const setDefaultCard = useAppStore((state) => state.setDefaultCard);
  const linkedNequi = useAppStore((state) => state.linkedNequi) || '315 892 4410';

  const [feedbackMsg, setFeedbackMsg] = useState('');

  const handleSetDefault = (cardId: string, last4: string) => {
    setDefaultCard(cardId);
    setFeedbackMsg(`Tarjeta •••• ${last4} establecida como predeterminada.`);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handleDeleteCard = (cardId: string) => {
    deleteCard(cardId);
    setFeedbackMsg('Tarjeta eliminada de tu bóveda.');
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/80 items-center justify-center p-4" onPress={onClose}>
        <Pressable
          className="w-full max-w-[360px] bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 gap-3.5 shadow-2xl"
          style={{ maxHeight: '85%' }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Cabecera */}
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <View className="flex-row items-center gap-2.5">
              <View className="w-9 h-9 rounded-2xl bg-lochmara-50 dark:bg-lochmara-500/20 border border-lochmara-200 dark:border-lochmara-500/30 items-center justify-center">
                <CreditCard size={18} color="#0284c7" />
              </View>
              <View>
                <Text className="text-sm font-black text-slate-900 dark:text-white">Métodos de Pago</Text>
                <Text className="text-[10px] text-slate-400">Tarjetas y Cuentas Vinculadas</Text>
              </View>
            </View>

            <Pressable onPress={onClose} hitSlop={8} className="w-8 h-8 rounded-full items-center justify-center">
              <X size={16} color="#94a3b8" />
            </Pressable>
          </View>

          {feedbackMsg ? (
            <View className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex-row items-center gap-1.5">
              <CheckCircle2 size={14} color="#10b981" />
              <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex-1">
                {feedbackMsg}
              </Text>
            </View>
          ) : null}

          {/* Información sobre el widget seguro de Wompi */}
          <View className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex-row items-start gap-2">
            <Info size={15} color="#0284c7" className="mt-0.5" />
            <Text className="text-[11px] text-slate-600 dark:text-slate-400 flex-1 leading-relaxed">
              Para pagar con tarjeta, elige esa opción al reservar un viaje — se abre la pasarela segura de Wompi para tokenizar y procesar el pago.
            </Text>
          </View>

          {/* Lista de Tarjetas y Cuentas */}
          <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Tarjetas Tokenizadas ({savedCards.length})
            </Text>

            {savedCards.length === 0 ? (
              <View className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 items-center">
                <Text className="text-xs text-slate-400">No tienes tarjetas registradas aún.</Text>
              </View>
            ) : (
              savedCards.map((card: any) => (
                <View
                  key={card.id}
                  className={`p-3 rounded-2xl border flex-row items-center justify-between ${
                    card.isDefault
                      ? 'bg-lochmara-50/40 dark:bg-lochmara-950/20 border-lochmara-300 dark:border-lochmara-800'
                      : 'bg-slate-50/80 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <View className="flex-row items-center gap-3 flex-1 mr-2">
                    <View className="w-10 h-7 rounded-lg bg-slate-900 items-center justify-center">
                      <Text className="text-white font-black italic text-[10px]">
                        {card.brand?.toLowerCase() === 'visa' ? 'VISA' : 'MC'}
                      </Text>
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5 flex-wrap">
                        <Text className="text-xs font-black text-slate-900 dark:text-white">
                          {card.bank || 'Banco'} •••• {card.last4}
                        </Text>
                        {card.isDefault && (
                          <View className="px-1.5 py-0.2 rounded bg-lochmara-600">
                            <Text className="text-[8px] font-extrabold text-white">Predeterminada</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-[10px] text-slate-400">
                        Vence {card.expMonth}/{card.expYear} • {card.holderName}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-1">
                    {!card.isDefault && (
                      <Pressable
                        onPress={() => handleSetDefault(card.id, card.last4)}
                        className="p-1.5 rounded-lg active:bg-slate-200 dark:active:bg-slate-800"
                      >
                        <Star size={15} color="#94a3b8" />
                      </Pressable>
                    )}

                    {savedCards.length > 1 && (
                      <Pressable
                        onPress={() => handleDeleteCard(card.id)}
                        className="p-1.5 rounded-lg active:bg-rose-100 dark:active:bg-rose-950"
                      >
                        <Trash2 size={15} color="#ef4444" />
                      </Pressable>
                    )}
                  </View>
                </View>
              ))
            )}

            {/* Cuenta Nequi Vinculada */}
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 pt-2">
              Cuentas Digitales
            </Text>

            <View className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-7 rounded-lg bg-purple-900 items-center justify-center">
                  <Text className="text-white font-black text-[9px]">NEQUI</Text>
                </View>
                <View>
                  <Text className="text-xs font-black text-purple-950 dark:text-purple-300">
                    Cuenta Nequi Vinculada
                  </Text>
                  <Text className="text-[10px] font-mono text-purple-700 dark:text-purple-400">
                    {linkedNequi}
                  </Text>
                </View>
              </View>

              <View className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20">
                <Text className="text-[9px] font-bold text-purple-600 dark:text-purple-400">Verificado</Text>
              </View>
            </View>
          </ScrollView>

          {/* Pie de seguridad */}
          <View className="pt-2 border-t border-slate-100 dark:border-slate-800 flex-row items-center justify-center gap-1.5">
            <Lock size={12} color="#10b981" />
            <Text className="text-[10px] text-slate-400 text-center">
              Cifrado de extremo a extremo de grado bancario (PCI-DSS)
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
