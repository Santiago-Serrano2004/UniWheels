/**
 * Notificaciones push del navegador (Web Push estándar — sin cuenta de terceros
 * ni SDK propietario). El backend (notification-service) firma los envíos con
 * sus propias claves VAPID; aquí solo se gestiona el permiso del navegador, el
 * registro del service worker y la suscripción PushManager.
 */

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// PushManager.subscribe requiere la applicationServerKey como Uint8Array, no
// como el string base64url que entrega el backend.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function registrarServiceWorker() {
  return navigator.serviceWorker.register('/sw.js');
}

export async function getExistingPushSubscription() {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!registration) return null;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

/**
 * Solicita permiso (si hace falta), registra el service worker y crea la
 * suscripción push del navegador. Devuelve el objeto PushSubscription nativo
 * listo para enviarse tal cual al backend (POST /push/subscribe).
 */
export async function subscribeToPush(vapidPublicKey) {
  if (!isPushSupported()) {
    throw new Error('Este navegador no soporta notificaciones push.');
  }

  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') {
    throw new Error('Permiso de notificaciones denegado.');
  }

  const registration = await registrarServiceWorker();
  await navigator.serviceWorker.ready;

  const existente = await registration.pushManager.getSubscription();
  if (existente) return existente;

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
}

export async function unsubscribeFromPush() {
  const subscription = await getExistingPushSubscription();
  if (subscription) {
    await subscription.unsubscribe();
  }
  return subscription;
}
