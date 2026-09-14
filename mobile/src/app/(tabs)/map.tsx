import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronUp,
  Route as RouteIcon,
  Search,
  ShieldCheck,
  Smartphone,
} from 'lucide-react-native';
import { fetchRoadGeometry, getPlaceCoordinates, tripLifecycleService, useAppStore } from '@uniwheels/shared';
import { TripRouteMap } from '@/components/TripRouteMap';
import { PaymentMethodSelectorModal, type PaymentMethodId } from '@/components/PaymentMethodSelectorModal';
import { WompiWidgetModal, type WompiWidgetParams } from '@/components/WompiWidgetModal';

const PAYMENT_METHOD_BACKEND_MAP: Record<PaymentMethodId, string> = {
  nequi_direct: 'nequi_directo',
  cash_direct: 'efectivo',
  card_instant: 'tarjeta',
};
const PAYMENT_METHOD_LABEL: Record<PaymentMethodId, string> = {
  nequi_direct: 'Nequi Directo',
  cash_direct: 'Efectivo al abordar',
  card_instant: 'Tarjeta Débito/Crédito',
};

const initialsOf = (name?: string) =>
  name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CU';

/**
 * Equivalente recortado a frontend/src/components/map/TripMapView.jsx +
 * TripMapOverlayControls.jsx (juntos, ~1200 líneas en la web). Se porta la
 * parte real y funcional — mapa con origen/destino/polilínea OSRM real,
 * tarjeta expandible con datos del conductor, selector de método de pago real
 * y reserva real contra trip-service — y se deja fuera deliberadamente lo
 * decorativo/demo: el simulador de GPS en vivo (botón "Reproducir" que anima
 * un vehículo a velocidad falsa, no es tracking real), el selector de
 * vehículo moto/carro (no aplica a una ruta real ya buscada) y el modo
 * "Recogida con Desvío" (una función real pero de alcance propio, aún no
 * portada — ver AGENTS.md).
 */
export default function MapScreen() {
  const selectedSearchRoute = useAppStore((s) => s.selectedSearchRoute);
  const clearSelectedSearchRoute = useAppStore((s) => s.clearSelectedSearchRoute);
  const bookPassengerTrip = useAppStore((s) => s.bookPassengerTrip);

  if (!selectedSearchRoute) {
    return (
      <SafeAreaView edges={[]} className="flex-1 bg-slate-100 dark:bg-slate-950 items-center justify-center p-6">
        <View className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 items-center gap-4">
          <View className="w-16 h-16 rounded-3xl bg-lochmara-500/10 border border-lochmara-500/20 items-center justify-center">
            <RouteIcon size={30} color="#0284c7" />
          </View>
          <View className="items-center gap-1.5">
            <Text className="text-base font-black text-slate-900 dark:text-white text-center">
              No tienes ninguna ruta activa
            </Text>
            <Text className="text-xs text-slate-400 text-center leading-relaxed">
              Aún no has seleccionado una ruta para explorar. Elige un trayecto en el inicio para ver el mapa y reservar tu
              cupo.
            </Text>
          </View>
          <View className="w-full gap-2">
            <Pressable
              onPress={() => router.push('/(tabs)')}
              className="w-full py-3.5 rounded-2xl bg-lochmara-600 flex-row items-center justify-center gap-2"
            >
              <Search size={16} color="#ffffff" />
              <Text className="text-white text-xs font-black">Explorar Viajes en Inicio</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/history')}
              className="w-full py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex-row items-center justify-center gap-1.5"
            >
              <Calendar size={14} color="#64748b" />
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Ver Mi Historial</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <RouteBookingView route={selectedSearchRoute} onClear={clearSelectedSearchRoute} onBooked={bookPassengerTrip} />
  );
}

function RouteBookingView({
  route,
  onClear,
  onBooked,
}: {
  route: NonNullable<ReturnType<typeof useAppStore.getState>['selectedSearchRoute']>;
  onClear: () => void;
  onBooked: (payload: any) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [originCoord] = useState<[number, number]>(() => getPlaceCoordinates(route.origin, false));
  const [destinationCoord] = useState<[number, number]>(() => getPlaceCoordinates(route.destination, true));
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('nequi_direct');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [wompiParams, setWompiParams] = useState<WompiWidgetParams | null>(null);

  useEffect(() => {
    fetchRoadGeometry([originCoord, destinationCoord]).then(setRouteCoords);
  }, [originCoord, destinationCoord]);

  const fareCop = route.fare_cop || 4500;

  const confirmarReserva = async () => {
    setIsBooking(true);
    try {
      const metodoPagoBackend = PAYMENT_METHOD_BACKEND_MAP[paymentMethod];
      // route_id, tarifa y PIN de abordaje reales los resuelve/genera
      // trip-service server-side a partir del route_id.
      const respuesta = await tripLifecycleService.bookTrip({
        route_id: route.id,
        driver_name: route.driverName,
        vehicle_plate: route.plate,
        vehicle_model: route.vehicle,
        pickup_address: route.origin,
        dropoff_address: route.destination,
        total_fare_cop: fareCop,
        scheduled_pickup_time: route.scheduled_date ? `${route.scheduled_date}T00:00:00` : new Date().toISOString(),
        payment_method: metodoPagoBackend,
      });

      const tripIdReal = respuesta?.data?.trip_id || route.id;

      onBooked({
        id: tripIdReal,
        driverName: route.driverName,
        vehicle: route.vehicle,
        plate: route.plate,
        departureTime: route.departureTime,
        origin: route.origin,
        destination: route.destination,
        fare: fareCop,
        boardingPin: respuesta?.data?.boarding_pin,
        paymentMethod,
        pickup_lat: originCoord[0],
        pickup_lng: originCoord[1],
        destination_lat: destinationCoord[0],
        destination_lng: destinationCoord[1],
      });

      // Pago con tarjeta: se cobra de una vez al confirmar la reserva (Wompi).
      if (metodoPagoBackend === 'tarjeta' && respuesta?.data?.trip_id) {
        try {
          const params = await tripLifecycleService.initCardPayment(respuesta.data.trip_id);
          if (params?.public_key) setWompiParams(params);
        } catch {
          // El conductor verá el viaje como pago pendiente — no bloquea la reserva.
        }
      }

      onClear();
      router.push('/(tabs)/history');
    } catch (err: any) {
      Alert.alert('No se pudo reservar', err?.message || 'Intenta nuevamente en unos segundos.');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-100 dark:bg-slate-950">
      <TripRouteMap originCoord={originCoord} destinationCoord={destinationCoord} routeCoords={routeCoords} />

      <SafeAreaView edges={['top']} className="absolute top-0 left-0 right-0" pointerEvents="box-none">
        <View className="px-3 pt-2">
          <Pressable
            onPress={() => {
              onClear();
              router.push('/(tabs)');
            }}
            className="self-start flex-row items-center gap-1.5 px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <ArrowLeft size={15} color="#0284c7" />
            <Text className="text-xs font-bold text-slate-800 dark:text-white">Inicio</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <View
        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl p-4 border-t border-slate-200 dark:border-slate-800 gap-3"
        style={{ paddingBottom: 28 }}
      >
        <Pressable onPress={() => setExpanded((e) => !e)} className="items-center py-0.5 -mt-1">
          <View className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </Pressable>

        <Pressable onPress={() => setExpanded((e) => !e)} className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3 flex-1 min-w-0">
            <View className="w-11 h-11 rounded-2xl bg-lochmara-500/10 border border-lochmara-500/20 items-center justify-center shrink-0">
              <Text className="text-sm font-black text-lochmara-600 dark:text-lochmara-400">
                {initialsOf(route.driverName)}
              </Text>
            </View>
            <View className="flex-1 min-w-0">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-xs font-black text-slate-900 dark:text-white" numberOfLines={1}>
                  {route.driverName}
                </Text>
                <ShieldCheck size={13} color="#0284c7" />
              </View>
              <Text className="text-[11px] text-slate-400" numberOfLines={1}>
                {route.vehicle} • {route.plate} • {route.availableSeats} cupos
              </Text>
            </View>
          </View>
          <View className="items-end shrink-0 pl-2">
            <Text className="text-sm font-black text-emerald-600 dark:text-emerald-400">{route.fare}</Text>
            <Text className="text-[9px] text-slate-400 font-bold">Aporte por cupo</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => setExpanded((e) => !e)}
          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 gap-2"
        >
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-row items-center gap-2 flex-1 min-w-0">
              <View className="w-2.5 h-2.5 rounded-full bg-lochmara-500 shrink-0" />
              <Text className="text-xs font-bold text-slate-800 dark:text-slate-200 flex-1" numberOfLines={1}>
                {route.origin}
              </Text>
            </View>
            <Text className="text-[10px] font-bold text-slate-400 shrink-0">Salida {route.departureTime || '—'}</Text>
          </View>
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-row items-center gap-2 flex-1 min-w-0">
              <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <Text className="text-xs font-bold text-slate-800 dark:text-slate-200 flex-1" numberOfLines={1}>
                {route.destination}
              </Text>
            </View>
            <Text className="text-[10px] font-black text-emerald-500 shrink-0">Llegada ~{route.arrivalTime || '—'}</Text>
          </View>
        </Pressable>

        {expanded ? (
          <>
            <Pressable
              onPress={() => setIsPaymentModalOpen(true)}
              className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-2">
                <Smartphone size={16} color="#a855f7" />
                <View>
                  <Text className="text-xs font-bold text-slate-900 dark:text-white">{PAYMENT_METHOD_LABEL[paymentMethod]}</Text>
                  <Text className="text-[10px] text-slate-400">Método de pago seleccionado</Text>
                </View>
              </View>
              <Text className="text-[10px] font-bold text-lochmara-500">Cambiar</Text>
            </Pressable>

            <Pressable
              onPress={confirmarReserva}
              disabled={isBooking}
              className="py-3.5 rounded-2xl bg-emerald-600 flex-row items-center justify-center gap-2 disabled:opacity-60"
            >
              {isBooking ? <ActivityIndicator color="#ffffff" /> : <CheckCircle2 size={16} color="#ffffff" />}
              <Text className="text-white text-xs font-black">
                Confirmar Reserva (${fareCop.toLocaleString('es-CO')} COP)
              </Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={() => setExpanded(true)}
            className="py-3 rounded-2xl bg-lochmara-600 flex-row items-center justify-center gap-1.5"
          >
            <Text className="text-white text-xs font-black">Ver Opciones y Reservar</Text>
            <ChevronUp size={16} color="#ffffff" />
          </Pressable>
        )}
      </View>

      <PaymentMethodSelectorModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedMethod={paymentMethod}
        onSelectMethod={setPaymentMethod}
        fareAmount={fareCop}
      />

      <WompiWidgetModal
        isOpen={Boolean(wompiParams)}
        params={wompiParams}
        onClose={() => setWompiParams(null)}
        onResult={() => setWompiParams(null)}
      />
    </View>
  );
}
