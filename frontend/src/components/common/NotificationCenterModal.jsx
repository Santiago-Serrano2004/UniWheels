import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationsService } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import {
  Bell,
  CheckCheck,
  Car,
  ShieldCheck,
  Clock,
  Sparkles,
  Send,
  X,
} from 'lucide-react';

export const NotificationCenterModal = ({ isOpen, onClose }) => {
  const { user, theme } = useAppStore();
  const isDark = theme === 'dark';
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

  // Bloquear scroll del fondo mientras está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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

    await notificationsService.broadcastPushNotification({
      user_id: userId,
      title: nueva.title,
      body: nueva.body,
      type: nueva.type,
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop con desenfoque suave */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        {/* Modal Contenedor */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0 }}
          className={`relative w-full max-w-sm rounded-3xl p-4 border shadow-2xl z-10 max-h-[82vh] flex flex-col transition-colors ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Cabecera */}
          <div className={`flex items-center justify-between pb-2.5 border-b shrink-0 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-xl border ${
                  isDark
                    ? 'bg-slate-800 text-lochmara-400 border-slate-700'
                    : 'bg-lochmara-50 text-lochmara-600 border-lochmara-100'
                }`}
              >
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Notificaciones</h3>
                <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {unreadCount > 0 ? `${unreadCount} no leídas` : 'Bandeja al día'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={marcarTodasLeidas}
                  className={`text-[10px] font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-md cursor-pointer ${
                    isDark
                      ? 'text-lochmara-400 hover:text-lochmara-300 hover:bg-slate-800'
                      : 'text-lochmara-600 hover:text-lochmara-800 hover:bg-lochmara-50'
                  }`}
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Leídas</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className={`p-1 rounded-full transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Listado con scroll acotado */}
          <div className="flex-1 overflow-y-auto py-2 space-y-2 min-h-0 pr-0.5">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Bell className="w-7 h-7 mx-auto opacity-40 stroke-1" />
                <p className="text-xs font-medium">No tienes notificaciones</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.is_read && marcarComoLeida(notif.id)}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    notif.is_read
                      ? isDark
                        ? 'bg-slate-950/60 border-slate-800/80 opacity-60 text-slate-400'
                        : 'bg-slate-50/60 border-slate-200/60 opacity-70 text-slate-600'
                      : isDark
                      ? 'bg-slate-950 border-lochmara-900/60 text-white shadow-xs'
                      : 'bg-lochmara-50/40 border-lochmara-200 text-slate-900 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`p-1.5 rounded-xl shrink-0 ${
                        notif.is_read
                          ? isDark
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-slate-200 text-slate-600'
                          : 'bg-lochmara-600 text-white shadow-2xs'
                      }`}
                    >
                      {notif.type === 'conductor_en_camino' ? (
                        <Car className="w-3 h-3" />
                      ) : notif.type === 'abordaje_verificado' ? (
                        <ShieldCheck className="w-3 h-3" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <h4
                          className={`text-[11px] truncate ${
                            notif.is_read
                              ? isDark ? 'text-slate-300 font-semibold' : 'text-slate-700 font-semibold'
                              : isDark ? 'text-white font-bold' : 'text-slate-900 font-bold'
                          }`}
                        >
                          {notif.title}
                        </h4>
                        {!notif.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-lochmara-500 shrink-0" />
                        )}
                      </div>

                      <p className={`text-[10px] leading-snug break-words ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {notif.body}
                      </p>

                      <div className="flex items-center gap-1 text-[9px] text-slate-400 pt-0.5">
                        <Clock className="w-2.5 h-2.5" />
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
              ))
            )}
          </div>

          {/* Botón inferior fijo */}
          <div className={`pt-2 border-t shrink-0 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <button
              type="button"
              onClick={simularNotificacionEnVivo}
              className="w-full py-2 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Send className="w-3 h-3 text-white" />
              <span>Simular Alerta en Vivo</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
