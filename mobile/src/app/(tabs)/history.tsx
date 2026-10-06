import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Car, Calendar, Sparkles, Star } from 'lucide-react-native';
import { tripsService, useAppStore } from '@uniwheels/shared';
import { FUNCIONES_SOLO_LOCALES } from '@/config/funciones';
import { RatingFeedbackModal } from '@/components/RatingFeedbackModal';
import { ActiveRoleConflictBlocker } from '@/components/ActiveRoleConflictBlocker';
import { DriverHistoryView } from '@/components/driver/DriverHistoryView';
import { usePassengerBookingSync } from '@/hooks/usePassengerBookingSync';
import { PassengerActiveTripCard } from '@/components/PassengerActiveTripCard';
import { SmartMatchAlertsModal } from '@/components/SmartMatchAlertsModal';

/**
 * Equivalente simplificado a frontend/src/components/trips/PassengerTripsView.jsx
 * (1332 líneas en la web) — se replican las dos partes reales (reserva activa
 * + historial real vía tripsService.getPassengerHistory), sin las secciones de
 * "alertas Smart Match"/"rutinas recurrentes": esas viven solo como mock local
 * en la web, sin backend real detrás (ver packages/shared/README.md).
 */
export default function HistoryScreen() {
  const activeRole = useAppStore((state) => state.activeRole);
  usePassengerBookingSync(activeRole === 'passenger');
  const activeDriverTrip = useAppStore((state) => state.activeDriverTrip);
  const activePassengerBooking = useAppStore((state) => state.activePassengerBooking);
  const recurringPassengerAlerts = useAppStore((state) => state.recurringPassengerAlerts);
  const toggleRole = useAppStore((state) => state.toggleRole);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalCalificacion, setModalCalificacion] = useState<{ trip: any } | null>(null);
  const [modalAlertasAbierto, setModalAlertasAbierto] = useState(false);

  useEffect(() => {
    tripsService.getPassengerHistory().then((data) => {
      setHistory(Array.isArray(data) ? data : []);
      setIsLoading(false);
    });
  }, []);

  const rate = (trip: any) => setModalCalificacion({ trip });

  const guardarCalificacion = async ({ rating, comment }: { rating: number; comment: string }) => {
    const trip = modalCalificacion?.trip;
    if (!trip) return;
    try {
      await tripsService.submitRating({
        trip_id: trip.id,
        rated_user_id: trip.driver_id,
        role_rated: 'conductor',
        score: rating,
        optional_comment: comment || undefined,
      });
    } catch (error: any) {
      Alert.alert('No se pudo enviar la calificación', error?.message || 'Inténtalo de nuevo más tarde.');
      return;
    }
    setHistory((prev) => prev.map((v) => (v.id === trip.id ? { ...v, rated: true, ratingScore: rating } : v)));
  };

  if (activeRole === 'passenger' && activeDriverTrip) {
    return (
      <ActiveRoleConflictBlocker
        conflictType="driver_active"
        activeTrip={activeDriverTrip}
        onRedirect={() => {
          toggleRole();
          router.replace('/(tabs)');
        }}
      />
    );
  }

  if (activeRole === 'driver' && activePassengerBooking) {
    return (
      <ActiveRoleConflictBlocker
        conflictType="passenger_active"
        activeTrip={activePassengerBooking}
        onRedirect={() => {
          toggleRole();
          router.replace('/(tabs)/history');
        }}
      />
    );
  }

  if (activeRole === 'driver') {
    return <DriverHistoryView />;
  }

  return (
    <ScrollView className="flex-1 bg-slate-100 dark:bg-slate-950" contentContainerStyle={{ padding: 16, gap: 12 }}>
      {activePassengerBooking && <PassengerActiveTripCard />}

      {/* Rutinas Smart Match */}
      {FUNCIONES_SOLO_LOCALES && (
      <View className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2.5 flex-1 mr-2">
          <View className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 items-center justify-center">
            <Sparkles size={16} color="#f59e0b" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-black text-slate-900 dark:text-white">Alertas Smart Match</Text>
            <Text className="text-[10px] text-slate-400">
              {recurringPassengerAlerts.length > 0
                ? `${recurringPassengerAlerts.length} rutina(s) activa(s)`
                : 'Configura tus horarios de clase'}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => setModalAlertasAbierto(true)}
          className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30"
        >
          <Text className="text-[11px] font-black text-amber-600 dark:text-amber-400">Gestionar</Text>
        </Pressable>
      </View>
      )}

      <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Historial de Viajes</Text>

      {isLoading ? (
        <Text className="text-center text-xs text-slate-400 py-6">Cargando...</Text>
      ) : history.length === 0 ? (
        <View className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 items-center gap-2">
          <Car size={20} color="#0284c7" />
          <Text className="text-xs font-black text-slate-900 dark:text-white text-center">Todavía no tienes viajes completados</Text>
          <Text className="text-[11px] text-slate-400 text-center">Cuando completes tu primer viaje, aparecerá aquí.</Text>
        </View>
      ) : (
        history.map((trip) => (
          <View key={trip.id} className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-black text-slate-900 dark:text-white">{trip.driver_name}</Text>
              <View className="flex-row items-center gap-1">
                <Calendar size={11} color="#94a3b8" />
                <Text className="text-[10px] text-slate-400">{trip.date}</Text>
              </View>
            </View>
            <Text className="text-[10px] text-slate-500" numberOfLines={1}>
              {trip.origin} → {trip.destination}
            </Text>
            <View className="flex-row items-center justify-between pt-1">
              <Text className="text-xs font-bold text-lochmara-600 dark:text-lochmara-400">
                $ {Number(trip.fare_cop || 0).toLocaleString('es-CO')} COP
              </Text>
              {trip.rated ? (
                <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <Star size={13} color="#fbbf24" fill="#fbbf24" />
                  <Text className="text-[11px] font-bold text-amber-500">{(trip.ratingScore || 5).toFixed(1)}</Text>
                </View>
              ) : (
                <Pressable onPress={() => rate(trip)} className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lochmara-600">
                  <Star size={13} color="#ffffff" fill="#ffffff" />
                  <Text className="text-[11px] font-bold text-white">Calificar Conductor</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))
      )}

      <RatingFeedbackModal
        isOpen={Boolean(modalCalificacion)}
        onClose={() => setModalCalificacion(null)}
        targetType="driver"
        targetName={modalCalificacion?.trip?.driver_name || 'Conductor Universitario'}
        onSubmitRating={guardarCalificacion}
      />

      <SmartMatchAlertsModal
        isOpen={modalAlertasAbierto}
        onClose={() => setModalAlertasAbierto(false)}
      />
    </ScrollView>
  );
}
