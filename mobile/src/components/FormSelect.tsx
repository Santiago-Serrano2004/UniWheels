import { useState, type ComponentType } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronDown, Search, X } from 'lucide-react-native';

export type FormSelectOption = { value: string | number; label: string };

const removeAccentsAndCase = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/**
 * Selector unificado para iOS y Android con hoja modal inferior (bottom-sheet),
 * búsqueda opcional insensible a mayúsculas y acentos, y selección visual coherente.
 */
export function FormSelect({
  label,
  icon: Icon,
  value,
  onChange,
  options,
  helperText,
  searchable = false,
}: {
  label?: string;
  icon?: ComponentType<{ size?: number; color?: string }>;
  value: string | number;
  onChange: (value: string | number) => void;
  options: FormSelectOption[];
  helperText?: string;
  searchable?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get('window').height;
  const maxListHeight = screenHeight * 0.55;

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable && searchQuery.trim()
    ? options.filter((opt) =>
        removeAccentsAndCase(opt.label).includes(removeAccentsAndCase(searchQuery.trim()))
      )
    : options;

  const handleOpen = () => {
    setSearchQuery('');
    setIsOpen(true);
  };

  const handleClose = () => {
    setSearchQuery('');
    setIsOpen(false);
  };

  return (
    <View className="gap-1">
      {label && (
        <View className="flex-row items-center gap-1.5">
          {Icon && <Icon size={13} color="#0284c7" />}
          <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</Text>
        </View>
      )}

      <Pressable
        onPress={handleOpen}
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
        onRequestClose={handleClose}
      >
        <Pressable
          className="flex-1 bg-black/60 justify-end"
          onPress={handleClose}
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
                onPress={handleClose}
                hitSlop={8}
                className="p-1 rounded-lg"
              >
                <X size={18} color="#94a3b8" />
              </Pressable>
            </View>

            {searchable && (
              <View className="mt-3 flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 gap-2 border border-slate-200 dark:border-slate-700">
                <Search size={14} color="#64748b" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Buscar..."
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                  className="flex-1 text-xs font-medium text-slate-900 dark:text-white p-0"
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                    <X size={14} color="#94a3b8" />
                  </Pressable>
                )}
              </View>
            )}

            <ScrollView
              style={{ maxHeight: maxListHeight }}
              contentContainerStyle={{ paddingVertical: 8, gap: 4 }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {filteredOptions.length === 0 ? (
                <View className="py-6 items-center">
                  <Text className="text-xs text-slate-400 dark:text-slate-500">
                    No se encontraron resultados
                  </Text>
                </View>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <Pressable
                      key={String(opt.value)}
                      onPress={() => {
                        onChange(opt.value);
                        handleClose();
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
                })
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
