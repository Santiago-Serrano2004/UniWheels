import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Bell, Car, CheckCheck, Clock, Send, ShieldAlert, ShieldCheck, Sparkles, UserCheck, X } from 'lucide-react-native';
import { notificationsService, useAppStore } from '@uniwheels/shared';
import { Emblem } from './Emblem';
import { SosEmergencyModal } from './SosEmergencyModal';

/**
 * Header persistente equivalente a frontend/src/components/common/Header.jsx
 * — logo, pill de rol, notificaciones y acceso a perfil, visible arriba en
 * todas las pantallas (igual que en la web, donde envuelve TODO el contenido
 * excepto la splash y el login).
 *
 * Simplificado para el alcance de pasajero de esta fase: el botón de rol no
 * cambia a modo conductor todavía (Fase 2) — solo invita a registrarse. El
 * botón SOS de la web solo aparece con viaje activo, que tampoco existe aún
 * en esta fase (se agrega junto con la reserva real de viajes).
 */
// Mismo relleno inicial que NotificationCenterModal.jsx — se reemplaza por
// datos reales del backend en cuanto responden (si trae algo); si el
// endpoint no devuelve nada, esto es lo que se ve en vez de una bandeja vacía.
const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: '¡Tu conductor inició el recorrido!',
    body: 'Tu conductor viene en camino. Tiempo estimado: 6 minutos.',
    type: 'conductor_en_camino',
    is_read: false,
    created_at: new Date(Date.now() - 3 * 60000).toISOString(),
  },
  {
    id: 'notif-2',
    title: 'PIN de Abordaje Seguro emitido',
    body: 'Tu código de verificación es 4829. Díctaselo al conductor al momento de subirte al vehículo.',
    type: 'abordaje_verificado',
    is_read: false,
    created_at: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    id: 'notif-3',
    title: 'Recarga de Billetera Exitosa',
    body: 'Se acreditaron $ 25.000 COP a tu billetera UniWheels vía Nequi.',
    type: 'billetera',
    is_read: true,
    created_at: new Date(Date.now() - 120 * 60000).toISOString(),
  },
];

export function AppHeader() {
  const user = useAppStore((state) => state.user);
  const activeRole = useAppStore((state) => state.activeRole);
  const toggleRole = useAppStore((state) => state.toggleRole);
  const openDriverInviteModal = useAppStore((state) => state.openDriverInviteModal);
  const activeDriverTrip = useAppStore((state) => state.activeDriverTrip);
  const activePassengerBooking = useAppStore((state) => state.activePassengerBooking);
  const isDriverVerified = Boolean(user?.isDriver);

  const [notifOpen, setNotifOpen] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>(MOCK_NOTIFICATIONS);
  const [unreadCount, setUnreadCount] = useState(2);

  const hasActiveTrip = Boolean(activeDriverTrip || activePassengerBooking);

  const handleRolePress = () => {
    if (isDriverVerified) {
      toggleRole();
      router.replace('/(tabs)');
    } else {
      openDriverInviteModal();
    }
  };

  useEffect(() => {
    notificationsService.getUserNotifications().then((res: any) => {
      if (res?.data?.length > 0) {
        setNotifications(res.data);
        setUnreadCount(res.unread_count || 0);
      }
    });
  }, []);

  const openNotifications = () => setNotifOpen(true);

  const marcarComoLeida = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await notificationsService.markAsRead(id);
  };

  const marcarTodasLeidas = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await notificationsService.markAllAsRead();
  };

  const simularNotificacionEnVivo = () => {
    // Igual que en la web: solo una actualización visual local — el
    // despacho real (/notifications/send) es servicio-a-servicio, no
    // invocable desde el cliente.
    const nueva = {
      id: `notif-${Date.now()}`,
      title: '¡Tu conductor está a 200 metros!',
      body: 'Tu conductor ha ingresado a la vía principal. Ten listo tu PIN para abordar.',
      type: 'conductor_en_camino',
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [nueva, ...prev]);
    setUnreadCount((prev) => prev + 1);
  };

  const iconForType = (type: string) => {
    if (type === 'conductor_en_camino') return Car;
    if (type === 'abordaje_verificado') return ShieldCheck;
    return Sparkles;
  };

  return (
    <View className="bg-white/95 dark:bg-slate-950/95 border-b border-slate-100 dark:border-slate-800/80 px-4 pt-3 pb-2.5 flex-row items-center justify-between">
      <Pressable onPress={() => router.replace('/(tabs)')} className="flex-row items-center gap-2">
        <Emblem size={26} />
        <Text className="font-extrabold text-sm text-slate-900 dark:text-white">UniWheels</Text>
      </Pressable>

      <View className="flex-row items-center gap-1.5">
        {/* Botón de Pánico SOS si hay viaje activo */}
        {hasActiveTrip && (
          <Pressable
            onPress={() => setSosModalOpen(true)}
            className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-full bg-rose-600 active:bg-rose-700 shadow-sm shadow-rose-950/40"
          >
            <ShieldAlert size={14} color="#ffffff" />
            <Text className="text-white text-[11px] font-black tracking-wide">SOS</Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleRolePress}
          className={`flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-full ${
            isDriverVerified && activeRole === 'driver'
              ? 'bg-emerald-600 dark:bg-emerald-700'
              : 'bg-slate-900 dark:bg-slate-800'
          }`}
        >
          {isDriverVerified && activeRole === 'driver' ? (
            <>
              <Car size={13} color="#a7f3d0" />
              <Text className="text-[11px] font-bold text-white">Conductor</Text>
            </>
          ) : (
            <>
              <UserCheck size={13} color="#7dd3fc" />
              <Text className="text-[11px] font-bold text-white">Pasajero</Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={openNotifications}
          className="p-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        >
          <Bell size={14} color="#475569" />
          {unreadCount > 0 && (
            <View className="absolute top-1 right-1 w-2 h-2 bg-lochmara-500 rounded-full border border-white dark:border-slate-950" />
          )}
        </Pressable>

        <Pressable
          onPress={() => router.push('/(tabs)/profile')}
          className="w-7 h-7 rounded-full bg-lochmara-100 dark:bg-lochmara-500/20 border border-lochmara-300 dark:border-lochmara-500/40 items-center justify-center"
        >
          <Text className="text-[10px] font-bold text-lochmara-800 dark:text-lochmara-300">
            {user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'UN'}
          </Text>
        </Pressable>
      </View>

      <Modal visible={notifOpen} transparent animationType="fade" onRequestClose={() => setNotifOpen(false)}>
        <Pressable className="flex-1 bg-black/70 items-center justify-center p-4" onPress={() => setNotifOpen(false)}>
          <Pressable
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800"
            style={{ maxHeight: '82%' }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <View className="flex-row items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <View className="flex-row items-center gap-2">
                <View className="p-1.5 rounded-xl bg-lochmara-50 dark:bg-slate-800 border border-lochmara-100 dark:border-slate-700">
                  <Bell size={16} color="#0284c7" />
                </View>
                <View>
                  <Text className="text-xs font-bold text-slate-900 dark:text-white">Notificaciones</Text>
                  <Text className="text-[10px] text-slate-500 dark:text-slate-400">
                    {unreadCount > 0 ? `${unreadCount} no leídas` : 'Bandeja al día'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-1.5">
                {unreadCount > 0 && (
                  <Pressable
                    onPress={marcarTodasLeidas}
                    className="flex-row items-center gap-0.5 px-2 py-0.5 rounded-md"
                  >
                    <CheckCheck size={12} color="#0284c7" />
                    <Text className="text-[10px] font-bold text-lochmara-600 dark:text-lochmara-400">Leídas</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => setNotifOpen(false)} hitSlop={8} className="p-1">
                  <X size={16} color="#94a3b8" />
                </Pressable>
              </View>
            </View>

            {/* Listado */}
            <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ paddingVertical: 8, gap: 8 }}>
              {notifications.length === 0 ? (
                <View className="items-center py-12 gap-2">
                  <Bell size={26} color="#94a3b8" />
                  <Text className="text-xs font-medium text-slate-400">No tienes notificaciones</Text>
                </View>
              ) : (
                notifications.map((n) => {
                  const Icon = iconForType(n.type);
                  return (
                    <Pressable
                      key={n.id}
                      onPress={() => !n.is_read && marcarComoLeida(n.id)}
                      className={`p-2.5 rounded-2xl border flex-row items-start gap-2 ${
                        n.is_read
                          ? 'bg-slate-50/60 dark:bg-slate-950/60 border-slate-200/60 dark:border-slate-800/80 opacity-70'
                          : 'bg-lochmara-50/40 dark:bg-slate-950 border-lochmara-200 dark:border-lochmara-900/60'
                      }`}
                    >
                      <View
                        className={`p-1.5 rounded-xl shrink-0 ${
                          n.is_read ? 'bg-slate-200 dark:bg-slate-800' : 'bg-lochmara-600'
                        }`}
                      >
                        <Icon size={12} color={n.is_read ? '#64748b' : '#ffffff'} />
                      </View>
                      <View className="flex-1 gap-0.5">
                        <View className="flex-row items-center justify-between gap-1">
                          <Text
                            className={`text-[11px] flex-1 ${
                              n.is_read ? 'font-semibold text-slate-700 dark:text-slate-300' : 'font-bold text-slate-900 dark:text-white'
                            }`}
                            numberOfLines={1}
                          >
                            {n.title || n.message}
                          </Text>
                          {!n.is_read && <View className="w-1.5 h-1.5 rounded-full bg-lochmara-500" />}
                        </View>
                        {n.body ? (
                          <Text className="text-[10px] leading-snug text-slate-600 dark:text-slate-400">{n.body}</Text>
                        ) : null}
                        {n.created_at ? (
                          <View className="flex-row items-center gap-1 pt-0.5">
                            <Clock size={9} color="#94a3b8" />
                            <Text className="text-[9px] text-slate-400">
                              {new Date(n.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>

            {/* Botón inferior fijo */}
            <View className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <Pressable
                onPress={simularNotificacionEnVivo}
                className="py-2 rounded-2xl bg-lochmara-600 flex-row items-center justify-center gap-1.5"
              >
                <Send size={12} color="#ffffff" />
                <Text className="text-white text-[11px] font-bold">Simular Alerta en Vivo</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal de Emergencia SOS */}
      <SosEmergencyModal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        tripInfo={{
          id: activePassengerBooking?.id || activeDriverTrip?.id,
          driverName:
            activePassengerBooking?.driverName ||
            activeDriverTrip?.driverName ||
            (activeRole === 'driver' ? user?.name : 'Carlos Mendoza') ||
            'Conductor Asignado',
          plate: activePassengerBooking?.plate || activeDriverTrip?.plate || 'KLU-492',
          vehicle: activePassengerBooking?.vehicle || activeDriverTrip?.vehicle || 'Vehículo en servicio',
        }}
      />
    </View>
  );
}
