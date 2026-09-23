import { useState, type ComponentType } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronDown, X } from 'lucide-react-native';

export type FormSelectOption = { value: string | number; label: string };

/**
 * Equivalente a frontend/src/components/common/FormSelect.jsx — selector
 * unificado para iOS y Android con hoja modal inferior (bottom-sheet) y
 * selección visual coherente con el sistema de diseño de UniWheels, evitando la
 * rueda inline de UIPickerView en iOS.
 */
export function FormSelect({
  label,
  icon: Icon,
  value,
  onChange,
  options,
  helperText,
}: {
  label?: string;
  icon?: ComponentType<{ size?: number; color?: string }>;
  value: string | number;
  onChange: (value: string | number) => void;
  options: FormSelectOption[];
  helperText?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get('window').height;
  const maxListHeight = screenHeight * 0.6;

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <View className="gap-1">
      {label && (
        <View className="flex-row items-center gap-1.5">
          {Icon && <Icon size={13} color="#0284c7" />}
          <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</Text>
        </View>
      )}

      <Pressable
        onPress={() => setIsOpen(true)}
        className="flex-row items-center justify-between py-3 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 active:bg-slate-100 dark:active:bg-slate-900"
      >
        <Text
          className={`text-xs font-bold flex-1 mr-2 ${
            selectedOption ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
          }`}
          numberOfLines={1}
        >
          {selectedOption ? selectedOption.label : 'Seleccionar...'}
        </Text>
        <ChevronDown size={15} color="#64748b" />
      </Pressable>

      {helperText && <Text className="text-[10px] text-slate-500 dark:text-slate-400">{helperText}</Text>}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/60 justify-end"
          onPress={() => setIsOpen(false)}
        >
          <Pressable
            className="w-full bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 pt-3 px-4"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="items-center mb-2">
              <View className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            </View>

            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <View className="flex-row items-center gap-2 flex-1 min-w-0">
                {Icon && <Icon size={15} color="#0284c7" />}
                <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                  {label || 'Seleccionar opción'}
                </Text>
              </View>
              <Pressable
                onPress={() => setIsOpen(false)}
                hitSlop={8}
                className="p-1 rounded-lg"
              >
                <X size={18} color="#94a3b8" />
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: maxListHeight }}
              contentContainerStyle={{ paddingVertical: 8, gap: 4 }}
              showsVerticalScrollIndicator={true}
            >
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <Pressable
                    key={String(opt.value)}
                    onPress={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`flex-row items-center justify-between p-3.5 rounded-2xl ${
                      isSelected
                        ? 'bg-lochmara-50/70 dark:bg-slate-950 border border-lochmara-500/30'
                        : 'active:bg-slate-100 dark:active:bg-slate-800'
                    }`}
                  >
                    <Text
                      className={`text-xs flex-1 mr-2 ${
                        isSelected
                          ? 'font-black text-lochmara-600 dark:text-lochmara-400'
                          : 'font-bold text-slate-700 dark:text-slate-300'
                      }`}
                      numberOfLines={2}
                    >
                      {opt.label}
                    </Text>
                    {isSelected && <Check size={16} color="#0284c7" strokeWidth={2.5} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
