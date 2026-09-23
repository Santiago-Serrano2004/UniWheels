import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { CreditCard, Camera, CheckCircle2, Hash, FileText } from 'lucide-react-native';
import { FormDatePicker } from '@/components/FormDatePicker';
import { FormSelect } from '@/components/FormSelect';
import type { PhotoPickerAsset } from '@/components/PhotoPickerModal';

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface DriverLicenseStepProps {
  numeroLicencia: string;
  setNumeroLicencia: (val: string) => void;
  categoriaLicencia: string;
  setCategoriaLicencia: (val: string) => void;
  vencimientoLicencia: string;
  setVencimientoLicencia: (val: string) => void;
  fotoLicencia: string | null;
  assetLicencia?: PhotoPickerAsset | null;
  tipoVehiculo: string;
  abrirSelectorFoto: (tipo: 'licencia') => void;
}

export function DriverLicenseStep({
  numeroLicencia,
  setNumeroLicencia,
  categoriaLicencia,
  setCategoriaLicencia,
  vencimientoLicencia,
  setVencimientoLicencia,
  fotoLicencia,
  assetLicencia,
  tipoVehiculo,
  abrirSelectorFoto,
}: DriverLicenseStepProps) {
  const isMoto = tipoVehiculo === 'motorcycle' || tipoVehiculo === 'moto';
  const tieneDocLicencia = Boolean(fotoLicencia || assetLicencia);
  const esPdfLicencia = assetLicencia?.mimeType === 'application/pdf' || assetLicencia?.fileName?.toLowerCase().endsWith('.pdf');

  const categoryOptions = isMoto
    ? [
        { value: 'A1', label: 'A1 (Hasta 125cc)' },
        { value: 'A2', label: 'A2 (Cualquier cilindraje)' },
      ]
    : [
        { value: 'B1', label: 'B1 (Particular)' },
        { value: 'B2', label: 'B2 (Camión / Buseta)' },
        { value: 'C1', label: 'C1 (Público Ligero)' },
      ];

  return (
    <View className="gap-3.5">
      <View className="p-4 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 gap-3 shadow-xs">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5">
            <View className="w-8 h-8 rounded-xl bg-lochmara-50 dark:bg-slate-800 items-center justify-center">
              <CreditCard size={18} color="#0284c7" />
            </View>
            <View>
              <Text className="text-xs font-black text-slate-900 dark:text-white">
                Licencia de Conducción
              </Text>
              <Text className="text-[10px] text-slate-400">Documento RUNT oficial</Text>
            </View>
          </View>
          <View className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <Text className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
              Categoría {isMoto ? 'A2' : 'B1 / C1'}
            </Text>
          </View>
        </View>

        <View className="gap-2.5">
          <View className="gap-1">
            <View className="flex-row items-center gap-1">
              <Hash size={12} color="#0284c7" />
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Número de Licencia:
              </Text>
            </View>
            <TextInput
              value={numeroLicencia}
              onChangeText={(t) => setNumeroLicencia(t.toUpperCase())}
              placeholder="Ej: 1098765432"
              placeholderTextColor="#94a3b8"
              className="py-2.5 px-3.5 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1">
              <FormSelect
                label="Categoría"
                value={categoriaLicencia}
                onChange={(val) => setCategoriaLicencia(String(val))}
                options={categoryOptions}
              />
            </View>

            <View className="flex-1">
              <FormDatePicker
                label="Vencimiento"
                value={vencimientoLicencia}
                onChange={setVencimientoLicencia}
                minDate={new Date()}
                placeholder="Fecha de vigencia"
              />
            </View>
          </View>
        </View>

        {/* Carga de Foto/PDF Licencia */}
        <Pressable
          onPress={() => abrirSelectorFoto('licencia')}
          className={`py-3 px-3.5 rounded-2xl border-2 border-dashed flex-row items-center justify-center gap-2 ${
            tieneDocLicencia
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-400'
              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
          }`}
        >
          {tieneDocLicencia ? (
            esPdfLicencia ? (
              <View className="flex-row items-center justify-between w-full">
                <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                  <View className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/40 items-center justify-center">
                    <FileText size={18} color="#e11d48" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                      {assetLicencia?.fileName || 'licencia_conduccion.pdf'}
                    </Text>
                    <Text className="text-[10px] text-slate-500 dark:text-slate-400">
                      Documento PDF{assetLicencia?.fileSize ? ` • ${formatFileSize(assetLicencia.fileSize)}` : ''}
                    </Text>
                  </View>
                </View>
                <CheckCircle2 size={16} color="#10b981" />
              </View>
            ) : (
              <>
                <CheckCircle2 size={16} color="#10b981" />
                <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  Foto frontal de licencia adjunta
                </Text>
              </>
            )
          ) : (
            <>
              <Camera size={16} color="#0284c7" />
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tomar foto o subir PDF de la licencia
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}
