import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationsService } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import {
  Bell,
  CheckCheck,
  Car,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  Send,
} from 'lucide-react';

export const NotificationCenterModal = ({ isOpen, onClose }) => {
  const { user } = useAppStore();
  const userId = user?.id || '01a00000-0000-0000-0000-000000000001';

  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: '¡Carlos Mendoza inició el recorrido!',
      body: 'Tu conductor viene en camino hacia Parque San Pío en su Mazda 3 (KLU-492). Tiempo estimado: 6 minutos.',
      type: 'conductor_en_camino',
      is_read: false,
      created_at: new Date(Date.now() - 3 * 60000).toISOString(),
    },
    {
      id: 'notif-2',
      title: 'PIN de Abordaje Seguro emitido',
      body: 'Tu código de verificación es 4829. Dictaselo a Carlos al momento de subirte al vehículo.',
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
  ]);

  const [unreadCount, setUnreadCount] = useState(2);

  // Cargar notificaciones desde el backend (puerto 8005)
  useEffect(() => {
    if (isOpen) {
      notificationsService.getUserNotifications(userId).then((res) => {
        if (res?.data && res.data.length > 0) {
          setNotifications(res.data);
          setUnreadCount(res.unread_count || 0);
        }
      });
    }
  }, [isOpen, userId]);

  const marcarComoLeida = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await notificationsService.markAsRead(id);
  };

  const marcarTodasLeidas = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await notificationsService.markAllAsRead(userId);
  };

  const simularNotificacionEnVivo = async () => {
    const nueva = {
      id: `notif-${Date.now()}`,
      title: '¡Tu conductor está a 200 metros!',
      body: 'Carlos Mendoza ha ingresado a la Carrera 33. Ten listo tu PIN 4829 para abordar.',
      type: 'conductor_en_camino',
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setNotifications((prev) => [nueva, ...prev]);
    setUnreadCount((prev) => prev + 1);

    await notificationsService.sendNotification({
      user_id: userId,
      title: nueva.title,
      body: nueva.body,
      type: nueva.type,
      payload_json: { distance_m: 200 },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="bg-white rounded-3xl p-5 w-full max-w-md border border-slate-200 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
      >
        {/* Cabecera del Centro de Notificaciones */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-lochmara-50 text-lochmara-600 border border-lochmara-100">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Notificaciones</h3>
              <p className="text-[11px] text-slate-500">
                {unreadCount > 0 ? `${unreadCount} no leídas` : 'Bandeja al día'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={marcarTodasLeidas}
                className="text-[11px] text-lochmara-600 hover:text-lochmara-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Marcar todas como leídas"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Leídas</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Listado de Notificaciones Desplazable */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <Bell className="w-8 h-8 mx-auto opacity-40 stroke-1" />
              <p className="text-xs">No tienes notificaciones por el momento</p>
            </div>
          ) : (
            notifications.map((notif) => {
              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.is_read && marcarComoLeida(notif.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    notif.is_read
                      ? 'bg-slate-50/70 border-slate-200/70 opacity-75'
                      : 'bg-lochmara-50/40 border-lochmara-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      notif.is_read ? 'bg-slate-200 text-slate-600' : 'bg-lochmara-600 text-white shadow-xs'
                    }`}>
                      {notif.type === 'conductor_en_camino' ? (
                        <Car className="w-3.5 h-3.5" />
                      ) : notif.type === 'abordaje_verificado' ? (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-bold ${notif.is_read ? 'text-slate-700' : 'text-slate-900 font-extrabold'}`}>
                          {notif.title}
                        </h4>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-lochmara-600 shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {notif.body}
                      </p>

                      <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(notif.created_at).toLocaleTimeString('es-CO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Botón de Prueba para Disparar Notificación Asíncrona */}
        <div className="pt-2 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={simularNotificacionEnVivo}
            className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5 text-lochmara-300" />
            <span>Simular Alerta de Conductor en Vivo</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
