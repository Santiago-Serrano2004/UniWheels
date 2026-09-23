import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import {
  ShieldAlert,
  Car,
  CalendarCheck,
  ArrowRight,
  User,
  MapPin,
} from 'lucide-react-native';

export interface ActiveRoleConflictBlockerProps {
  conflictType: 'driver_active' | 'passenger_active';
  activeTrip: {
    departureTime?: string;
    departure_time?: string;
    time?: string;
    origin?: string;
    destination?: string;
    driverName?: string;
    [key: string]: any;
  } | null;
  onRedirect: () => void;
}

export function ActiveRoleConflictBlocker({
  conflictType,
  activeTrip,
  onRedirect,
}: ActiveRoleConflictBlockerProps) {
  const isDriverActive = conflictType === 'driver_active';
  const tripOrigin = activeTrip?.origin || 'Punto de encuentro';
  const tripDestination = activeTrip?.destination || 'Campus Universitario';
  const tripTime =
    activeTrip?.departureTime ||
    activeTrip?.departure_time ||
    activeTrip?.time ||
    'En curso';

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-950 px-4 pt-4"
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="space-y-4">
        {/* Tarjeta de Alerta de Exclusión Mutua */}
        <View className="rounded-3xl p-5 shadow-lg border border-slate-800 bg-slate-900 dark:bg-slate-900 text-white space-y-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/30 items-center justify-center">
              <ShieldAlert size={24} color="#fcd34d" />
            </View>
            <View className="bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-400/30">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                Operación Activa
              </Text>
            </View>
          </View>

          <View className="mb-3">
            <Text className="text-base font-extrabold text-white mb-1">
              {isDriverActive
                ? 'Tienes un viaje activo como Conductor'
                : 'Tienes una reserva activa como Pasajero'}
            </Text>
            <Text className="text-xs text-slate-300 leading-relaxed">
              {isDriverActive
                ? 'Por seguridad vial y coherencia del sistema, no puedes interactuar ni buscar viajes como pasajero mientras mantengas una ruta publicada en curso.'
                : 'Actualmente tienes un cupo reservado como pasajero. No puedes operar ni publicar viajes como conductor hasta completar o cancelar tu reserva.'}
            </Text>
          </View>

          {/* Resumen del Viaje en Conflicto */}
          {activeTrip ? (
            <View className="p-3.5 bg-white/10 rounded-2xl border border-white/10 mb-3 space-y-2">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-[11px] font-semibold text-lochmara-300">
                  {isDriverActive ? 'Tu Ruta Publicada' : 'Tu Reserva Universitaria'}
                </Text>
                <Text className="font-mono text-[11px] text-white">
                  {tripTime}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <MapPin size={14} color="#38bdf8" />
                <View className="flex-1 flex-row items-center gap-1.5">
                  <Text className="text-xs font-bold text-white shrink" numberOfLines={1}>
                    {tripOrigin}
                  </Text>
                  <ArrowRight size={12} color="#94a3b8" />
                  <Text className="text-xs font-bold text-white shrink" numberOfLines={1}>
                    {tripDestination}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          <View className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
            <Text className="text-[11px] text-slate-400 leading-snug">
              La navegación en esta sección está bloqueada para evitar duplicidad de roles. La pestaña{' '}
              <Text className="font-bold text-slate-200">Perfil</Text> permanece disponible.
            </Text>
          </View>
        </View>

        {/* Botones de Acción */}
        <View className="gap-2.5 pt-2">
          <Pressable
            onPress={onRedirect}
            className="w-full py-3.5 px-4 rounded-2xl bg-lochmara-600 active:bg-lochmara-700 flex-row items-center justify-center gap-2 shadow-lg shadow-lochmara-600/25"
          >
            {isDriverActive ? (
              <>
                <Car size={16} color="#ffffff" />
                <Text className="text-white text-xs font-bold flex-1 text-center">
                  Volver a Mi Panel de Conductor
                </Text>
              </>
            ) : (
              <>
                <CalendarCheck size={16} color="#ffffff" />
                <Text className="text-white text-xs font-bold flex-1 text-center">
                  Volver a Mis Viajes de Pasajero
                </Text>
              </>
            )}
            <ArrowRight size={14} color="#ffffff" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/profile')}
            className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-row items-center justify-center gap-1.5"
          >
            <User size={14} color="#0284c7" />
            <Text className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Ir a Mi Perfil
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
