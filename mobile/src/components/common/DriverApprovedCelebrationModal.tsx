import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShieldCheck, Car, ArrowRight, CheckCircle2, X, Navigation, Banknote } from 'lucide-react-native';
import { useAppStore } from '@uniwheels/shared';

export interface DriverApprovedCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToDriver?: () => void;
}

export function DriverApprovedCelebrationModal({
  isOpen,
  onClose,
  onGoToDriver,
}: DriverApprovedCelebrationModalProps) {
  const { user, toggleRole, activeRole } = useAppStore();

  if (!isOpen) return null;

  const vehicleInfo = user?.driverApplication || user?.driverInfo || {};
  const plateNumber = vehicleInfo.plate_number || user?.vehicle?.plate_number || 'Vehículo Aprobado';
  const brandModel = vehicleInfo.brand && vehicleInfo.model_line
    ? `${vehicleInfo.brand} ${vehicleInfo.model_line}`
    : 'Automotor Registrado';
  const seats = vehicleInfo.available_seats || user?.vehicle?.available_seats || 3;

  const handleStartDriving = async () => {
    if (user?.id) {
      try {
        await AsyncStorage.setItem(`uniwheels_celebration_shown_${user.id}`, 'true');
      } catch {}
    }
    if (activeRole !== 'driver') {
      toggleRole();
    }
    if (onGoToDriver) {
      onGoToDriver();
    }
    onClose();
  };

  const handleDismiss = async () => {
    if (user?.id) {
      try {
        await AsyncStorage.setItem(`uniwheels_celebration_shown_${user.id}`, 'true');
      } catch {}
    }
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={handleDismiss}>
      <Pressable className="flex-1 bg-black/75 items-center justify-center p-4" onPress={handleDismiss}>
        <Pressable
          className="w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 items-center text-center gap-3.5 shadow-2xl"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Botón de cierre */}
          <Pressable
            onPress={handleDismiss}
            hitSlop={8}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800"
          >
            <X size={16} color="#94a3b8" />
          </Pressable>

          {/* Icono de Verificación Aprobada */}
          <View className="relative mt-2">
            <View className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 items-center justify-center shadow-lg shadow-emerald-500/10">
              <ShieldCheck size={32} color="#10b981" />
            </View>
            <View className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 items-center justify-center border-2 border-white dark:border-slate-900">
              <CheckCircle2 size={14} color="#ffffff" />
            </View>
          </View>

          {/* Insignia y Títulos */}
          <View className="items-center gap-1">
            <View className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800">
              <Text className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Verificación Aprobada
              </Text>
            </View>
            <Text className="text-lg font-black text-slate-900 dark:text-white text-center">
              ¡Ya eres Conductor UniWheels!
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
              Tu vehículo y documentación han sido validados exitosamente por Bienestar Universitario.
            </Text>
          </View>

          {/* Ficha del Vehículo */}
          <View className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 gap-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Car size={16} color="#0284c7" />
                <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {brandModel}
                </Text>
              </View>
              <View className="px-2 py-0.5 rounded-md bg-lochmara-50 dark:bg-slate-800">
                <Text className="font-mono text-xs font-black text-lochmara-700 dark:text-lochmara-300">
                  {plateNumber.toUpperCase()}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between text-[11px] pt-1 border-t border-slate-200 dark:border-slate-800">
              <Text className="text-[11px] text-slate-500 dark:text-slate-400">Capacidad habilitada:</Text>
              <Text className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{seats} cupos</Text>
            </View>
          </View>

          {/* Capacidades habilitadas */}
          <View className="w-full gap-2 text-left">
            <View className="flex-row items-start gap-2.5">
              <View className="w-6 h-6 rounded-lg bg-lochmara-50 dark:bg-slate-800 items-center justify-center shrink-0 mt-0.5">
                <Navigation size={14} color="#0284c7" />
              </View>
              <Text className="text-[11px] text-slate-600 dark:text-slate-300 flex-1 leading-snug">
                Publica recorridos hacia o desde tu campus universitario en cualquier momento.
              </Text>
            </View>

            <View className="flex-row items-start gap-2.5">
              <View className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 items-center justify-center shrink-0 mt-0.5">
                <Banknote size={14} color="#10b981" />
              </View>
              <Text className="text-[11px] text-slate-600 dark:text-slate-300 flex-1 leading-snug">
                Tus pasajeros te dan su aporte directamente, en efectivo o Nequi.
              </Text>
            </View>
          </View>

          {/* Botones de acción */}
          <View className="w-full gap-2 pt-1">
            <Pressable
              onPress={handleStartDriving}
              className="w-full py-3 rounded-2xl bg-emerald-600 flex-row items-center justify-center gap-2 active:bg-emerald-700 shadow-md shadow-emerald-600/30"
            >
              <Text className="text-xs font-bold text-white">Comenzar a Conducir</Text>
              <ArrowRight size={16} color="#ffffff" />
            </Pressable>

            <Pressable
              onPress={handleDismiss}
              className="w-full py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 items-center justify-center"
            >
              <Text className="text-xs font-bold text-slate-600 dark:text-slate-400">Entendido</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
