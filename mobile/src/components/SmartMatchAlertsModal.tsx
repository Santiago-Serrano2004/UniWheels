import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Bell,
  Building2,
  Calendar,
  Clock,
  Navigation,
  Plus,
  Power,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react-native';
import { useAppStore } from '@uniwheels/shared';

export interface SmartMatchAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const CAMPUSES_LIST = [
  'Campus El Jardín',
  'Campus El Bosque',
  'CSU — Centro de Servicios Universitarios',
  'Campus La Casona',
];

export function SmartMatchAlertsModal({ isOpen, onClose }: SmartMatchAlertsModalProps) {
  const recurringPassengerAlerts = useAppStore((state) => state.recurringPassengerAlerts);
  const addPassengerAlert = useAppStore((state) => state.addPassengerAlert);
  const togglePassengerAlert = useAppStore((state) => state.togglePassengerAlert);
  const deletePassengerAlert = useAppStore((state) => state.deletePassengerAlert);
  const savedHomeLocation = useAppStore((state) => state.savedHomeLocation);

  const [showAddForm, setShowAddForm] = useState(false);
  const [titulo, setTitulo] = useState('Clases 7:00 AM El Jardín');
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>(['Lun', 'Mar', 'Mié', 'Jue', 'Vie']);
  const [direction, setDirection] = useState<'towards' | 'from' | 'inter_campus'>('towards');
  const [selectedCampus, setSelectedCampus] = useState('Campus El Jardín');
  const [horaLlegada, setHoraLlegada] = useState('06:55 AM');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [puntoEditable, setPuntoEditable] = useState(savedHomeLocation?.address || 'Cañaveral - Provenza');
  const [toleranciaMin, setToleranciaMin] = useState(15);
  const [tarifaMax, setTarifaMax] = useState('5000');

  const toggleDia = (dia: string) => {
    if (diasSeleccionados.includes(dia)) {
      if (diasSeleccionados.length > 1) {
        setDiasSeleccionados(diasSeleccionados.filter((d) => d !== dia));
      }
    } else {
      setDiasSeleccionados([...diasSeleccionados, dia]);
    }
  };

  const handleCrearAlerta = () => {
    let origin = '';
    let destination = '';

    if (direction === 'towards') {
      origin = puntoEditable || 'Punto acordado';
      destination = selectedCampus;
    } else if (direction === 'from') {
      origin = selectedCampus;
      destination = puntoEditable || 'Punto de destino';
    } else {
      origin = selectedCampus;
      destination = 'Campus El Bosque';
    }

    addPassengerAlert({
      title: titulo.trim() || `Rutina hacia ${selectedCampus}`,
      days: diasSeleccionados,
      direction,
      target_time: horaLlegada,
      origin,
      destination,
      tolerance_minutes: toleranciaMin,
      max_fare_cop: Number(tarifaMax) || 5000,
    });

    setShowAddForm(false);
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/80 items-center justify-center p-4" onPress={onClose}>
        <Pressable
          className="w-full max-w-[370px] bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 gap-3.5 shadow-2xl"
          style={{ maxHeight: '90%' }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Cabecera */}
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <View className="flex-row items-center gap-2.5">
              <View className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 items-center justify-center">
                <Sparkles size={18} color="#f59e0b" />
              </View>
              <View>
                <Text className="text-sm font-black text-slate-900 dark:text-white">Smart Match Alerts</Text>
                <Text className="text-[10px] text-slate-400">Rutinas y Horarios Recurrentes</Text>
              </View>
            </View>

            <Pressable onPress={onClose} hitSlop={8} className="w-8 h-8 rounded-full items-center justify-center">
              <X size={16} color="#94a3b8" />
            </Pressable>
          </View>

          <ScrollView style={{ maxHeight: 440 }} contentContainerStyle={{ gap: 12 }}>
            {!showAddForm ? (
              <>
                {/* Botón para abrir formulario de creación */}
                <Pressable
                  onPress={() => setShowAddForm(true)}
                  className="w-full py-3 rounded-2xl bg-lochmara-600 active:bg-lochmara-700 flex-row items-center justify-center gap-2 shadow-md shadow-lochmara-600/20"
                >
                  <Plus size={16} color="#ffffff" />
                  <Text className="text-xs font-black text-white">Nueva Rutina Semanal</Text>
                </Pressable>

                {/* Lista de rutinas configuradas */}
                <View className="gap-2">
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                    Tus Rutinas Activas ({recurringPassengerAlerts.length})
                  </Text>

                  {recurringPassengerAlerts.length === 0 ? (
                    <View className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 items-center gap-2">
                      <Bell size={22} color="#94a3b8" />
                      <Text className="text-xs font-black text-slate-900 dark:text-white text-center">
                        Sin rutinas guardadas
                      </Text>
                      <Text className="text-[11px] text-slate-400 text-center">
                        Guarda tus horarios de clase para recibir sugerencias inteligentes de conductores afines.
                      </Text>
                    </View>
                  ) : (
                    recurringPassengerAlerts.map((alert: any) => (
                      <View
                        key={alert.id}
                        className={`p-3.5 rounded-2xl border ${
                          alert.isActive
                            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                            : 'bg-slate-50/60 dark:bg-slate-950/60 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                        } gap-2.5`}
                      >
                        <View className="flex-row items-start justify-between">
                          <View className="flex-1 mr-2">
                            <Text className="text-xs font-black text-slate-900 dark:text-white" numberOfLines={1}>
                              {alert.title}
                            </Text>
                            <View className="flex-row items-center gap-1.5 mt-0.5">
                              <Calendar size={11} color="#0284c7" />
                              <Text className="text-[10px] font-bold text-lochmara-600 dark:text-lochmara-400">
                                {alert.days?.join(', ') || 'Lun-Vie'}
                              </Text>
                              <Text className="text-[10px] text-slate-300 dark:text-slate-700">•</Text>
                              <Clock size={11} color="#f59e0b" />
                              <Text className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                                {alert.target_time || '07:00 AM'}
                              </Text>
                            </View>
                          </View>

                          <View className="flex-row items-center gap-1.5">
                            <Pressable
                              onPress={() => togglePassengerAlert(alert.id)}
                              className={`px-2.5 py-1 rounded-xl flex-row items-center gap-1 border ${
                                alert.isActive
                                  ? 'bg-emerald-500/10 border-emerald-500/30'
                                  : 'bg-slate-500/10 border-slate-500/20'
                              }`}
                            >
                              <Power size={11} color={alert.isActive ? '#10b981' : '#94a3b8'} />
                              <Text
                                className={`text-[9px] font-black ${
                                  alert.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                                }`}
                              >
                                {alert.isActive ? 'Activa' : 'Pausada'}
                              </Text>
                            </Pressable>

                            <Pressable
                              onPress={() => deletePassengerAlert(alert.id)}
                              className="p-1.5 rounded-lg active:bg-rose-100 dark:active:bg-rose-950"
                            >
                              <Trash2 size={14} color="#ef4444" />
                            </Pressable>
                          </View>
                        </View>

                        <View className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 gap-1">
                          <View className="flex-row items-center gap-1.5">
                            <Navigation size={10} color="#0284c7" />
                            <Text className="text-[10px] text-slate-600 dark:text-slate-400 flex-1 truncate" numberOfLines={1}>
                              {alert.origin} → {alert.destination}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </>
            ) : (
              /* Formulario de Creación de Rutina */
              <View className="gap-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-black text-slate-900 dark:text-white">Nueva Rutina Universitaria</Text>
                  <Pressable onPress={() => setShowAddForm(false)}>
                    <Text className="text-[11px] font-bold text-lochmara-600 dark:text-lochmara-400">Cancelar</Text>
                  </Pressable>
                </View>

                {/* Título */}
                <View className="gap-1">
                  <Text className="text-[10px] font-extrabold uppercase text-slate-400">Título / Asignatura</Text>
                  <TextInput
                    value={titulo}
                    onChangeText={setTitulo}
                    placeholder="Ej. Clases 7:00 AM El Jardín"
                    placeholderTextColor="#94a3b8"
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </View>

                {/* Días de la semana */}
                <View className="gap-1.5">
                  <Text className="text-[10px] font-extrabold uppercase text-slate-400">Días de Clase</Text>
                  <View className="flex-row items-center justify-between gap-1">
                    {DIAS_SEMANA.map((dia) => {
                      const isSelected = diasSeleccionados.includes(dia);
                      return (
                        <Pressable
                          key={dia}
                          onPress={() => toggleDia(dia)}
                          className={`flex-1 py-2 rounded-xl items-center border ${
                            isSelected
                              ? 'bg-lochmara-600 border-lochmara-600'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <Text
                            className={`text-[10px] font-black ${
                              isSelected ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {dia}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Sentido */}
                <View className="gap-1.5">
                  <Text className="text-[10px] font-extrabold uppercase text-slate-400">Modalidad de Viaje</Text>
                  <View className="flex-row items-center gap-1.5">
                    {[
                      { key: 'towards', label: 'Hacia Campus' },
                      { key: 'from', label: 'Desde Campus' },
                      { key: 'inter_campus', label: 'Entre Sedes' },
                    ].map((opt) => (
                      <Pressable
                        key={opt.key}
                        onPress={() => setDirection(opt.key as any)}
                        className={`flex-1 py-2 rounded-xl items-center border ${
                          direction === opt.key
                            ? 'bg-lochmara-600 border-lochmara-600'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <Text
                          className={`text-[9px] font-black ${
                            direction === opt.key ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Sede Universitaria */}
                <View className="gap-1">
                  <Text className="text-[10px] font-extrabold uppercase text-slate-400">Campus Universitario</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {CAMPUSES_LIST.map((campus) => (
                      <Pressable
                        key={campus}
                        onPress={() => setSelectedCampus(campus)}
                        className={`px-3 py-1.5 rounded-xl border flex-row items-center gap-1.5 ${
                          selectedCampus === campus
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <Building2 size={12} color={selectedCampus === campus ? '#10b981' : '#94a3b8'} />
                        <Text
                          className={`text-[10px] font-black ${
                            selectedCampus === campus
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {campus}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>

                {/* Hora de llegada */}
                <View className="gap-1">
                  <Text className="text-[10px] font-extrabold uppercase text-slate-400">Hora de Llegada al Campus</Text>
                  <Pressable
                    onPress={() => setShowTimePicker(true)}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-2">
                      <Clock size={14} color="#f59e0b" />
                      <Text className="text-xs font-black text-slate-900 dark:text-white">{horaLlegada}</Text>
                    </View>
                    <Text className="text-[10px] font-bold text-lochmara-600 dark:text-lochmara-400">Modificar</Text>
                  </Pressable>
                </View>

                {showTimePicker && (
                  <DateTimePicker
                    value={new Date()}
                    mode="time"
                    is24Hour={false}
                    onChange={(_e, date) => {
                      setShowTimePicker(false);
                      if (date) {
                        const str = date.toLocaleTimeString('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        });
                        setHoraLlegada(str);
                      }
                    }}
                  />
                )}

                {/* Tolerancia en minutos */}
                <View className="gap-1.5">
                  <Text className="text-[10px] font-extrabold uppercase text-slate-400">Tolerancia de Horario</Text>
                  <View className="flex-row items-center gap-2">
                    {[15, 30, 45].map((mins) => (
                      <Pressable
                        key={mins}
                        onPress={() => setToleranciaMin(mins)}
                        className={`flex-1 py-1.5 rounded-xl items-center border ${
                          toleranciaMin === mins
                            ? 'bg-amber-500/15 border-amber-500/40'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-black ${
                            toleranciaMin === mins
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          ± {mins} min
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Punto de Origen / Recogida */}
                {direction !== 'from' && (
                  <View className="gap-1">
                    <Text className="text-[10px] font-extrabold uppercase text-slate-400">Punto de Recogida habitual</Text>
                    <TextInput
                      value={puntoEditable}
                      onChangeText={setPuntoEditable}
                      placeholder="Ej. Cañaveral, Floridablanca o Provenza"
                      placeholderTextColor="#94a3b8"
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </View>
                )}

                {/* Tarifa Máxima COP */}
                <View className="gap-1">
                  <Text className="text-[10px] font-extrabold uppercase text-slate-400">Aporte Máximo Deseado (COP)</Text>
                  <TextInput
                    value={tarifaMax}
                    onChangeText={setTarifaMax}
                    keyboardType="numeric"
                    placeholder="5000"
                    placeholderTextColor="#94a3b8"
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </View>

                {/* Botón Guardar Rutina */}
                <Pressable
                  onPress={handleCrearAlerta}
                  className="w-full py-3 rounded-2xl bg-emerald-600 active:bg-emerald-700 items-center justify-center shadow-md shadow-emerald-600/20 mt-1"
                >
                  <Text className="text-xs font-black text-white">Guardar Rutina Semanal</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
