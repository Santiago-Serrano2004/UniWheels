import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Hash, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { validarPlacaColombiana, formatearPlacaVisual } from '@uniwheels/shared';

export interface ColombianPlateInputProps {
  value: string;
  onChangeText: (text: string) => void;
  vehicleType?: 'car' | 'motorcycle' | 'carro' | 'moto';
  municipality?: string;
  error?: string;
  disabled?: boolean;
}

export function ColombianPlateInput({
  value = '',
  onChangeText,
  vehicleType = 'car',
  municipality = 'BUCARAMANGA',
  error,
  disabled = false,
}: ColombianPlateInputProps) {
  const normType = vehicleType === 'motorcycle' || vehicleType === 'moto' ? 'motorcycle' : 'car';

  const handleChange = (rawText: string) => {
    const cleaned = rawText.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    onChangeText(cleaned);
  };

  const formattedDisplay = formatearPlacaVisual(value, normType);
  const validation = validarPlacaColombiana(value, normType);
  const isValid = validation.valida;
  const showCustomError = Boolean(error);
  const displayError = error || (value.length > 0 && !isValid ? validation.error : undefined);

  return (
    <View className="space-y-2.5">
      {/* Encabezado con etiquetas */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Hash size={14} color="#0284c7" />
          <Text className="text-xs font-bold text-slate-700 dark:text-slate-200">
            Placa Vehicular Oficial
          </Text>
        </View>

        <View className="flex-row items-center gap-1">
          {isValid ? (
            <>
              <CheckCircle2 size={12} color="#10b981" />
              <Text className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Formato Válido RUNT
              </Text>
            </>
          ) : (
            <Text className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              6 caracteres alfanuméricos
            </Text>
          )}
        </View>
      </View>

      {/* Chasis Visual de la Placa Oficial Colombiana */}
      <View
        className="w-full max-w-[280px] self-center h-[104px] rounded-2xl p-2 items-center justify-between border-4 border-slate-900 bg-amber-400 dark:border-slate-800 shadow-md relative"
        style={{
          backgroundColor: '#F5B800',
        }}
      >
        {/* Remaches / Tornillos en las esquinas */}
        <View className="absolute top-1.5 left-2 w-2 h-2 rounded-full bg-slate-300 border border-slate-600" />
        <View className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-slate-300 border border-slate-600" />
        <View className="absolute bottom-1.5 left-2 w-2 h-2 rounded-full bg-slate-300 border border-slate-600" />
        <View className="absolute bottom-1.5 right-2 w-2 h-2 rounded-full bg-slate-300 border border-slate-600" />

        {/* Encabezado: COLOMBIA */}
        <Text className="text-[10px] font-black tracking-[0.25em] text-slate-900 uppercase pt-0.5">
          COLOMBIA
        </Text>

        {/* Centro: Caracteres con tipografía vehicular */}
        <Text className="font-mono font-black text-2xl tracking-[0.2em] text-slate-950">
          {formattedDisplay}
        </Text>

        {/* Pie: Municipio de Matrícula */}
        <Text className="text-[9px] font-black tracking-[0.2em] text-slate-800 uppercase pb-0.5">
          {municipality}
        </Text>
      </View>

      {/* Input de Entrada de Texto Estandarizado */}
      <View className="mt-1">
        <TextInput
          editable={!disabled}
          value={value}
          onChangeText={handleChange}
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder={normType === 'car' ? 'Ej: KLU492' : 'Ej: UAB12D'}
          placeholderTextColor="#94a3b8"
          className={`w-full text-center font-mono font-bold text-sm rounded-2xl px-4 py-3 border tracking-widest uppercase bg-white dark:bg-slate-900 ${
            showCustomError || (value.length > 0 && !isValid)
              ? 'border-rose-500 text-rose-600 dark:text-rose-400'
              : isValid
              ? 'border-emerald-500 text-slate-900 dark:text-white'
              : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
          }`}
        />
      </View>

      {/* Mensaje de error / advertencia de formato */}
      {displayError ? (
        <View className="flex-row items-center gap-1.5 mt-0.5 px-1">
          <AlertCircle size={12} color="#e11d48" />
          <Text className="text-[11px] font-medium text-rose-600 dark:text-rose-400 flex-1">
            {displayError}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
