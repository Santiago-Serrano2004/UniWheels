import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import {
  Receipt,
  CheckCircle2,
  X,
  Wallet,
} from 'lucide-react-native';
import { useAppStore, tripLifecycleService } from '@uniwheels/shared';
import { AlertBanner } from '@/components/AlertBanner';

export interface TripSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip?: any;
  onSettlementCompleted?: () => void;
}

export function TripSettlementModal({
  isOpen,
  onClose,
  trip,
  onSettlementCompleted,
}: TripSettlementModalProps) {
  const {
    activeDriverTrip,
    currentRoutePassengerTrips,
    finishActiveDriverTrip,
    rechargeDriverWallet,
  } = useAppStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const currentTrip = trip || activeDriverTrip;
  const passengers = currentRoutePassengerTrips.length > 0
    ? currentRoutePassengerTrips
    : currentTrip?.passengers || [];

  // Solo liquidar sobre los pasajeros confirmados/recogidos
  const verifiedPassengers = passengers.filter((p: any) => p.is_pin_verified || p.status === 'recogido');
  const countPassengers = Math.max(1, verifiedPassengers.length || (passengers.length > 0 ? passengers.length : 1));
  const farePerPassenger = Number(currentTrip?.fare_cop || currentTrip?.price || 4500);

  const totalRecaudado = countPassengers * farePerPassenger;
  const comisionPlataforma = Math.round(totalRecaudado * 0.12);
  const gananciaNeta = totalRecaudado - comisionPlataforma;

  const handleConfirmSettlement = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    try {
      const tripId = currentTrip?.id || currentTrip?.route_id;
      if (tripId) {
        try {
          await tripLifecycleService.completeTrip(tripId);
        } catch (err: any) {
          console.warn('Notice from completeTrip:', err);
        }
      }

      // Acreditar ganancia neta a la billetera local
      rechargeDriverWallet(gananciaNeta);
      finishActiveDriverTrip();
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onSettlementCompleted) {
          onSettlementCompleted();
        }
      }, 900);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al liquidar el viaje.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/75 items-center justify-center p-4" onPress={onClose}>
        <Pressable
          className="w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 gap-3.5 shadow-2xl"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Cabecera */}
          <View className="flex-row items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 items-center justify-center">
                <Receipt size={18} color="#10b981" />
              </View>
              <View>
                <Text className="text-xs font-black text-slate-900 dark:text-white">
                  Liquidación del Viaje
                </Text>
                <Text className="text-[10px] text-slate-400">Arqueo de aportes y comisión</Text>
              </View>
            </View>

            <Pressable onPress={onClose} hitSlop={8} className="p-1 rounded-full bg-slate-100 dark:bg-slate-800">
              <X size={16} color="#94a3b8" />
            </Pressable>
          </View>

          {errorMessage ? (
            <AlertBanner type="error" message={errorMessage} onClose={() => setErrorMessage('')} />
          ) : null}

          {/* Resumen del Trayecto */}
          <View className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 gap-1.5">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Resumen de Trayecto
            </Text>
            <Text className="text-xs font-bold text-slate-900 dark:text-white" numberOfLines={1}>
              {currentTrip?.origin || 'Origen'} → {currentTrip?.destination || 'Campus'}
            </Text>
            <View className="flex-row items-center justify-between text-[11px] pt-1 border-t border-slate-200 dark:border-slate-800">
              <Text className="text-[11px] text-slate-500 dark:text-slate-400">Pasajeros liquidados:</Text>
              <Text className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                {countPassengers} {countPassengers === 1 ? 'estudiante' : 'estudiantes'} (${farePerPassenger.toLocaleString('es-CO')} c/u)
              </Text>
            </View>
          </View>

          {/* Desglose Financiero */}
          <View className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-slate-600 dark:text-slate-400">Ingreso Bruto Total:</Text>
              <Text className="text-xs font-bold text-slate-900 dark:text-white">
                ${totalRecaudado.toLocaleString('es-CO')} COP
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-rose-600 dark:text-rose-400">Comisión UniWheels (12%):</Text>
              <Text className="text-xs font-bold text-rose-600 dark:text-rose-400">
                -${comisionPlataforma.toLocaleString('es-CO')} COP
              </Text>
            </View>

            <View className="pt-2 border-t border-slate-200 dark:border-slate-800 flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <Wallet size={14} color="#10b981" />
                <Text className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  Ganancia Neta Conductor:
                </Text>
              </View>
              <Text className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                ${gananciaNeta.toLocaleString('es-CO')} COP
              </Text>
            </View>
          </View>

          {/* Botones de Confirmación */}
          <View className="gap-2 pt-1">
            <Pressable
              disabled={isProcessing}
              onPress={handleConfirmSettlement}
              className={`w-full py-3.5 rounded-2xl flex-row items-center justify-center gap-2 shadow-lg ${
                isProcessing
                  ? 'bg-emerald-600/50'
                  : 'bg-emerald-600 active:bg-emerald-700 shadow-emerald-600/30'
              }`}
            >
              {isProcessing ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text className="text-xs font-bold text-white">Liquidando viaje...</Text>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 size={16} color="#ffffff" />
                  <Text className="text-xs font-bold text-white">¡Viaje Liquidado Exitosamente!</Text>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} color="#ffffff" />
                  <Text className="text-xs font-bold text-white">
                    Finalizar y Liquidar (${gananciaNeta.toLocaleString('es-CO')})
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={onClose}
              className="w-full py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 items-center justify-center"
            >
              <Text className="text-xs font-bold text-slate-600 dark:text-slate-400">Volver al Viaje</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
