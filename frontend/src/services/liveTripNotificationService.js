/**
 * Servicio de Notificaciones Activas y Persistentes en el Sistema Operativo (PWA / Web Notification API)
 * Permite mostrar información del viaje activo en la pantalla de bloqueo y barra de estado del teléfono.
 */

export const liveTripNotificationService = {
  /**
   * Solicitar permisos de notificación al usuario
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  /**
   * Despachar / Actualizar notificación persistente de viaje en el sistema operativo
   */
  async updateTripNotification({ driverName, vehicle, plate, etaMinutes, boardingPin, destination }) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const title = `UniWheels • ${driverName} (${plate})`;
    const body = `⏱️ Llega en ${etaMinutes} min | 🔐 PIN: ${boardingPin}\n📍 Destino: ${destination}`;

    try {
      // Si el navegador soporta Service Worker (PWA instalable)
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, {
            body: body,
            icon: '/assets/icons/icon-192x192.png',
            badge: '/assets/icons/icon-192x192.png',
            tag: 'uniwheels-active-trip', // Mantiene una sola notificación fija y la actualiza
            renotify: false,
            silent: true,
            requireInteraction: true, // Queda fija en Android / Windows
            data: {
              url: window.location.origin,
            },
          });
          return;
        }
      }

      // Fallback estándar en navegador
      new Notification(title, {
        body: body,
        icon: '/assets/icons/icon-192x192.png',
        tag: 'uniwheels-active-trip',
      });
    } catch (err) {
      console.warn('No se pudo despachar la notificación nativa:', err);
    }
  },

  /**
   * Cerrar la notificación fija al finalizar o cancelar el viaje
   */
  async clearTripNotification() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const notifications = await registration.getNotifications({ tag: 'uniwheels-active-trip' });
        notifications.forEach((n) => n.close());
      } catch {
        // Ignorar
      }
    }
  },
};
