import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  Linking,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Location from 'expo-location';
import {
  ShieldAlert,
  PhoneCall,
  Share2,
  X,
  Radio,
  Copy,
  Check,
  Ambulance,
  PhoneForwarded,
  Shield,
} from 'lucide-react-native';
import { tripLifecycleService, useAppStore } from '@uniwheels/shared';

export interface SosEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCoords?: [number, number] | null;
  tripInfo?: {
    id?: string | number;
    driverName?: string;
    vehicle?: string;
    plate?: string;
  } | null;
}

const DEFAULT_COORDS: [number, number] = [7.1193, -73.1042];
const CAMPUS_SECURITY_PHONE = 'tel:6076436111';

export function SosEmergencyModal({
  isOpen,
  onClose,
  currentCoords,
  tripInfo,
}: SosEmergencyModalProps) {
  const user = useAppStore((state) => state.user);
  const activePassengerBooking = useAppStore((state) => state.activePassengerBooking);
  const activeDriverTrip = useAppStore((state) => state.activeDriverTrip);

  const [coords, setCoords] = useState<[number, number]>(currentCoords || DEFAULT_COORDS);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  // SIM-022: si la alerta no quedó registrada en UniWheels se avisa y se ofrece llamar al 123.
  const [sosReportError, setSosReportError] = useState<string | null>(null);

  const contentOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.92);

  useEffect(() => {
    if (isOpen) {
      contentOpacity.value = 0;
      contentScale.value = 0.92;
      contentOpacity.value = withTiming(1, {
        duration: 220,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      });
      contentScale.value = withTiming(1, {
        duration: 220,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      });
    } else {
      contentOpacity.value = 0;
      contentScale.value = 0.92;
    }
  }, [isOpen, contentOpacity, contentScale]);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: contentScale.value }],
  }));

  // Extraer datos del viaje activo o props
  const driverName =
    tripInfo?.driverName ||
    activePassengerBooking?.driverName ||
    activeDriverTrip?.driverName ||
    (user?.role === 'driver' ? user?.name : undefined) ||
    'Conductor Asignado';

  const plate =
    tripInfo?.plate ||
    activePassengerBooking?.plate ||
    activeDriverTrip?.plate ||
    '—';

  const vehicle =
    tripInfo?.vehicle ||
    activePassengerBooking?.vehicle ||
    activeDriverTrip?.vehicle ||
    'Vehículo en servicio';

  const tripId =
    tripInfo?.id ||
    activePassengerBooking?.id ||
    activeDriverTrip?.id;

  // Actualizar coordenadas GPS en alta precisión al abrir el modal
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setSosReportError(null);
    async function getPreciseLocationAndNotify() {
      setIsLocating(true);
      let targetLat = coords[0];
      let targetLng = coords[1];

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          if (isMounted) {
            targetLat = loc.coords.latitude;
            targetLng = loc.coords.longitude;
            setCoords([targetLat, targetLng]);
          }
        }
      } catch (err) {
        console.warn('[SosEmergencyModal] Error al obtener GPS:', err);
      } finally {
        if (isMounted) setIsLocating(false);
      }

      // Disparar reporte de SOS al backend para registro de auditoría
      if (tripId) {
        tripLifecycleService
          .triggerEmergencySos(tripId, {
            latitude: targetLat,
            longitude: targetLng,
            emergencyType: 'panico_usuario',
          })
          .catch((err: any) => {
            if (isMounted) {
              setSosReportError(err?.message || 'No se pudo registrar la alerta en UniWheels.');
            }
          });
      } else if (isMounted) {
        setSosReportError('No hay un viaje activo al que asociar la alerta.');
      }
    }

    getPreciseLocationAndNotify();

    return () => {
      isMounted = false;
    };
  }, [isOpen, tripId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const latStr = coords[0].toFixed(5);
  const lngStr = coords[1].toFixed(5);
  const gpsUrl = `https://maps.google.com/?q=${latStr},${lngStr}`;

  const realizarLlamada = async (numeroUrl: string, nombreServicio: string) => {
    try {
      const supported = await Linking.canOpenURL(numeroUrl);
      if (supported) {
        await Linking.openURL(numeroUrl);
      } else {
        Alert.alert('Marcación no compatible', `No se pudo marcar a ${nombreServicio} desde este dispositivo.`);
      }
    } catch {
      Alert.alert('Error', `No se pudo iniciar la llamada a ${nombreServicio}.`);
    }
  };

  const compartirSosWhatsApp = async () => {
    const horaActual = new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const mensaje =
      `*ALERTA DE EMERGENCIA UNIWHEELS*\n` +
      `Necesito ayuda. Me encuentro en un viaje activo de UniWheels.\n\n` +
      `*Conductor:* ${driverName}\n` +
      `*Vehículo:* ${vehicle}\n` +
      `*Placa:* ${plate}\n` +
      `*Mi ubicación actual:* ${gpsUrl}\n` +
      `*Hora del reporte:* ${horaActual}\n\n` +
      `*Por favor comunícate conmigo de inmediato o alerta a las autoridades.*`;

    const whatsappAppUrl = `whatsapp://send?text=${encodeURIComponent(mensaje)}`;
    const whatsappWebUrl = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

    try {
      const canOpen = await Linking.canOpenURL(whatsappAppUrl);
      if (canOpen) {
        await Linking.openURL(whatsappAppUrl);
      } else {
        await Linking.openURL(whatsappWebUrl);
      }
    } catch {
      // Fallback a compartir nativo del SO
      try {
        await Share.share({
          message: mensaje,
          title: 'Alerta de Emergencia UniWheels',
        });
      } catch {
        Alert.alert('Error', 'No se pudo abrir WhatsApp ni el menú de compartir.');
      }
    }
  };

  const compartirEnlaceGps = async () => {
    try {
      await Share.share({
        message: `Mi ubicación de emergencia UniWheels: ${gpsUrl}`,
        url: gpsUrl,
      });
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      Alert.alert('Ubicación GPS', gpsUrl);
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-slate-950/85 items-center justify-center p-4" onPress={onClose}>
        <Animated.View
          style={[contentAnimatedStyle, { maxHeight: '90%', width: '100%' }]}
          className="w-full max-w-sm"
        >
          <Pressable
            className="w-full bg-slate-900 rounded-3xl p-5 border-2 border-rose-500/60 shadow-2xl shadow-rose-950/80 gap-3.5"
            style={{ maxHeight: '100%' }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Cabecera de Emergencia */}
          <View className="flex-row items-center justify-between pb-3 border-b border-rose-900/40">
            <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
              <View className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/50 items-center justify-center">
                <ShieldAlert size={22} color="#f43f5e" />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-sm font-black text-rose-400 tracking-tight" numberOfLines={1}>
                  Botón de Pánico SOS
                </Text>
                <Text className="text-[10px] font-semibold text-rose-200/70" numberOfLines={1}>
                  Asistencia y Contacto de Emergencia
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={8}
              className="p-1.5 rounded-full bg-slate-800 border border-slate-700"
            >
              <X size={15} color="#cbd5e1" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {sosReportError && (
              <View className="rounded-2xl p-3.5 bg-amber-500/10 border border-amber-500/50 gap-2">
                <Text className="text-xs font-bold text-amber-300">La alerta no se registró en UniWheels</Text>
                <Text className="text-[11px] text-amber-100/80">{sosReportError}</Text>
                <Pressable
                  onPress={() => realizarLlamada('tel:123', 'Policía Nacional 123')}
                  className="py-2 rounded-xl bg-rose-600 items-center"
                >
                  <Text className="text-xs font-black text-white">Llamar al 123 ahora</Text>
                </Pressable>
              </View>
            )}

            {/* Tarjeta de Coordenadas GPS en Vivo */}
            <View className="rounded-2xl p-3.5 bg-slate-950 border border-rose-900/50 gap-2">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <Radio size={14} color="#f43f5e" />
                  <Text className="font-bold text-xs text-rose-400">Transmisión GPS en Vivo</Text>
                </View>
                <View className="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/30">
                  <Text className="text-[10px] font-mono font-extrabold text-rose-400">{plate}</Text>
                </View>
              </View>

              <View className="gap-0.5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[11px] font-mono text-slate-300">
                    Lat: <Text className="text-white font-black">{latStr}</Text>, Lng:{' '}
                    <Text className="text-white font-black">{lngStr}</Text>
                  </Text>
                  {isLocating && <ActivityIndicator size="small" color="#f43f5e" />}
                </View>
                <Text className="text-[10px] font-medium text-slate-400">
                  Conductor: <Text className="text-slate-200 font-bold">{driverName}</Text> • {vehicle}
                </Text>
              </View>
            </View>

            {/* LLAMADAS DE EMERGENCIA DIRECTAS */}
            <View className="gap-2">
              {/* 1. Línea Nacional 123 (Policía Nacional) */}
              <Pressable
                onPress={() => realizarLlamada('tel:123', 'Policía Nacional 123')}
                className="w-full py-3 px-4 rounded-2xl bg-rose-600 active:bg-rose-700 border border-rose-500 flex-row items-center justify-between shadow-md shadow-rose-900/40"
              >
                <View className="flex-row items-center gap-2.5">
                  <View className="w-8 h-8 rounded-xl bg-white/20 items-center justify-center">
                    <PhoneCall size={16} color="#ffffff" />
                  </View>
                  <View>
                    <Text className="text-xs font-black text-white leading-tight">Policía Nacional</Text>
                    <Text className="text-[10px] text-rose-100 font-medium">Línea Nacional 123</Text>
                  </View>
                </View>
                <View className="px-2.5 py-1 rounded-lg bg-white/20">
                  <Text className="text-xs font-mono font-black text-white">123</Text>
                </View>
              </Pressable>

              {/* 2. Emergencias Médicas 125 */}
              <Pressable
                onPress={() => realizarLlamada('tel:125', 'Emergencias Médicas CRUE 125')}
                className="w-full py-3 px-4 rounded-2xl bg-slate-950 active:bg-slate-800 border border-amber-500/50 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-2.5">
                  <View className="w-8 h-8 rounded-xl bg-amber-500/20 items-center justify-center">
                    <Ambulance size={16} color="#fbbf24" />
                  </View>
                  <View>
                    <Text className="text-xs font-black text-amber-300 leading-tight">Emergencias Médicas (CRUE)</Text>
                    <Text className="text-[10px] text-slate-400 font-medium">Ambulancias y Urgencias</Text>
                  </View>
                </View>
                <View className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40">
                  <Text className="text-xs font-mono font-black text-amber-300">125</Text>
                </View>
              </Pressable>

              {/* 3. Línea 155 (Protección Mujeres / Género) */}
              <Pressable
                onPress={() => realizarLlamada('tel:155', 'Línea de Orientación a Mujeres 155')}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-950 active:bg-slate-800 border border-purple-500/50 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-2.5">
                  <View className="w-7 h-7 rounded-xl bg-purple-500/20 items-center justify-center">
                    <Shield size={14} color="#c084fc" />
                  </View>
                  <View>
                    <Text className="text-[11px] font-black text-purple-300 leading-tight">Línea Púrpura Mujer</Text>
                    <Text className="text-[9px] text-slate-400 font-medium">Orientación y Protección</Text>
                  </View>
                </View>
                <View className="px-2 py-0.5 rounded-lg bg-purple-500/20 border border-purple-500/40">
                  <Text className="text-[11px] font-mono font-black text-purple-300">155</Text>
                </View>
              </Pressable>

              {/* 4. Seguridad Campus UNAB */}
              <Pressable
                onPress={() => realizarLlamada(CAMPUS_SECURITY_PHONE, 'Seguridad Campus UNAB')}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-950 active:bg-slate-800 border border-slate-700 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-2.5">
                  <View className="w-7 h-7 rounded-xl bg-slate-800 items-center justify-center">
                    <PhoneForwarded size={14} color="#94a3b8" />
                  </View>
                  <View>
                    <Text className="text-[11px] font-bold text-slate-200 leading-tight">Seguridad Institucional UNAB</Text>
                    <Text className="text-[9px] text-slate-400 font-medium">Central de Monitoreo de Campus</Text>
                  </View>
                </View>
                <View className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700">
                  <Text className="text-[10px] font-mono font-bold text-slate-300">607 6436111</Text>
                </View>
              </Pressable>
            </View>

            {/* ACCIONES COMPLEMENTARIAS: WHATSAPP Y COMPARTIR GPS */}
            <View className="flex-row gap-2 pt-1 border-t border-slate-800">
              {/* WhatsApp */}
              <Pressable
                onPress={compartirSosWhatsApp}
                className="flex-1 py-3 px-3 rounded-2xl bg-emerald-600 active:bg-emerald-700 border border-emerald-500 flex-row items-center justify-center gap-1.5 shadow-md shadow-emerald-950/50"
              >
                <Share2 size={14} color="#ffffff" />
                <Text className="text-white text-xs font-black">WhatsApp SOS</Text>
              </Pressable>

              {/* Compartir / Copiar GPS */}
              <Pressable
                onPress={compartirEnlaceGps}
                className={`flex-1 py-3 px-3 rounded-2xl border flex-row items-center justify-center gap-1.5 ${
                  copiedLink
                    ? 'bg-emerald-500/20 border-emerald-500'
                    : 'bg-slate-800 active:bg-slate-700 border-slate-700'
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check size={14} color="#34d399" />
                    <Text className="text-emerald-400 text-xs font-black">¡Compartido!</Text>
                  </>
                ) : (
                  <>
                    <Copy size={14} color="#cbd5e1" />
                    <Text className="text-slate-200 text-xs font-bold">Compartir GPS</Text>
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
