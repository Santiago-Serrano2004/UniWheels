import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import {
  AlertTriangle,
  X,
  ShieldAlert,
} from 'lucide-react-native';
import { useAppStore, tripLifecycleService } from '@uniwheels/shared';
import { FormSelect } from '@/components/FormSelect';
import { procesarRespuestaCancelacion } from '@/utils/cancelTripFeedback';

export interface CancelTripPenaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel?: (hasPassengers: boolean) => void;
  passengersCount?: number;
}

const REASONS = [
  { value: 'falla_mecanica', label: 'Falla Mecánica Imprevista' },
  { value: 'emergencia_medica', label: 'Emergencia Médica / Personal' },
  { value: 'fuerza_mayor', label: 'Cierre Vial o Fuerza Mayor' },
  { value: 'cambio_horario', label: 'Cambio de Horario Universitario' },
];

export function CancelTripPenaltyModal({
  isOpen,
  onClose,
  onConfirmCancel,
  passengersCount = 0,
}: CancelTripPenaltyModalProps) {
  const {
    activeDriverTrip,
    currentRoutePassengerTrips,
    cancelDriverTrip,
    logout,
  } = useAppStore();

  const [selectedReason, setSelectedReason] = useState('falla_mecanica');
  const [isCancelling, setIsCancelling] = useState(false);

  if (!isOpen) return null;

  const count = passengersCount || currentRoutePassengerTrips.length || activeDriverTrip?.passengers?.length || 0;
  const hasPassengers = count > 0;

  const handleConfirm = async () => {
    setIsCancelling(true);
    try {
      const tripId = activeDriverTrip?.id || activeDriverTrip?.route_id;
      let respuesta = null;
      if (tripId) {
        try {
          respuesta = await tripLifecycleService.cancelTrip(tripId, 'conductor', selectedReason);
        } catch (err) {
          console.warn('Notice from cancelTrip:', err);
        }
      }

      cancelDriverTrip();
      procesarRespuestaCancelacion(respuesta, logout);

      if (onConfirmCancel) {
        onConfirmCancel(hasPassengers);
      }
      onClose();
    } catch {
      cancelDriverTrip();
      onClose();
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/75 items-center justify-center p-4" onPress={onClose}>
        <Pressable
          className="w-full max-w-[320px] bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 gap-3.5 shadow-2xl"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Cabecera */}
          <View className="flex-row items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <View className="flex-row items-center gap-2">
              <View
                className={`w-8 h-8 rounded-xl border items-center justify-center ${
                  hasPassengers
                    ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800'
                    : 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800'
                }`}
              >
                {hasPassengers ? (
                  <AlertTriangle size={16} color="#e11d48" />
                ) : (
                  <ShieldAlert size={16} color="#f59e0b" />
                )}
              </View>
              <Text className="text-xs font-black text-slate-900 dark:text-white">
                {hasPassengers ? 'Cancelar con Pasajeros' : 'Cancelar Publicación'}
              </Text>
            </View>

            <Pressable onPress={onClose} hitSlop={8} className="p-1 rounded-full bg-slate-100 dark:bg-slate-800">
              <X size={16} color="#94a3b8" />
            </Pressable>
          </View>

          {/* Mensaje principal */}
          {hasPassengers ? (
            <View className="gap-2.5">
              <Text className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Tienes{' '}
                <Text className="font-black text-slate-900 dark:text-white">
                  {count} estudiante(s) confirmado(s)
                </Text>{' '}
                en este viaje.
              </Text>

              <View className="p-3 rounded-2xl border bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 gap-1.5">
                <Text className="text-[11px] text-rose-800 dark:text-rose-300/80 leading-snug">
                  Si cancelas con pasajeros confirmados a menos de 15 minutos de la salida, se registra una cancelación tardía. Con 3 en 30 días tu cuenta se suspende por 30 días.
                </Text>
              </View>

              {/* Selector de Motivo */}
              <FormSelect
                label="Motivo de Cancelación"
                value={selectedReason}
                onChange={(v) => setSelectedReason(String(v))}
                options={REASONS}
              />
            </View>
          ) : (
            <Text className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              ¿Estás seguro de cancelar este viaje? Aún no tienes pasajeros asignados, por lo que{' '}
              <Text className="font-bold text-slate-900 dark:text-white">no se registrará una cancelación tardía</Text>{' '}
              en tu cuenta.
            </Text>
          )}

          {/* Botones */}
          <View className="flex-row gap-2 pt-1">
            <Pressable
              onPress={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 items-center justify-center bg-slate-50 dark:bg-slate-950"
            >
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Mantener Viaje
              </Text>
            </Pressable>

            <Pressable
              disabled={isCancelling}
              onPress={handleConfirm}
              className={`flex-1 py-3 rounded-2xl items-center justify-center shadow-md ${
                hasPassengers
                  ? 'bg-rose-600 active:bg-rose-700 shadow-rose-600/30'
                  : 'bg-lochmara-600 active:bg-lochmara-700 shadow-lochmara-600/30'
              }`}
            >
              {isCancelling ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-xs font-bold text-white">
                  {hasPassengers ? 'Cancelar Viaje' : 'Sí, Cancelar'}
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
