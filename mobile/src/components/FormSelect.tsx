import type { ComponentType } from 'react';
import { Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export type FormSelectOption = { value: string | number; label: string };

/**
 * Equivalente a frontend/src/components/common/FormSelect.jsx — un
 * `<select>` HTML no existe en RN, así que se usa el picker nativo real de la
 * plataforma (Android: diálogo nativo; iOS: dropdown nativo), envuelto para
 * que se vea como el resto de los campos del formulario.
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
  return (
    <View className="gap-1">
      {label && (
        <View className="flex-row items-center gap-1.5">
          {Icon && <Icon size={13} color="#0284c7" />}
          <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</Text>
        </View>
      )}
      <View className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <Picker selectedValue={value} onValueChange={onChange} mode="dropdown" dropdownIconColor="#64748b">
          {options.map((opt) => (
            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
          ))}
        </Picker>
      </View>
      {helperText && <Text className="text-[10px] text-slate-500 dark:text-slate-400">{helperText}</Text>}
    </View>
  );
}
