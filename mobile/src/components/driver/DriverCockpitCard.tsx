import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  Car,
  MapPin,
  Users,
  Phone,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  KeyRound,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react-native';
import {
  useAppStore,
  tripsService,
  tripLifecycleService,
  routesService,
  getPlaceCoordinates,
} from '@uniwheels/shared';
import { iniciarRecorridoDeRuta, llegarAlPuntoDeRuta } from '@/services/viajesDeRuta';
import { AlertBanner } from '@/components/AlertBanner';

export interface DriverCockpitCardProps {
  onOpenNavigator?: () => void;
  onCompleteTrip?: () => void;
  onOpenCancelModal?: () => void;
}

export function DriverCockpitCard({
  onOpenNavigator,
  onCompleteTrip,
  onOpenCancelModal,
}: DriverCockpitCardProps) {
  const {
    activeDriverTrip,
    currentRoutePassengerTrips,
    setCurrentRoutePassengerTrips,
    setActiveDriverTrip,
  } = useAppStore();

  const [tripStatus, setTripStatus] = useState<'publicado' | 'en_camino' | 'en_punto_encuentro' | 'en_curso'>(
    (activeDriverTrip?.status as any) || 'publicado'
  );
  const [selectedPassengerForPin, setSelectedPassengerForPin] = useState<any | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [isUpdatingLifecycle, setIsUpdatingLifecycle] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [optimizedOrder, setOptimizedOrder] = useState(false);

  const isPinModalOpen = Boolean(selectedPassengerForPin);
  const pinModalOpacity = useSharedValue(0);
  const pinModalScale = useSharedValue(0.9);

  useEffect(() => {
    if (isPinModalOpen) {
      pinModalOpacity.value = 0;
      pinModalScale.value = 0.9;
      // Sin transition= explicito en la web (DriverLiveNavigationCockpit.jsx),
      // asi que corre con el default de framer-motion -- medido empiricamente
      // (no adivinado): ~300ms, ease suave sin overshoot, igual que se
      // implemento para PassengerActiveTripCard.tsx. duration:300 sin easing
      // custom para usar el default de Reanimated, mismo criterio.
      pinModalOpacity.value = withTiming(1, { duration: 300 });
      pinModalScale.value = withTiming(1, { duration: 300 });
    } else {
      pinModalOpacity.value = 0;
      pinModalScale.value = 0.9;
    }
  }, [isPinModalOpen, pinModalOpacity, pinModalScale]);

  const pinModalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pinModalOpacity.value,
    transform: [{ scale: pinModalScale.value }],
  }));

  // Sincronizar pasajeros de la ruta activa
  const refreshPassengers = useCallback(async () => {
    if (!activeDriverTrip?.id) {
      setCurrentRoutePassengerTrips([]);
      return;
    }

    try {
      const trips = await tripsService.getActiveTripsForRoute(activeDriverTrip.id);
      const activeTripsList = Array.isArray(trips) && trips.length > 0
        ? trips
        : activeDriverTrip.passengers || [];

      if (activeTripsList.length >= 2) {
        const candidates = activeTripsList.map((t: any) => {
          const coords = getPlaceCoordinates(t.pickup_address, false);
          return {
            id: t.id,
            name: t.passenger_name || t.name,
            pickup_address: t.pickup_address || t.pickup,
            pickup_lat: coords ? coords[0] : 7.1193,
            pickup_lng: coords ? coords[1] : -73.1042,
          };
        });

        const optimization = await routesService.optimizePassengers(activeDriverTrip.id, candidates);
        const stops = optimization?.data?.ordered_stops;
        if (optimization?.ai_powered && Array.isArray(stops) && stops.length > 0) {
          const orderedIds = stops.map((s: any) => s.user_id || s.id).filter(Boolean);
          const byId = Object.fromEntries(activeTripsList.map((t: any) => [t.id, t]));
          const sorted = orderedIds.map((id: string) => byId[id]).filter(Boolean);
          const missing = activeTripsList.filter((t: any) => !orderedIds.includes(t.id));
          setCurrentRoutePassengerTrips([...sorted, ...missing]);
          setOptimizedOrder(true);
          return;
        }
      }

      setOptimizedOrder(false);
      setCurrentRoutePassengerTrips(activeTripsList);
    } catch {
      // Usar pasajeros del store local como fallback
      if (activeDriverTrip.passengers) {
        setCurrentRoutePassengerTrips(activeDriverTrip.passengers);
      }
    }
  }, [activeDriverTrip?.id, activeDriverTrip?.passengers, setCurrentRoutePassengerTrips]);

  useEffect(() => {
    refreshPassengers();
  }, [refreshPassengers]);

  if (!activeDriverTrip) {
    return (
      <View className="p-5 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 items-center text-center gap-3">
        <View className="w-12 h-12 rounded-2xl bg-lochmara-50 dark:bg-slate-800 items-center justify-center">
          <Car size={24} color="#0284c7" />
        </View>
        <Text className="text-sm font-bold text-slate-900 dark:text-white">
          No tienes un viaje publicado
        </Text>
        <Text className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Publica tu recorrido universitario para compartir gastos y viajar acompañado.
        </Text>
      </View>
    );
  }

  const passengers = currentRoutePassengerTrips.length > 0
    ? currentRoutePassengerTrips
    : activeDriverTrip.passengers || [];

  const totalSeats = activeDriverTrip.available_seats || activeDriverTrip.total_seats || 3;
  const occupiedSeats = passengers.length;
  const freeSeats = Math.max(0, totalSeats - occupiedSeats);

  const allPassengersBoarded = passengers.length > 0 && passengers.every((p: any) => p.is_pin_verified || p.status === 'recogido');
  const unverifiedPassengers = passengers.filter((p: any) => !p.is_pin_verified && p.status !== 'recogido');

  // Acciones de ciclo de vida
  const handleStartDriving = async () => {
    setIsUpdatingLifecycle(true);
    setGeneralError('');
    try {
      await iniciarRecorridoDeRuta(String(activeDriverTrip.route_id || activeDriverTrip.id));
      setTripStatus('en_camino');
      setActiveDriverTrip({ ...activeDriverTrip, status: 'en_camino' });
    } catch (error: any) {
      setGeneralError(error?.message || 'No se pudo actualizar el viaje. Inténtalo de nuevo.');
    }
    setIsUpdatingLifecycle(false);
  };

  const handleArriveAtMeetingPoint = async () => {
    setIsUpdatingLifecycle(true);
    setGeneralError('');
    try {
      await llegarAlPuntoDeRuta(String(activeDriverTrip.route_id || activeDriverTrip.id));
      setTripStatus('en_punto_encuentro');
      setActiveDriverTrip({ ...activeDriverTrip, status: 'en_punto_encuentro' });
    } catch (error: any) {
      setGeneralError(error?.message || 'No se pudo actualizar el viaje. Inténtalo de nuevo.');
    }
    setIsUpdatingLifecycle(false);
  };

  const handleOpenPinModal = (passenger: any) => {
    setSelectedPassengerForPin(passenger);
    setPinInput('');
    setPinError('');
  };

  const handleVerifyPin = async () => {
    if (!selectedPassengerForPin) return;
    if (pinInput.trim().length !== 4) {
      setPinError('Ingresa el código PIN de 4 dígitos.');
      return;
    }

    setIsVerifyingPin(true);
    setPinError('');
    try {
      await tripLifecycleService.verifyPin(selectedPassengerForPin.id, pinInput.trim());
      // Marcar pasajero como verificado localmente
      const updatedPassengers = passengers.map((p: any) =>
        p.id === selectedPassengerForPin.id
          ? { ...p, is_pin_verified: true, status: 'recogido' }
          : p
      );
      setCurrentRoutePassengerTrips(updatedPassengers);
      setSelectedPassengerForPin(null);

      // Si todos abordaron, pasar a en_curso
      if (updatedPassengers.every((p: any) => p.is_pin_verified || p.status === 'recogido')) {
        setTripStatus('en_curso');
        setActiveDriverTrip({ ...activeDriverTrip, status: 'en_curso', passengers: updatedPassengers });
      }
    } catch (err: any) {
      setPinError(err?.message || 'PIN de abordaje inválido. Pide al estudiante que revise su app.');
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const handleCall = (phoneNumber?: string) => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {});
  };

  const handleWhatsApp = (phoneNumber?: string, name?: string) => {
    if (!phoneNumber) return;
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const numWithCountry = cleanNumber.startsWith('57') ? cleanNumber : `57${cleanNumber}`;
    const text = encodeURIComponent(`¡Hola ${name || ''}! Te escribo de UniWheels sobre nuestro viaje hacia el campus.`);
    Linking.openURL(`https://wa.me/${numWithCountry}?text=${text}`).catch(() => {});
  };

  const getStatusLabel = () => {
    if (tripStatus === 'en_curso' || allPassengersBoarded) return 'En Curso';
    if (tripStatus === 'en_punto_encuentro') return 'En Punto de Encuentro';
    if (tripStatus === 'en_camino') return 'En Camino';
    return 'Publicado';
  };

  const getStatusBg = () => {
    if (tripStatus === 'en_curso' || allPassengersBoarded) return 'bg-emerald-500/15 border-emerald-400 text-emerald-600 dark:text-emerald-400';
    if (tripStatus === 'en_punto_encuentro') return 'bg-amber-500/15 border-amber-400 text-amber-600 dark:text-amber-400';
    if (tripStatus === 'en_camino') return 'bg-lochmara-500/15 border-lochmara-400 text-lochmara-600 dark:text-lochmara-400';
    return 'bg-slate-500/15 border-slate-400 text-slate-600 dark:text-slate-400';
  };

  return (
    <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="gap-4">
        {/* 1. TARJETA CABECERA DEL VIAJE */}
        <View className="p-5 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 gap-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className={`px-3 py-1 rounded-full border flex-row items-center gap-1.5 ${getStatusBg()}`}>
              <View className="w-2 h-2 rounded-full bg-current" />
              <Text className="text-[11px] font-bold uppercase">{getStatusLabel()}</Text>
            </View>
            <Text className="text-xs font-mono font-bold text-lochmara-600 dark:text-lochmara-400">
              {activeDriverTrip.departure_time || activeDriverTrip.departureTime || '06:45 AM'}
            </Text>
          </View>

          {/* Trayecto Origen / Destino */}
          <View className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 gap-2">
            <View className="flex-row items-center gap-2.5">
              <View className="w-3 h-3 rounded-full bg-lochmara-500 shrink-0" />
              <View className="flex-1">
                <Text className="text-[10px] text-slate-400 font-medium">Origen</Text>
                <Text className="text-xs font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                  {activeDriverTrip.origin}
                </Text>
              </View>
            </View>

            <View className="h-3 border-l-2 border-dashed border-slate-300 dark:border-slate-700 ml-1.5" />

            <View className="flex-row items-center gap-2.5">
              <View className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
              <View className="flex-1">
                <Text className="text-[10px] text-slate-400 font-medium">Destino</Text>
                <Text className="text-xs font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                  {activeDriverTrip.destination}
                </Text>
              </View>
            </View>
          </View>

          {/* Métricas rápidas */}
          <View className="flex-row gap-2">
            <View className="flex-1 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <Text className="text-[10px] font-medium text-slate-400">Cupos Ocupados</Text>
              <Text className="text-sm font-black text-lochmara-600 dark:text-lochmara-400 mt-0.5">
                {occupiedSeats} de {totalSeats} ({freeSeats} libres)
              </Text>
            </View>

            <View className="flex-1 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <Text className="text-[10px] font-medium text-slate-400">Aporte por Cupo</Text>
              <Text className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {Number(activeDriverTrip.fare_cop ?? activeDriverTrip.price ?? 0) > 0
                  ? `$${Number(activeDriverTrip.fare_cop ?? activeDriverTrip.price).toLocaleString('es-CO')}`
                  : 'Gratis'}
              </Text>
            </View>
          </View>
        </View>

        {generalError ? (
          <AlertBanner type="error" message={generalError} onClose={() => setGeneralError('')} />
        ) : null}

        {/* 2. LISTA DE PASAJEROS CONFIRMADOS */}
        <View className="p-4 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 gap-3 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Users size={16} color="#0284c7" />
              <Text className="text-xs font-black text-slate-900 dark:text-white">
                Pasajeros Confirmados
              </Text>
            </View>
            {optimizedOrder && (
              <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-lg bg-lochmara-50 dark:bg-slate-800">
                <Sparkles size={11} color="#0284c7" />
                <Text className="text-[10px] font-bold text-lochmara-600 dark:text-lochmara-400">
                  Orden Óptimo IA
                </Text>
              </View>
            )}
          </View>

          {passengers.length === 0 ? (
            <View className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 items-center text-center gap-1">
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Esperando reservas...
              </Text>
              <Text className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                Los estudiantes verán tu ruta publicada y podrán solicitar cupos.
              </Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {passengers.map((p: any, idx: number) => {
                const isVerified = p.is_pin_verified || p.status === 'recogido';
                const passengerName = p.passenger_name || p.name || `Pasajero ${idx + 1}`;
                const program = p.program || p.academic_program || 'Estudiante UNAB';
                const pickup = p.pickup_address || p.pickup || 'Punto acordado';
                const phone = p.phone_number || p.phone || '3151234567';

                return (
                  <View
                    key={p.id || idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 gap-2.5"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                        <View className="w-8 h-8 rounded-full bg-lochmara-600 items-center justify-center">
                          <Text className="text-xs font-bold text-white">
                            {passengerName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs font-black text-slate-900 dark:text-white" numberOfLines={1}>
                            {passengerName}
                          </Text>
                          <Text className="text-[10px] text-slate-400" numberOfLines={1}>
                            {program} • {pickup}
                          </Text>
                        </View>
                      </View>

                      {/* Badge de Abordaje */}
                      <View
                        className={`px-2.5 py-0.5 rounded-full border ${
                          isVerified
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-bold ${
                            isVerified
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : 'text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {isVerified ? 'A Bordo' : 'Esperando'}
                        </Text>
                      </View>
                    </View>

                    {/* Acciones de Contacto y Validación de PIN */}
                    <View className="flex-row items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                      <View className="flex-row items-center gap-2">
                        <Pressable
                          onPress={() => handleCall(phone)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 flex-row items-center gap-1.5"
                        >
                          <Phone size={12} color="#0284c7" />
                          <Text className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                            Llamar
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() => handleWhatsApp(phone, passengerName)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex-row items-center gap-1.5"
                        >
                          <MessageSquare size={12} color="#10b981" />
                          <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            WhatsApp
                          </Text>
                        </Pressable>
                      </View>

                      {!isVerified && (
                        <Pressable
                          onPress={() => handleOpenPinModal(p)}
                          className="px-3 py-1.5 rounded-xl bg-lochmara-600 flex-row items-center gap-1.5 active:bg-lochmara-700"
                        >
                          <KeyRound size={12} color="#ffffff" />
                          <Text className="text-[10px] font-bold text-white">Validar PIN</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 3. BOTÓN PRIMARIO DINÁMICO DEL CICLO DE VIDA */}
        <View className="gap-2.5">
          {tripStatus === 'publicado' && (
            <Pressable
              disabled={isUpdatingLifecycle}
              onPress={handleStartDriving}
              className="w-full py-4 rounded-2xl bg-lochmara-600 active:bg-lochmara-700 flex-row items-center justify-center gap-2 shadow-lg shadow-lochmara-600/30"
            >
              {isUpdatingLifecycle ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Navigation size={18} color="#ffffff" />
                  <Text className="text-xs font-bold text-white">Iniciar Recorrido</Text>
                </>
              )}
            </Pressable>
          )}

          {tripStatus === 'en_camino' && (
            <Pressable
              disabled={isUpdatingLifecycle}
              onPress={handleArriveAtMeetingPoint}
              className="w-full py-4 rounded-2xl bg-amber-600 active:bg-amber-700 flex-row items-center justify-center gap-2 shadow-lg shadow-amber-600/30"
            >
              {isUpdatingLifecycle ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <MapPin size={18} color="#ffffff" />
                  <Text className="text-xs font-bold text-white">Llegué al Punto de Encuentro</Text>
                </>
              )}
            </Pressable>
          )}

          {tripStatus === 'en_punto_encuentro' && unverifiedPassengers.length > 0 && (
            <Pressable
              onPress={() => handleOpenPinModal(unverifiedPassengers[0])}
              className="w-full py-4 rounded-2xl bg-lochmara-600 active:bg-lochmara-700 flex-row items-center justify-center gap-2 shadow-lg shadow-lochmara-600/30"
            >
              <KeyRound size={18} color="#ffffff" />
              <Text className="text-xs font-bold text-white">
                Verificar PIN de {unverifiedPassengers[0].passenger_name || 'Pasajero'}
              </Text>
            </Pressable>
          )}

          {(tripStatus === 'en_curso' || allPassengersBoarded) && (
            <Pressable
              onPress={onOpenNavigator}
              className="w-full py-4 rounded-2xl bg-emerald-600 active:bg-emerald-700 flex-row items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
            >
              <Navigation size={18} color="#ffffff" />
              <Text className="text-xs font-bold text-white">Iniciar Navegación GPS</Text>
              <ArrowRight size={16} color="#ffffff" />
            </Pressable>
          )}

          {/* Botón de Finalización */}
          {(tripStatus === 'en_curso' || allPassengersBoarded) && (
            <Pressable
              onPress={onCompleteTrip}
              className="w-full py-3.5 rounded-2xl border border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 flex-row items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} color="#10b981" />
              <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                Finalizar Viaje
              </Text>
            </Pressable>
          )}

          {/* Botón de Cancelación */}
          <Pressable
            onPress={onOpenCancelModal}
            className="w-full py-3 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 flex-row items-center justify-center gap-1.5"
          >
            <AlertTriangle size={14} color="#e11d48" />
            <Text className="text-xs font-bold text-rose-600 dark:text-rose-400">
              Cancelar Publicación de Viaje
            </Text>
          </Pressable>
        </View>
      </View>

      {/* MODAL DE VERIFICACIÓN DE PIN */}
      <Modal
        visible={isPinModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPassengerForPin(null)}
      >
        <Pressable
          className="flex-1 bg-black/75 items-center justify-center p-4"
          onPress={() => setSelectedPassengerForPin(null)}
        >
          <Animated.View style={[pinModalAnimatedStyle, { width: '100%', maxWidth: 320 }]}>
            <Pressable
              className="w-full bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 gap-3.5 shadow-2xl"
              onPress={(e) => e.stopPropagation()}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <KeyRound size={18} color="#0284c7" />
                  <Text className="text-sm font-black text-slate-900 dark:text-white">
                    Validar PIN de Abordaje
                  </Text>
                </View>
                <Pressable
                  onPress={() => setSelectedPassengerForPin(null)}
                  className="p-1 rounded-full bg-slate-100 dark:bg-slate-800"
                >
                  <X size={16} color="#94a3b8" />
                </Pressable>
              </View>

              <Text className="text-xs text-slate-500 dark:text-slate-400">
                Ingresa el código de 4 dígitos que{' '}
                <Text className="font-bold text-slate-900 dark:text-white">
                  {selectedPassengerForPin?.passenger_name || 'el estudiante'}
                </Text>{' '}
                tiene en su pantalla.
              </Text>

              <TextInput
                value={pinInput}
                onChangeText={(t) => setPinInput(t.replace(/\D/g, '').slice(0, 4))}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="••••"
                placeholderTextColor="#94a3b8"
                autoFocus
                className="py-3 px-4 rounded-2xl text-2xl font-mono font-black text-center tracking-[0.5em] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />

              {pinError ? (
                <Text className="text-xs font-medium text-rose-600 dark:text-rose-400 text-center">
                  {pinError}
                </Text>
              ) : null}

              <Pressable
                disabled={isVerifyingPin || pinInput.length !== 4}
                onPress={handleVerifyPin}
                // Clases fijas: si `active:` aparece o desaparece en caliente, NativeWind cambia el
                // componente por uno interactivo y dentro del Modal falla sin contexto de navegación.
                className="w-full py-3 rounded-2xl flex-row items-center justify-center gap-2 bg-lochmara-600 active:bg-lochmara-700"
                style={{ opacity: isVerifyingPin || pinInput.length !== 4 ? 0.5 : 1 }}
              >
                {isVerifyingPin ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-xs font-bold text-white">Confirmar Abordaje</Text>
                )}
              </Pressable>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
