import React, { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
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

  const parsedDate = value ? (() => {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  })() : new Date();

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
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
        onPress={() => setShowPicker(true)}
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

      {showPicker && (
        <DateTimePicker
          value={parsedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={minDate}
          maximumDate={maxDate}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}
