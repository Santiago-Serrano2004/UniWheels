import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';

export interface FormDatePickerProps {
  label?: string;
  value?: string; // YYYY-MM-DD
  onChange: (dateString: string) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  disabled?: boolean;
}

export function FormDatePicker({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Seleccionar fecha',
  disabled = false,
}: FormDatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const insets = useSafeAreaInsets();

  const parseValueToDate = (val?: string): Date => {
    if (!val) return new Date();
    const parts = val.split('-').map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
  };

  const [tempDate, setTempDate] = useState<Date>(() => parseValueToDate(value));

  const handleOpen = () => {
    if (disabled) return;
    setTempDate(parseValueToDate(value));
    setShowPicker(true);
  };

  const handleConfirmIos = () => {
    const year = tempDate.getFullYear();
    const month = String(tempDate.getMonth() + 1).padStart(2, '0');
    const day = String(tempDate.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${day}`);
    setShowPicker(false);
  };

  const handleAndroidDateChange = (_event: unknown, selectedDate: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    }
  };

  return (
    <View className="gap-1">
      {label && (
        <View className="flex-row items-center gap-1.5">
          <Calendar size={13} color="#0284c7" />
          <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</Text>
        </View>
      )}

      <Pressable
        disabled={disabled}
        onPress={handleOpen}
        className={`flex-row items-center justify-between py-3 px-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-950 ${
          value
            ? 'border-slate-300 dark:border-slate-700'
            : 'border-slate-200 dark:border-slate-800'
        } ${disabled ? 'opacity-50' : 'active:bg-slate-100 dark:active:bg-slate-900'}`}
      >
        <Text
          className={`text-xs font-bold ${
            value ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          {value || placeholder}
        </Text>
        <Calendar size={15} color="#64748b" />
      </Pressable>

      {/* Selector para iOS: Hoja modal inferior con botones Cancelar y Listo */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPicker(false)}
        >
          <Pressable
            className="flex-1 bg-black/60 justify-end"
            onPress={() => setShowPicker(false)}
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
                <Pressable
                  onPress={() => setShowPicker(false)}
                  hitSlop={8}
                  className="py-1 px-2 rounded-lg"
                >
                  <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Cancelar
                  </Text>
                </Pressable>

                <View className="flex-row items-center gap-1.5">
                  <Calendar size={14} color="#0284c7" />
                  <Text className="text-sm font-bold text-slate-900 dark:text-white">
                    {label || 'Seleccionar fecha'}
                  </Text>
                </View>

                <Pressable
                  onPress={handleConfirmIos}
                  hitSlop={8}
                  className="py-1 px-3 rounded-xl bg-lochmara-600 active:bg-lochmara-700"
                >
                  <Text className="text-xs font-bold text-white">
                    Listo
                  </Text>
                </Pressable>
              </View>

              <View className="py-2 items-center justify-center">
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  minimumDate={minDate}
                  maximumDate={maxDate}
                  onValueChange={(_, d) => setTempDate(d)}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Selector para Android: Diálogo nativo */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={parseValueToDate(value)}
          mode="date"
          display="default"
          minimumDate={minDate}
          maximumDate={maxDate}
          onValueChange={handleAndroidDateChange}
          onDismiss={() => setShowPicker(false)}
        />
      )}
    </View>
  );
}
