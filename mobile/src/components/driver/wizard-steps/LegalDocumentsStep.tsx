import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { ShieldCheck, FileCheck, Camera, CheckCircle2, Hash } from 'lucide-react-native';
import { FormDatePicker } from '@/components/FormDatePicker';

export interface LegalDocumentsStepProps {
  numeroSoat: string;
  setNumeroSoat: (val: string) => void;
  vencimientoSoat: string;
  setVencimientoSoat: (val: string) => void;
  fotoSoat: string | null;
  numeroTecno: string;
  setNumeroTecno: (val: string) => void;
  vencimientoTecno: string;
  setVencimientoTecno: (val: string) => void;
  fotoTecno: string | null;
  requiereTecno: boolean;
  ano: string;
  tipoVehiculo: string;
  abrirSelectorFoto: (tipo: 'soat' | 'tecno') => void;
}

export function LegalDocumentsStep({
  numeroSoat,
  setNumeroSoat,
  vencimientoSoat,
  setVencimientoSoat,
  fotoSoat,
  numeroTecno,
  setNumeroTecno,
  vencimientoTecno,
  setVencimientoTecno,
  fotoTecno,
  requiereTecno,
  ano,
  abrirSelectorFoto,
}: LegalDocumentsStepProps) {
  return (
    <View className="space-y-4">
      {/* 1. TARJETA PÓLIZA SOAT */}
      <View className="p-4 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 gap-3 shadow-xs">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5">
            <View className="w-8 h-8 rounded-xl bg-lochmara-50 dark:bg-slate-800 items-center justify-center">
              <ShieldCheck size={18} color="#0284c7" />
            </View>
            <View>
              <Text className="text-xs font-black text-slate-900 dark:text-white">
                Póliza SOAT Vigente
              </Text>
              <Text className="text-[10px] text-slate-400">Seguro obligatorio de accidentes</Text>
            </View>
          </View>
          <View className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <Text className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
              Obligatorio
            </Text>
          </View>
        </View>

        {/* Campos SOAT */}
        <View className="gap-2.5">
          <View className="gap-1">
            <View className="flex-row items-center gap-1">
              <Hash size={12} color="#0284c7" />
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Número de Póliza SOAT:
              </Text>
            </View>
            <TextInput
              value={numeroSoat}
              onChangeText={(t) => setNumeroSoat(t.toUpperCase())}
              placeholder="Ej: 9820491024"
              placeholderTextColor="#94a3b8"
              className="py-2.5 px-3.5 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </View>

          <FormDatePicker
            label="Fecha de Vencimiento SOAT"
            value={vencimientoSoat}
            onChange={setVencimientoSoat}
            minDate={new Date()}
            placeholder="Seleccionar fecha de vigencia"
          />
        </View>

        {/* Botón de Carga Foto SOAT */}
        <Pressable
          onPress={() => abrirSelectorFoto('soat')}
          className={`py-3 px-3.5 rounded-2xl border-2 border-dashed flex-row items-center justify-center gap-2 ${
            fotoSoat
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-400'
              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
          }`}
        >
          {fotoSoat ? (
            <CheckCircle2 size={16} color="#10b981" />
          ) : (
            <Camera size={16} color="#0284c7" />
          )}
          <Text
            className={`text-xs font-bold ${
              fotoSoat
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {fotoSoat ? 'Foto de póliza SOAT adjunta' : 'Tomar o subir foto de la póliza SOAT'}
          </Text>
        </Pressable>
      </View>

      {/* 2. TARJETA REVISIÓN TÉCNICO-MECÁNICA (RTM) */}
      {requiereTecno ? (
        <View className="p-4 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 gap-3 shadow-xs">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5">
              <View className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 items-center justify-center">
                <FileCheck size={18} color="#f59e0b" />
              </View>
              <View>
                <Text className="text-xs font-black text-slate-900 dark:text-white">
                  Revisión Técnico-Mecánica (RTM)
                </Text>
                <Text className="text-[10px] text-slate-400">Certificado CDA autorizado</Text>
              </View>
            </View>
            <View className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <Text className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
                Por Ley
              </Text>
            </View>
          </View>

          {/* Campos RTM */}
          <View className="gap-2.5">
            <View className="gap-1">
              <View className="flex-row items-center gap-1">
                <Hash size={12} color="#f59e0b" />
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Número de Certificado RTM:
                </Text>
              </View>
              <TextInput
                value={numeroTecno}
                onChangeText={(t) => setNumeroTecno(t.toUpperCase())}
                placeholder="Ej: CDA-89210"
                placeholderTextColor="#94a3b8"
                className="py-2.5 px-3.5 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </View>

            <FormDatePicker
              label="Fecha de Vencimiento RTM"
              value={vencimientoTecno}
              onChange={setVencimientoTecno}
              minDate={new Date()}
              placeholder="Seleccionar fecha de vigencia"
            />
          </View>

          {/* Botón de Carga Foto RTM */}
          <Pressable
            onPress={() => abrirSelectorFoto('tecno')}
            className={`py-3 px-3.5 rounded-2xl border-2 border-dashed flex-row items-center justify-center gap-2 ${
              fotoTecno
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-400'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
            }`}
          >
            {fotoTecno ? (
              <CheckCircle2 size={16} color="#10b981" />
            ) : (
              <Camera size={16} color="#f59e0b" />
            )}
            <Text
              className={`text-xs font-bold ${
                fotoTecno
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {fotoTecno ? 'Certificado RTM adjunto' : 'Tomar o subir foto de la RTM'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="p-4 rounded-3xl border bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 flex-row items-center gap-3">
          <View className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 items-center justify-center">
            <CheckCircle2 size={18} color="#10b981" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold text-slate-900 dark:text-white">
              Exento de Revisión Técnico-Mecánica
            </Text>
            <Text className="text-[11px] text-slate-500 dark:text-slate-400">
              Vehículo modelo {ano} no requiere RTM por antigüedad (Ley 2294 de 2023).
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
