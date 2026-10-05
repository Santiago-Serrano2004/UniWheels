import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  KeyRound,
  Navigation,
  Star,
} from 'lucide-react-native';
import { tripLifecycleService, useAppStore } from '@uniwheels/shared';
import { procesarRespuestaCancelacion } from '@/utils/cancelTripFeedback';

export function LiveTripIslandWidget() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const activePassengerBooking = useAppStore((state) => state.activePassengerBooking);
  const activeDriverTrip = useAppStore((state) => state.activeDriverTrip);
  const activeRole = useAppStore((state) => state.activeRole);
  const cancelPassengerBooking = useAppStore((state) => state.cancelPassengerBooking);
  const cancelDriverTrip = useAppStore((state) => state.cancelDriverTrip);
  const logout = useAppStore((state: any) => state.logout);

  const [isExpanded, setIsExpanded] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState(6);

  // Entrada con spring (stiffness: 400, damping: 30) replicando framer-motion web
  const entranceY = useSharedValue(-20);
  const entranceScale = useSharedValue(0.95);
  const entranceOpacity = useSharedValue(0);

  useEffect(() => {
    entranceY.value = withSpring(0, { stiffness: 400, damping: 30 });
    entranceScale.value = withSpring(1, { stiffness: 400, damping: 30 });
    entranceOpacity.value = withTiming(1, { duration: 200 });
  }, [entranceY, entranceScale, entranceOpacity]);

  const containerEntranceStyle = useAnimatedStyle(() => ({
    opacity: entranceOpacity.value,
    transform: [
      { translateY: entranceY.value },
      { scale: entranceScale.value },
    ],
  }));

  // Pulso continuo: 2000ms total (1000ms ida + 1000ms vuelta) con easing in-out
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Simular avance del ETA cada 45 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setEtaMinutes((prev) => Math.max(1, prev - 1));
    }, 45000);
    return () => clearInterval(timer);
  }, []);

  const trip = activeRole === 'driver' ? activeDriverTrip : activePassengerBooking;

  // Si no hay viaje o si ya estamos en la pantalla del mapa del tab activo
  // El conductor ya ve el estado de su viaje en la cabina; la isla es solo para el pasajero.
  if (!trip || activeRole === 'driver') return null;

  const isDriver = activeRole === 'driver';
  const driverName = trip.driverName || trip.driver_name || (isDriver ? 'Tú (Conductor)' : '—');
  const vehicle = trip.vehicle || trip.vehicle_model || '—';
  const plate = trip.plate || trip.vehicle_plate || '—';
  const destination = trip.destination || 'Campus El Jardín';
  const origin = trip.origin || trip.pickup || 'Origen';
  const boardingPin = trip.boardingPin || trip.pin || trip.boarding_pin || '—';
  const isStarted = trip.status === 'in_progress' || trip.status === 'recogido' || Boolean(trip.isStarted);

  const handleGoToMap = () => {
    setIsExpanded(false);
    if (pathname !== '/(tabs)/map') {
      router.push('/(tabs)/map');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      isDriver ? 'Cancelar viaje' : 'Cancelar reserva',
      isDriver
        ? '¿Deseas cancelar el viaje en curso? Si hay pasajeros confirmados y faltan menos de 15 minutos para la salida, se registra una cancelación tardía.'
        : '¿Estás seguro de que deseas cancelar tu reserva?',
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            const tripId = isDriver ? trip.id || trip.route_id : trip.id;
            try {
              if (tripId) {
                const respuesta = await tripLifecycleService.cancelTrip(
                  tripId,
                  isDriver ? 'conductor' : 'pasajero',
                  isDriver ? 'Cancelado por el conductor' : 'Cancelado por el pasajero'
                );
                setIsExpanded(false);
                if (isDriver) {
                  cancelDriverTrip();
                } else {
                  cancelPassengerBooking();
                }
                procesarRespuestaCancelacion(respuesta, logout);
                return;
              }
              setIsExpanded(false);
              if (isDriver) {
                cancelDriverTrip();
              } else {
                cancelPassengerBooking();
              }
            } catch (err: any) {
              Alert.alert('No se pudo cancelar', err?.message || 'Intenta nuevamente.');
            }
          },
        },
      ]
    );
  };

  const progressPercent = isStarted ? 70 : 35;

  return (
    // Tres capas: la externa lleva posición y animaciones de layout (sin opacity, para no
    // chocar con FadeOut), la del medio la animación de entrada y la interna los estilos de
    // NativeWind (className no se aplica en Animated.View).
    <Animated.View
      style={{
        position: 'absolute',
        top: Math.max(insets.top + 6, 12),
        left: 16,
        right: 16,
        zIndex: 9999,
      }}
      exiting={FadeOut.duration(200)}
      layout={LinearTransition.springify()}
    >
      <Animated.View style={containerEntranceStyle}>
        <View className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-lochmara-500 shadow-xl shadow-lochmara-500/20 overflow-hidden">
      {/* Barra Compacta (Isla Dinámica) */}
      <Pressable
        onPress={() => setIsExpanded((prev) => !prev)}
        className="p-3.5 flex-row items-center justify-between"
      >
        <View className="flex-row items-center gap-2.5 flex-1 mr-2">
          {/* Indicador pulsante de estado en vivo */}
          <View className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 items-center justify-center">
            <Animated.View style={[pulseStyle, { width: 12, height: 12, borderRadius: 6, backgroundColor: '#10b981' }]} />
          </View>

          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-xs font-black text-slate-900 dark:text-white" numberOfLines={1}>
                {driverName}
              </Text>
              <View className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800">
                <Text className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                  {plate}
                </Text>
              </View>
            </View>

            <Text className="text-[11px] text-slate-500 dark:text-slate-400" numberOfLines={1}>
              {isStarted ? 'Rumbo al destino: ' : 'Llegada estimada: '}
              <Text className="font-extrabold text-lochmara-600 dark:text-lochmara-400">
                ~{etaMinutes} min
              </Text>
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2 shrink-0">
          {!isDriver && (
            <View className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 flex-row items-center gap-1">
              <KeyRound size={11} color="#f59e0b" />
              <Text className="text-xs font-mono font-black text-amber-600 dark:text-amber-400">
                {boardingPin}
              </Text>
            </View>
          )}

          <View className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center">
            {isExpanded ? (
              <ChevronUp size={14} color="#0284c7" />
            ) : (
              <ChevronDown size={14} color="#0284c7" />
            )}
          </View>
        </View>
      </Pressable>

      {/* Contenido Expandido */}
      {isExpanded && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={LinearTransition.springify()}
        >
          <View className="px-3.5 pb-3.5 pt-1 border-t border-slate-100 dark:border-slate-800 gap-3">
          {/* Detalles del trayecto y vehículo */}
          <View className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 gap-1.5">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                {vehicle}
              </Text>
              <View className="flex-row items-center gap-1">
                <Star size={11} color="#f59e0b" fill="#f59e0b" />
                <Text className="text-[10px] font-bold text-amber-600 dark:text-amber-400">4.9</Text>
              </View>
            </View>

            <View className="flex-row items-center gap-1.5 pt-0.5">
              <Text className="text-[10px] text-slate-400 flex-1 truncate" numberOfLines={1}>
                {origin}
              </Text>
              <ArrowRight size={10} color="#94a3b8" />
              <Text className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex-1 truncate" numberOfLines={1}>
                {destination}
              </Text>
            </View>
          </View>

          {/* Barra de progreso visual con icono */}
          <View className="gap-1">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1">
                <Clock size={11} color="#0284c7" />
                <Text className="text-[10px] text-slate-400">
                  {isStarted ? 'En trayecto hacia destino' : 'En camino al punto de encuentro'}
                </Text>
              </View>
              <Text className="text-[10px] font-bold text-lochmara-600 dark:text-lochmara-400">
                ~{etaMinutes} min
              </Text>
            </View>

            <View className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
              <View
                style={{ width: `${progressPercent}%` }}
                className="h-full bg-gradient-to-r from-lochmara-500 to-emerald-500 rounded-full"
              />
            </View>
          </View>

          {/* Botones de acción */}
          <View className="flex-row items-center gap-2 pt-1">
            <Pressable
              onPress={handleGoToMap}
              className="flex-1 py-2.5 rounded-xl bg-lochmara-600 flex-row items-center justify-center gap-1.5 active:bg-lochmara-700"
            >
              <Navigation size={13} color="#ffffff" />
              <Text className="text-xs font-black text-white">Ver Mapa en Vivo</Text>
            </Pressable>

            <Pressable
              onPress={handleCancel}
              className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex-row items-center justify-center gap-1 active:bg-rose-500/20"
            >
              <AlertTriangle size={13} color="#ef4444" />
              <Text className="text-xs font-bold text-rose-600 dark:text-rose-400">Cancelar</Text>
            </Pressable>
          </View>
          </View>
        </Animated.View>
      )}
        </View>
      </Animated.View>
    </Animated.View>
  );
}
