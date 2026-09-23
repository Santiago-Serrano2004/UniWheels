// Service worker de UniWheels — únicamente para notificaciones Web Push
// (no cachea assets ni convierte esto en una PWA offline; alcance intencionalmente
// mínimo hasta que eso se plantee como necesidad aparte).

self.addEventListener('push', (event) => {
  let datos = { title: 'UniWheels', body: 'Tienes una notificación nueva.', data: {} };

  try {
    if (event.data) {
      datos = { ...datos, ...event.data.json() };
    }
  } catch {
    // Payload no era JSON válido — se usa el mensaje genérico de respaldo.
  }

  event.waitUntil(
    self.registration.showNotification(datos.title, {
      body: datos.body,
      icon: '/logo-192.png',
      badge: '/emblem-192.png',
      data: datos.data || {},
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
