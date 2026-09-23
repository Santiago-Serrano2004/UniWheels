import { useState } from 'react';
import { Alert, Image, Linking, Pressable, Text, View } from 'react-native';
import {
  AlertTriangle,
  Clock,
  KeyRound,
  MessageCircle,
  Navigation,
  Phone,
  ShieldCheck,
  Star,
} from 'lucide-react-native';
import { tripLifecycleService, useAppStore } from '@uniwheels/shared';

export interface PassengerActiveTripCardProps {
  trip?: any;
  onCancel?: () => void;
}

export function PassengerActiveTripCard({ trip: propTrip, onCancel }: PassengerActiveTripCardProps) {
  const storeTrip = useAppStore((state) => state.activePassengerBooking);
  const cancelPassengerBooking = useAppStore((state) => state.cancelPassengerBooking);
  const [isCancelling, setIsCancelling] = useState(false);

  const trip = propTrip || storeTrip;
  if (!trip) return null;

  const status = trip.status || 'confirmado';

  const getStatusInfo = () => {
    switch (status) {
      case 'en_camino':
      case 'on_the_way':
        return {
          badgeBg: 'bg-amber-600',
          badgeText: 'Conductor en camino al punto de encuentro',
          dotColor: '#fbbf24',
        };
      case 'en_punto_encuentro':
      case 'at_pickup':
        return {
          badgeBg: 'bg-purple-600',
          badgeText: 'Conductor esperando en el punto acordado',
          dotColor: '#c084fc',
        };
      case 'recogido':
      case 'in_progress':
      case 'on_trip':
        return {
          badgeBg: 'bg-emerald-600',
          badgeText: 'En trayecto hacia el destino',
          dotColor: '#34d399',
        };
      case 'confirmado':
      case 'confirmed':
      default:
        return {
          badgeBg: 'bg-blue-600',
          badgeText: 'Conductor asignado - Esperando salida',
          dotColor: '#60a5fa',
        };
    }
  };

  const statusInfo = getStatusInfo();
  const driverName = trip.driverName || trip.driver_name || 'Carlos Mendoza';
  const driverPhone = trip.driverPhone || trip.driver_phone || trip.driver_phone_number || '3158924410';
  const driverRating = Number(trip.driverRating || trip.driver_rating || trip.rating || 4.9).toFixed(1);
  const driverInitials = driverName.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'C';
  const vehicle = trip.vehicle || trip.vehicle_model || 'Mazda 3 (Rojo)';
  const plate = trip.plate || trip.vehicle_plate || 'KLU-492';
  const boardingPin = trip.boardingPin || trip.pin || trip.boarding_pin || '4829';
  const departureTime = trip.departureTime || trip.departure_time || '06:45 AM';
  const origin = trip.origin || trip.pickup || 'Punto acordado';
  const destination = trip.destination || 'Campus El Jardín';
  const meetingPoint = trip.meeting_point || trip.meetingPoint || null;
  const fare = trip.fare || (trip.fare_cop ? `$ ${Number(trip.fare_cop).toLocaleString('es-CO')}` : '$ 4.500');

  const handleCall = () => {
    const cleanPhone = driverPhone.replace(/\D/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Error', 'No se pudo abrir la aplicación de llamadas.');
    });
  };

  const handleWhatsApp = () => {
    const cleanPhone = driverPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
    const text = encodeURIComponent(
      `Hola ${driverName}, soy tu pasajero de UniWheels en el viaje hacia ${destination}.`
    );
    const waUrl = `https://wa.me/${formattedPhone}?text=${text}`;
    Linking.openURL(waUrl).catch(() => {
      Alert.alert('Error', 'No se pudo abrir WhatsApp.');
    });
  };

  const handleCancelBooking = () => {
    Alert.alert(
      'Cancelar reserva',
      '¿Estás seguro de que deseas cancelar tu reserva de viaje?',
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            try {
              if (trip.id) {
                await tripLifecycleService.cancelTrip(trip.id, 'passenger', 'Cancelado por el pasajero');
              }
            } catch {
              // Ignore network errors on local cancel fallback
            } finally {
              setIsCancelling(false);
              cancelPassengerBooking();
              onCancel?.();
            }
          },
        },
      ]
    );
  };

  const hasCoords = trip.pickup_lat != null && trip.pickup_lng != null;
  const handleOpenMapRoute = () => {
    if (hasCoords) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${trip.pickup_lat},${trip.pickup_lng}`;
      Linking.openURL(url).catch(() => {});
    }
  };

  return (
    <View className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 gap-3.5 shadow-sm">
      {/* Estado con badge de color y hora */}
      <View className="flex-row items-center justify-between gap-2">
        <View className={`flex-row items-center gap-1.5 px-2.5 py-1 rounded-full ${statusInfo.badgeBg}`}>
          <View className="w-2 h-2 rounded-full bg-white" />
          <Text className="text-[10px] font-black text-white" numberOfLines={1}>
            {statusInfo.badgeText}
          </Text>
        </View>

        <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
          <Clock size={11} color="#0284c7" />
          <Text className="text-xs font-mono font-bold text-lochmara-600 dark:text-lochmara-400">
            {departureTime}
          </Text>
        </View>
      </View>

      {/* Datos del conductor y vehículo */}
      <View className="flex-row items-center justify-between pt-0.5">
        <View className="flex-row items-center gap-2.5 flex-1 mr-2">
          {trip.driverPhoto ? (
            <Image source={{ uri: trip.driverPhoto }} className="w-11 h-11 rounded-2xl" />
          ) : (
            <View className="w-11 h-11 rounded-2xl bg-lochmara-100 dark:bg-lochmara-500/20 border border-lochmara-200 dark:border-lochmara-500/30 items-center justify-center">
              <Text className="text-sm font-black text-lochmara-700 dark:text-lochmara-300">
                {driverInitials}
              </Text>
            </View>
          )}

          <View className="flex-1">
            <View className="flex-row items-center gap-1">
              <Text className="text-sm font-black text-slate-900 dark:text-white" numberOfLines={1}>
                {driverName}
              </Text>
              <ShieldCheck size={14} color="#0284c7" />
            </View>

            <View className="flex-row items-center gap-1.5 mt-0.5">
              <View className="flex-row items-center gap-0.5">
                <Star size={11} color="#f59e0b" fill="#f59e0b" />
                <Text className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  {driverRating}
                </Text>
              </View>
              <Text className="text-[10px] text-slate-300 dark:text-slate-700">•</Text>
              <Text className="text-[11px] text-slate-500 dark:text-slate-400" numberOfLines={1}>
                {vehicle}
              </Text>
            </View>

            <Text className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              Placa: {plate}
            </Text>
          </View>
        </View>

        <View className="items-end shrink-0">
          <Text className="text-base font-black text-emerald-600 dark:text-emerald-400">
            {fare}
          </Text>
          <Text className="text-[9px] font-semibold text-slate-400 uppercase">Aporte</Text>
        </View>
      </View>

      {/* PIN de Abordaje Destacado */}
      <View className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 dark:border-emerald-800/50 items-center gap-1.5">
        <View className="flex-row items-center gap-1.5">
          <KeyRound size={15} color="#10b981" />
          <Text className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            PIN de Abordaje de Seguridad
          </Text>
        </View>

        <Text className="text-3xl font-black font-mono tracking-widest text-emerald-600 dark:text-emerald-400 py-0.5">
          {boardingPin}
        </Text>

        <Text className="text-[10px] text-center text-emerald-700 dark:text-emerald-300">
          Muestra este PIN de 4 dígitos al conductor al subir al vehículo
        </Text>
      </View>

      {/* Origen y Destino */}
      <View className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 gap-2">
        <View className="flex-row items-start gap-2">
          <View className="w-2.5 h-2.5 rounded-full bg-lochmara-500 mt-1" />
          <View className="flex-1">
            <Text className="text-[9px] font-extrabold uppercase text-slate-400">Punto de Recogida</Text>
            <Text className="text-xs font-black text-slate-900 dark:text-white" numberOfLines={2}>
              {origin}
            </Text>
            {meetingPoint && (
              <View className="flex-row items-center gap-1 mt-0.5">
                <Navigation size={10} color="#0284c7" />
                <Text className="text-[10px] font-bold text-lochmara-600 dark:text-lochmara-400" numberOfLines={1}>
                  Encuentro: {meetingPoint}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View className="border-l border-dashed border-slate-300 dark:border-slate-700 h-2 ml-1" />

        <View className="flex-row items-start gap-2">
          <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1" />
          <View className="flex-1">
            <Text className="text-[9px] font-extrabold uppercase text-slate-400">Punto de Llegada</Text>
            <Text className="text-xs font-black text-slate-900 dark:text-white" numberOfLines={2}>
              {destination}
            </Text>
          </View>
        </View>
      </View>

      {/* Botones de Acción Directa */}
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={handleCall}
          className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-row items-center justify-center gap-1.5 active:bg-slate-200 dark:active:bg-slate-700"
        >
          <Phone size={13} color="#0284c7" />
          <Text className="text-xs font-black text-slate-900 dark:text-white">Llamar</Text>
        </Pressable>

        <Pressable
          onPress={handleWhatsApp}
          className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex-row items-center justify-center gap-1.5 active:bg-emerald-500/20"
        >
          <MessageCircle size={13} color="#10b981" />
          <Text className="text-xs font-black text-emerald-600 dark:text-emerald-400">WhatsApp</Text>
        </Pressable>

        {hasCoords && (
          <Pressable
            onPress={handleOpenMapRoute}
            className="px-3 py-2.5 rounded-xl bg-lochmara-600 flex-row items-center justify-center gap-1 active:bg-lochmara-700"
          >
            <Navigation size={13} color="#ffffff" />
            <Text className="text-xs font-black text-white">Ruta</Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleCancelBooking}
          disabled={isCancelling}
          className="px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex-row items-center justify-center gap-1 active:bg-rose-500/20"
        >
          <AlertTriangle size={13} color="#ef4444" />
          <Text className="text-xs font-bold text-rose-600 dark:text-rose-400">Cancelar</Text>
        </Pressable>
      </View>
    </View>
  );
}
