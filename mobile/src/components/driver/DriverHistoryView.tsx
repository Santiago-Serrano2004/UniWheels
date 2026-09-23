import { useEffect, useState, useMemo } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowRight,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  DollarSign,
  Leaf,
  Play,
  Plus,
  Power,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react-native';
import { routesService, tripsService, useAppStore } from '@uniwheels/shared';
import { RatingFeedbackModal } from '@/components/RatingFeedbackModal';

type PeriodFilter = 'todos' | 'semana' | 'mes';

export function DriverHistoryView() {
  const publishedDriverTrips = useAppStore((state) => state.publishedDriverTrips);
  const setPublishedDriverTrips = useAppStore((state) => state.setPublishedDriverTrips);
  const cancelPublishedTrip = useAppStore((state) => state.cancelPublishedTrip);
  const startPublishedTrip = useAppStore((state) => state.startPublishedTrip);
  const recurringDriverTrips = useAppStore((state) => state.recurringDriverTrips);
  const toggleRecurringDriverTrip = useAppStore((state) => state.toggleRecurringDriverTrip);
  const addRecurringDriverTrip = useAppStore((state) => state.addRecurringDriverTrip);
  const deleteRecurringDriverTrip = useAppStore((state) => state.deleteRecurringDriverTrip);

  const [activeSection, setActiveSection] = useState<'published' | 'recurring' | 'history'>('published');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('todos');

  // Modal Calificación
  const [modalCalificacion, setModalCalificacion] = useState<{
    pasajero: any;
    tripId: string | number;
  } | null>(null);

  // Modal Nueva Rutina
  const [modalNuevaRutina, setModalNuevaRutina] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState('Ruta a Clases');
  const [nuevosDias, setNuevosDias] = useState<string[]>(['Lun', 'Mar', 'Mié', 'Jue', 'Vie']);
  const [nuevaHora, setNuevaHora] = useState('06:30');
  const [nuevoOrigen, setNuevoOrigen] = useState('Cañaveral - C.C. Parque Caracolí');
  const [nuevoDestino, setNuevoDestino] = useState('Campus El Jardín');
  const [nuevosCupos, setNuevosCupos] = useState(3);
  const [nuevaTarifa, setNuevaTarifa] = useState('4500');

  // Historial de viajes completados
  const [viajesHistorial, setViajesHistorial] = useState<any[]>([]);
  const [viajeExpandido, setViajeExpandido] = useState<string | number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    tripsService.getDriverHistory().then((data) => {
      const completados = (data || []).filter((d: any) => d.status === 'completado');
      const formateados = completados.map((d: any) => ({
        id: d.id,
        date: d.date || new Date().toISOString().split('T')[0],
        origin: d.origin,
        destination: d.destination,
        totalEarned: Number(d.fare_cop) || 0,
        driverEarnings: Number(d.earnings_cop) || Math.round((Number(d.fare_cop) || 0) * 0.88),
        passenger: {
          id: d.passenger_id,
          name: d.passenger_name || 'Pasajero',
          pickup: d.pickup_address,
          rated: false,
        },
      }));
      setViajesHistorial(formateados);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    routesService.getMyRoutes().then(async (rutas) => {
      if (!rutas || rutas.length === 0) return;

      const enriquecidas = await Promise.all(
        rutas.map(async (r: any) => {
          const pasajeros = await tripsService.getActiveTripsForRoute(r.id);
          return {
            id: r.id,
            origin: r.origin_name || r.origin,
            destination: r.destination_campus_name || r.destination,
            departure_time: r.departure_time,
            date: r.scheduled_departure_time ? r.scheduled_departure_time.split('T')[0] : 'Hoy',
            available_seats: r.available_seats,
            fare_cop: r.base_contribution_cop,
            origin_lat: r.origin_lat,
            origin_lng: r.origin_lng,
            destination_lat: r.destination_lat,
            destination_lng: r.destination_lng,
            route_path: r.route_path,
            status: r.status === 'publicada' ? 'publicado' : r.status,
            passengers: (pasajeros || []).map((p: any) => ({
              id: p.id,
              name: p.passenger_name || 'Pasajero',
              pickup: p.pickup_address,
              isPinVerified: p.is_pin_verified,
            })),
          };
        })
      );

      setPublishedDriverTrips(enriquecidas);
    });
  }, [setPublishedDriverTrips]);

  // Cálculos de métricas consolidadas
  const totalNetEarnings = useMemo(() => {
    return viajesHistorial.reduce((acc, v) => acc + (v.driverEarnings || 0), 0);
  }, [viajesHistorial]);

  const totalPassengers = useMemo(() => {
    return viajesHistorial.length;
  }, [viajesHistorial]);

  const co2SavedKg = useMemo(() => {
    return (totalPassengers * 2.3).toFixed(1);
  }, [totalPassengers]);

  const avgRating = 4.9;

  // Filtrado por período
  const filteredHistorial = useMemo(() => {
    if (periodFilter === 'todos') return viajesHistorial;
    const now = new Date();
    return viajesHistorial.filter((v) => {
      if (!v.date) return true;
      const tripDate = new Date(v.date);
      if (isNaN(tripDate.getTime())) return true;
      const diffDays = (now.getTime() - tripDate.getTime()) / (1000 * 3600 * 24);
      if (periodFilter === 'semana') return diffDays <= 7;
      if (periodFilter === 'mes') return diffDays <= 30;
      return true;
    });
  }, [viajesHistorial, periodFilter]);

  const toggleDiaSeleccionado = (dia: string) => {
    if (nuevosDias.includes(dia)) {
      if (nuevosDias.length > 1) {
        setNuevosDias(nuevosDias.filter((d) => d !== dia));
      }
    } else {
      setNuevosDias([...nuevosDias, dia]);
    }
  };

  const handleCrearRutina = () => {
    if (!nuevoTitulo.trim()) {
      Alert.alert('Campo requerido', 'Ingresa un nombre para la rutina.');
      return;
    }
    addRecurringDriverTrip({
      title: nuevoTitulo.trim(),
      days: nuevosDias,
      direction: 'hacia_campus',
      departure_time: nuevaHora,
      origin: nuevoOrigen,
      destination: nuevoDestino,
      seats: Number(nuevosCupos),
      fare_cop: Number(nuevaTarifa),
    });
    setModalNuevaRutina(false);
  };

  const guardarCalificacion = async ({ rating, comment }: { rating: number; comment: string }) => {
    if (!modalCalificacion?.pasajero || !modalCalificacion?.tripId) return;

    try {
      await tripsService.submitRating({
        trip_id: modalCalificacion.tripId,
        rated_user_id: modalCalificacion.pasajero.id,
        role_rated: 'pasajero',
        score: rating,
        optional_comment: comment || undefined,
      });
    } catch {
      // Registrar localmente
    }

    setViajesHistorial((prev) =>
      prev.map((viaje) =>
        viaje.id === modalCalificacion.tripId
          ? { ...viaje, passenger: { ...viaje.passenger, rated: true, ratingScore: rating } }
          : viaje
      )
    );
  };

  const handleStartTrip = (tripId: string | number) => {
    startPublishedTrip(tripId);
    router.replace('/(tabs)');
  };

  return (
    <ScrollView className="flex-1 bg-slate-100 dark:bg-slate-950" contentContainerStyle={{ padding: 16, gap: 14 }}>
      {/* 1. Header con Insignia de Modo Conductor */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 items-center justify-center">
            <Car size={16} color="#10b981" />
          </View>
          <View>
            <Text className="text-sm font-black text-slate-900 dark:text-white">Gestión de Conducción</Text>
            <Text className="text-[10px] text-slate-500 dark:text-slate-400">Panel Financiero e Historial</Text>
          </View>
        </View>
        <View className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
          <Text className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">Modo Conductor</Text>
        </View>
      </View>

      {/* 2. Tarjetas de Métricas Consolidadas */}
      <View className="grid grid-cols-2 gap-2">
        <View className="flex-row gap-2">
          <View className="flex-1 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 gap-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] font-bold uppercase text-slate-400">Ganancias Netas</Text>
              <DollarSign size={13} color="#10b981" />
            </View>
            <Text className="text-base font-black text-emerald-600 dark:text-emerald-400">
              ${totalNetEarnings.toLocaleString('es-CO')}
            </Text>
            <Text className="text-[9px] text-slate-400">Tras deducir 12%</Text>
          </View>

          <View className="flex-1 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 gap-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] font-bold uppercase text-slate-400">Pasajeros</Text>
              <Users size={13} color="#0284c7" />
            </View>
            <Text className="text-base font-black text-slate-900 dark:text-white">{totalPassengers}</Text>
            <Text className="text-[9px] text-slate-400">Estudiantes a bordo</Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 gap-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] font-bold uppercase text-slate-400">Calificación</Text>
              <Star size={13} color="#f59e0b" fill="#f59e0b" />
            </View>
            <Text className="text-base font-black text-amber-500">{avgRating.toFixed(1)}</Text>
            <Text className="text-[9px] text-slate-400">Reputación activa</Text>
          </View>

          <View className="flex-1 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 gap-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] font-bold uppercase text-slate-400">CO₂ Evitado</Text>
              <Leaf size={13} color="#10b981" />
            </View>
            <Text className="text-base font-black text-emerald-500">{co2SavedKg} kg</Text>
            <Text className="text-[9px] text-slate-400">Impacto ambiental</Text>
          </View>
        </View>
      </View>

      {/* 3. Selector de Pestañas (Pill Bar) */}
      <View className="flex-row bg-slate-200 dark:bg-slate-900 p-1 rounded-2xl border border-slate-300 dark:border-slate-800">
        <Pressable
          onPress={() => setActiveSection('published')}
          className={`flex-1 py-2 rounded-xl items-center justify-center ${
            activeSection === 'published' ? 'bg-emerald-600' : ''
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeSection === 'published' ? 'text-white font-black' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Publicados ({publishedDriverTrips.filter((t: any) => t.status === 'publicado').length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveSection('recurring')}
          className={`flex-1 py-2 rounded-xl items-center justify-center ${
            activeSection === 'recurring' ? 'bg-emerald-600' : ''
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeSection === 'recurring' ? 'text-white font-black' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Recurrentes ({recurringDriverTrips.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveSection('history')}
          className={`flex-1 py-2 rounded-xl items-center justify-center ${
            activeSection === 'history' ? 'bg-emerald-600' : ''
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeSection === 'history' ? 'text-white font-black' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Historial ({viajesHistorial.length})
          </Text>
        </Pressable>
      </View>

      {/* 4. Contenido según la pestaña activa */}

      {/* SECCIÓN A: VIAJES PUBLICADOS PUNTUALES */}
      {activeSection === 'published' && (
        <View className="gap-3">
          <View className="flex-row items-center justify-between px-1">
            <Text className="text-[11px] font-bold text-slate-500">Rutas activas y próximas salidas</Text>
            <Pressable
              onPress={() => router.replace('/(tabs)')}
              className="flex-row items-center gap-1"
            >
              <Plus size={12} color="#10b981" />
              <Text className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">Publicar Nueva</Text>
            </Pressable>
          </View>

          {publishedDriverTrips.length === 0 ? (
            <View className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 items-center gap-2">
              <Car size={24} color="#10b981" />
              <Text className="text-xs font-black text-slate-900 dark:text-white text-center">
                No tienes viajes publicados pendientes
              </Text>
              <Text className="text-[11px] text-slate-400 text-center">
                Publica una ruta hacia o desde el campus para recibir pasajeros.
              </Text>
              <Pressable
                onPress={() => router.replace('/(tabs)')}
                className="mt-2 px-4 py-2 rounded-xl bg-emerald-600"
              >
                <Text className="text-xs font-bold text-white">Publicar un Trayecto</Text>
              </Pressable>
            </View>
          ) : (
            publishedDriverTrips.map((viaje: any) => {
              const isCancelado = viaje.status === 'cancelado';
              return (
                <View
                  key={viaje.id}
                  className={`rounded-3xl p-4 border gap-3 ${
                    isCancelado
                      ? 'bg-slate-200/50 dark:bg-slate-900/40 border-slate-300 dark:border-slate-800 opacity-60'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1.5">
                      <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <Calendar size={11} color="#10b981" />
                        <Text className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">{viaje.date}</Text>
                      </View>
                      <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-lochmara-500/10 border border-lochmara-500/20">
                        <Clock size={11} color="#0284c7" />
                        <Text className="text-[10px] font-extrabold text-lochmara-600 dark:text-lochmara-400">{viaje.departure_time}</Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        ${Number(viaje.fare_cop || 0).toLocaleString('es-CO')} COP
                      </Text>
                      <Text className="text-[9px] font-bold text-slate-400">{viaje.available_seats} cupos libres</Text>
                    </View>
                  </View>

                  <View className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 gap-1.5">
                    <View className="flex-row items-center gap-2">
                      <View className="w-2 h-2 rounded-full bg-lochmara-500" />
                      <Text className="text-[10px] font-bold text-slate-400">De:</Text>
                      <Text className="text-xs font-bold text-slate-900 dark:text-white flex-1" numberOfLines={1}>{viaje.origin}</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View className="w-2 h-2 rounded-full bg-emerald-500" />
                      <Text className="text-[10px] font-bold text-slate-400">A:</Text>
                      <Text className="text-xs font-bold text-slate-900 dark:text-white flex-1" numberOfLines={1}>{viaje.destination}</Text>
                    </View>
                  </View>

                  {/* Pasajeros Confirmados */}
                  {viaje.passengers && viaje.passengers.length > 0 ? (
                    <View className="gap-1.5">
                      <View className="flex-row items-center gap-1">
                        <Users size={12} color="#10b981" />
                        <Text className="text-[10px] font-extrabold uppercase text-slate-400">
                          Pasajeros Confirmados ({viaje.passengers.length})
                        </Text>
                      </View>
                      {viaje.passengers.map((p: any) => (
                        <View
                          key={p.id}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex-row items-center justify-between"
                        >
                          <View className="flex-1 pr-2">
                            <Text className="text-xs font-black text-slate-900 dark:text-white" numberOfLines={1}>{p.name}</Text>
                            <Text className="text-[10px] text-slate-400" numberOfLines={1}>Recogida: {p.pickup}</Text>
                          </View>
                          <View className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                            <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              {p.isPinVerified ? 'A bordo' : 'Confirmado'}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text className="text-[10px] text-slate-400 italic">Aún no hay pasajeros reservados en este trayecto.</Text>
                  )}

                  {!isCancelado && (
                    <View className="flex-row items-center gap-2 pt-1">
                      <Pressable
                        onPress={() => handleStartTrip(viaje.id)}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 flex-row items-center justify-center gap-1.5"
                      >
                        <Play size={13} color="#ffffff" fill="#ffffff" />
                        <Text className="text-xs font-black text-white">Iniciar en Cabina GPS</Text>
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          Alert.alert('Cancelar ruta', '¿Deseas cancelar esta ruta publicada?', [
                            { text: 'No', style: 'cancel' },
                            { text: 'Sí, cancelar', style: 'destructive', onPress: () => cancelPublishedTrip(viaje.id) },
                          ])
                        }
                        className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20"
                      >
                        <Text className="text-xs font-bold text-rose-600 dark:text-rose-400">Cancelar</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}

      {/* SECCIÓN B: PLANTILLAS DE VIAJES RECURRENTES */}
      {activeSection === 'recurring' && (
        <View className="gap-3">
          <View className="flex-row items-center justify-between px-1">
            <Text className="text-[11px] font-bold text-slate-500">Plantillas automáticas por semana</Text>
            <Pressable
              onPress={() => setModalNuevaRutina(true)}
              className="flex-row items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600"
            >
              <Plus size={11} color="#ffffff" />
              <Text className="text-[10px] font-black text-white">Nueva Rutina</Text>
            </Pressable>
          </View>

          {recurringDriverTrips.length === 0 ? (
            <View className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 items-center gap-2">
              <Calendar size={24} color="#0284c7" />
              <Text className="text-xs font-black text-slate-900 dark:text-white text-center">
                No tienes rutinas semanales creadas
              </Text>
              <Text className="text-[11px] text-slate-400 text-center">
                Configura los días y horas que vas a clases para publicar automáticamente tu cupo.
              </Text>
              <Pressable onPress={() => setModalNuevaRutina(true)} className="mt-2 px-4 py-2 rounded-xl bg-emerald-600">
                <Text className="text-xs font-bold text-white">Crear Primera Rutina</Text>
              </Pressable>
            </View>
          ) : (
            recurringDriverTrips.map((plantilla: any) => (
              <View
                key={plantilla.id}
                className={`rounded-3xl p-4 border gap-3 ${
                  !plantilla.isActive
                    ? 'bg-slate-200/50 dark:bg-slate-900/40 border-slate-300 dark:border-slate-800 opacity-60'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-xs font-black text-slate-900 dark:text-white">{plantilla.title}</Text>
                    <Text className="text-[10px] text-slate-400">Salida fija a las {plantilla.departure_time}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Pressable
                      onPress={() => toggleRecurringDriverTrip(plantilla.id)}
                      className={`flex-row items-center gap-1 px-2.5 py-1 rounded-xl border ${
                        plantilla.isActive
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-slate-500/10 border-slate-500/20'
                      }`}
                    >
                      <Power size={11} color={plantilla.isActive ? '#10b981' : '#94a3b8'} />
                      <Text
                        className={`text-[10px] font-bold ${
                          plantilla.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        {plantilla.isActive ? 'Activa' : 'Pausada'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        Alert.alert('Eliminar rutina', '¿Deseas eliminar esta plantilla?', [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Eliminar', style: 'destructive', onPress: () => deleteRecurringDriverTrip(plantilla.id) },
                        ])
                      }
                      className="p-1"
                    >
                      <Trash2 size={14} color="#f43f5e" />
                    </Pressable>
                  </View>
                </View>

                {/* Días */}
                <View className="flex-row items-center gap-1.5">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia) => {
                    const isDiaActivo = plantilla.days?.includes(dia);
                    return (
                      <View
                        key={dia}
                        className={`w-7 h-6 rounded-lg items-center justify-center ${
                          isDiaActivo
                            ? 'bg-lochmara-600'
                            : 'bg-slate-200 dark:bg-slate-950 border border-slate-300 dark:border-slate-800'
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-black ${
                            isDiaActivo ? 'text-white' : 'text-slate-400'
                          }`}
                        >
                          {dia}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Ruta */}
                <View className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 gap-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[10px] font-bold text-slate-400">Ruta:</Text>
                    <Text className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      ${Number(plantilla.fare_cop || 0).toLocaleString('es-CO')} • {plantilla.seats} cupos
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex-1" numberOfLines={1}>
                      {plantilla.origin}
                    </Text>
                    <ArrowRight size={11} color="#94a3b8" />
                    <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex-1" numberOfLines={1}>
                      {plantilla.destination}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* SECCIÓN C: HISTORIAL DE VIAJES COMPLETADOS */}
      {activeSection === 'history' && (
        <View className="gap-3">
          <View className="flex-row items-center justify-between px-1">
            <Text className="text-[11px] font-bold text-slate-500">Carreras finalizadas y arqueos</Text>
            {/* Filtros de período */}
            <View className="flex-row items-center gap-1 bg-slate-200 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-300 dark:border-slate-800">
              {(['todos', 'semana', 'mes'] as PeriodFilter[]).map((f) => (
                <Pressable
                  key={f}
                  onPress={() => setPeriodFilter(f)}
                  className={`px-2 py-0.5 rounded-lg ${periodFilter === f ? 'bg-emerald-600' : ''}`}
                >
                  <Text
                    className={`text-[9px] font-bold uppercase ${
                      periodFilter === f ? 'text-white font-black' : 'text-slate-500'
                    }`}
                  >
                    {f === 'todos' ? 'Todos' : f === 'semana' ? 'Semana' : 'Mes'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {isLoading ? (
            <Text className="text-center text-xs text-slate-400 py-6">Cargando historial...</Text>
          ) : filteredHistorial.length === 0 ? (
            <View className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 items-center gap-2">
              <CheckCircle2 size={24} color="#10b981" />
              <Text className="text-xs font-black text-slate-900 dark:text-white text-center">
                Sin viajes completados en este período
              </Text>
              <Text className="text-[11px] text-slate-400 text-center">
                Tus trayectos finalizados y ganancias se listarán en esta sección.
              </Text>
            </View>
          ) : (
            filteredHistorial.map((viaje) => {
              const isExpanded = viajeExpandido === viaje.id;
              const comisionCop = Math.round(viaje.totalEarned * 0.12);

              return (
                <View
                  key={viaje.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                  <Pressable
                    onPress={() => setViajeExpandido(isExpanded ? null : viaje.id)}
                    className="p-4 flex-row items-center justify-between"
                  >
                    <View className="gap-1 flex-1 pr-2">
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-[11px] font-bold text-slate-900 dark:text-white">{viaje.date}</Text>
                        <View className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                          <Text className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">Completado</Text>
                        </View>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Text className="text-xs font-bold text-slate-700 dark:text-slate-300" numberOfLines={1}>
                          {viaje.origin?.split('-')[0] || viaje.origin}
                        </Text>
                        <ArrowRight size={11} color="#94a3b8" />
                        <Text className="text-xs font-bold text-slate-700 dark:text-slate-300" numberOfLines={1}>
                          {viaje.destination}
                        </Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <Text className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        +${viaje.driverEarnings.toLocaleString('es-CO')}
                      </Text>
                      <Text className="text-[10px] text-slate-400">{viaje.passenger?.name || 'Pasajero'}</Text>
                    </View>
                  </Pressable>

                  {/* Detalle Desplegable */}
                  {isExpanded && (
                    <View className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800 gap-3">
                      <View className="flex-row p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                        <View className="flex-1 items-center">
                          <Text className="text-[9px] font-bold text-slate-400">Total Cobrado</Text>
                          <Text className="text-xs font-extrabold text-slate-900 dark:text-white">
                            ${viaje.totalEarned.toLocaleString('es-CO')}
                          </Text>
                        </View>
                        <View className="flex-1 items-center">
                          <Text className="text-[9px] font-bold text-slate-400">Comisión (12%)</Text>
                          <Text className="text-xs font-extrabold text-rose-500">
                            -${comisionCop.toLocaleString('es-CO')}
                          </Text>
                        </View>
                        <View className="flex-1 items-center">
                          <Text className="text-[9px] font-bold text-slate-400">Ganancia Neta</Text>
                          <Text className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                            +${viaje.driverEarnings.toLocaleString('es-CO')}
                          </Text>
                        </View>
                      </View>

                      {/* Pasajero Transportado */}
                      {viaje.passenger && (
                        <View className="flex-row items-center justify-between pt-1">
                          <View className="flex-1 pr-2">
                            <Text className="text-xs font-bold text-slate-900 dark:text-white">{viaje.passenger.name}</Text>
                            <Text className="text-[10px] text-slate-400" numberOfLines={1}>{viaje.passenger.pickup}</Text>
                          </View>

                          {viaje.passenger.rated ? (
                            <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30">
                              <Star size={12} color="#f59e0b" fill="#f59e0b" />
                              <Text className="text-[11px] font-bold text-amber-500">
                                {(viaje.passenger.ratingScore || 5).toFixed(1)}
                              </Text>
                            </View>
                          ) : (
                            <Pressable
                              onPress={() => setModalCalificacion({ pasajero: viaje.passenger, tripId: viaje.id })}
                              className="flex-row items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500"
                            >
                              <Star size={12} color="#ffffff" fill="#ffffff" />
                              <Text className="text-[11px] font-bold text-white">Calificar</Text>
                            </Pressable>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}

      {/* Modal para Crear Nueva Rutina Recurrente */}
      <Modal visible={modalNuevaRutina} transparent animationType="fade" onRequestClose={() => setModalNuevaRutina(false)}>
        <Pressable className="flex-1 bg-black/75 items-center justify-center p-4" onPress={() => setModalNuevaRutina(false)}>
          <Pressable
            className="w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 gap-3.5"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <View className="flex-row items-center gap-2">
                <Calendar size={16} color="#10b981" />
                <Text className="text-sm font-black text-slate-900 dark:text-white">Nueva Rutina Semanal</Text>
              </View>
              <Pressable onPress={() => setModalNuevaRutina(false)} className="p-1">
                <X size={16} color="#94a3b8" />
              </Pressable>
            </View>

            <View className="gap-1">
              <Text className="text-[10px] font-bold text-slate-400 uppercase">Nombre de la Rutina:</Text>
              <TextInput
                value={nuevoTitulo}
                onChangeText={setNuevoTitulo}
                placeholder="Ej: Clases 7:00 AM El Jardín"
                placeholderTextColor="#94a3b8"
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </View>

            <View className="gap-1">
              <Text className="text-[10px] font-bold text-slate-400 uppercase">Origen de Partida:</Text>
              <TextInput
                value={nuevoOrigen}
                onChangeText={setNuevoOrigen}
                placeholder="Ej: Cañaveral - C.C. Parque Caracolí"
                placeholderTextColor="#94a3b8"
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </View>

            <View className="gap-1">
              <Text className="text-[10px] font-bold text-slate-400 uppercase">Destino / Campus:</Text>
              <TextInput
                value={nuevoDestino}
                onChangeText={setNuevoDestino}
                placeholder="Ej: Campus El Jardín"
                placeholderTextColor="#94a3b8"
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </View>

            <View className="gap-1">
              <Text className="text-[10px] font-bold text-slate-400 uppercase">Días de Salida:</Text>
              <View className="flex-row gap-1">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia) => {
                  const sel = nuevosDias.includes(dia);
                  return (
                    <Pressable
                      key={dia}
                      onPress={() => toggleDiaSeleccionado(dia)}
                      className={`flex-1 py-1.5 rounded-lg items-center justify-center ${
                        sel ? 'bg-emerald-600' : 'bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <Text className={`text-[10px] font-black ${sel ? 'text-white' : 'text-slate-400'}`}>{dia}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1 gap-1">
                <Text className="text-[10px] font-bold text-slate-400 uppercase">Hora Salida:</Text>
                <TextInput
                  value={nuevaHora}
                  onChangeText={setNuevaHora}
                  placeholder="06:30"
                  placeholderTextColor="#94a3b8"
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                />
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-[10px] font-bold text-slate-400 uppercase">Cupos Libres:</Text>
                <View className="flex-row gap-1">
                  {[1, 2, 3, 4].map((num) => (
                    <Pressable
                      key={num}
                      onPress={() => setNuevosCupos(num)}
                      className={`flex-1 py-2 rounded-xl items-center justify-center ${
                        nuevosCupos === num
                          ? 'bg-emerald-600'
                          : 'bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <Text
                        className={`text-xs font-black ${nuevosCupos === num ? 'text-white' : 'text-slate-500'}`}
                      >
                        {num}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            <View className="gap-1">
              <Text className="text-[10px] font-bold text-slate-400 uppercase">Tarifa por Cupo:</Text>
              <View className="flex-row gap-1">
                {['3500', '4000', '4500', '5000'].map((tarifa) => (
                  <Pressable
                    key={tarifa}
                    onPress={() => setNuevaTarifa(tarifa)}
                    className={`flex-1 py-2 rounded-xl items-center justify-center ${
                      nuevaTarifa === tarifa
                        ? 'bg-emerald-600'
                        : 'bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold ${
                        nuevaTarifa === tarifa ? 'text-white font-black' : 'text-slate-500'
                      }`}
                    >
                      ${Number(tarifa).toLocaleString('es-CO')}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              onPress={handleCrearRutina}
              className="py-3 rounded-2xl bg-emerald-600 items-center justify-center mt-1"
            >
              <Text className="text-xs font-black text-white">Guardar Rutina Recurrente</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal de Calificación a Pasajero */}
      {modalCalificacion && (
        <RatingFeedbackModal
          isOpen={Boolean(modalCalificacion)}
          onClose={() => setModalCalificacion(null)}
          targetType="passenger"
          targetName={modalCalificacion.pasajero?.name || 'Estudiante'}
          onSubmitRating={guardarCalificacion}
        />
      )}
    </ScrollView>
  );
}
