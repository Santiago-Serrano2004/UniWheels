# Spec: Paridad móvil 05 — Notificaciones Push Nativas (FCM / APNs) con Expo Notifications

## Contexto mínimo (ya investigado, no repetir)

Actualmente en la aplicación web (`frontend/`), las notificaciones fuera de la app se gestionan mediante el estándar **Web Push (VAPID + Service Worker)** implementado en `frontend/src/utils/pushNotifications.js` y `services/notification-service/app/Services/WebPushService.php`.

En la aplicación móvil (`mobile/`):
- `mobile/package.json` **no incluye `expo-notifications`** ni `expo-device`.
- La app solo cuenta con el centro de notificaciones in-app pasivo en `AppHeader.tsx`, que consulta `GET /notifications` al abrirse.
- Cuando la aplicación móvil está en segundo plano o cerrada, **el estudiante o conductor no recibe ninguna alerta** de eventos críticos en tiempo real:
  - Llegada del conductor al punto de encuentro (`driver_arrived`).
  - Aprobación o rechazo de documentos vehiculares por Bienestar (`vehicle_approved` / `vehicle_rejected`).
  - Cancelación imprevista de un viaje reservado (`trip_cancelled`).
  - Solicitud de confirmación de reserva (`booking_requested`).
  - Alerta de pánico SOS en el área (`emergency_sos`).

Esta especificación detalla la integración de notificaciones push nativas para Android (FCM) e iOS (APNs) utilizando el estándar de `expo-notifications` y el servicio de entrega de tokens push hacia el backend de UniWheels.

---

## Alcance de esta v1 (explícitamente fuera de alcance)

- **Fuera de alcance:** Live Activities y Dynamic Island en iOS (ActivityKit) o Foreground Services con notificación flotante continua en Android (se pueden planificar para una fase posterior de refinamiento).
- **Fuera de alcance:** Notificaciones de marketing masivo o segmentación analítica externa (OneSignal/Braze). La entrega se realiza directamente a través del stack de microservicios de UniWheels y el Expo Push Service.

---

## Tareas

### Tarea 1 — Instalar dependencias nativas en `mobile/`

**Archivo:** `mobile/package.json`.

**Instrucciones:**
1. Instalar `expo-notifications` y `expo-device` compatibles con Expo SDK 54:
   ```bash
   npx expo install expo-notifications expo-device
   ```
2. Verificar que las versiones queden ancladas de acuerdo al ecosistema de Expo 54 en `package.json`.

**Verificación:** Ejecutar `npx expo config --type public` y comprobar que no hay advertencias de dependencias desalineadas.

**Mensaje de commit:** `build(mobile): agregar expo-notifications y expo-device para push nativo`

---

### Tarea 2 — Métodos de Device Token en `packages/shared/src/api.js`

**Archivo:** `packages/shared/src/api.js`.

**Instrucciones:**
1. En `notificationsService`, añadir los métodos para registrar y remover tokens push móviles:
   ```javascript
   async registerDeviceToken({ token, platform, deviceName = null, appVersion = '1.0.0' }) {
     try {
       const response = await notificationApiClient.post('/push/device-tokens', {
         token,
         platform, // 'android' | 'ios' | 'expo'
         device_name: deviceName,
         app_version: appVersion
       });
       return response.data;
     } catch (error) {
       if (error.response?.data) throw error.response.data;
       throw { message: 'Error al registrar token de notificaciones push.' };
     }
   },

   async unregisterDeviceToken(token) {
     try {
       const response = await notificationApiClient.post('/push/device-tokens/remove', { token });
       return response.data;
     } catch {
       return { success: false };
     }
   }
   ```

**Verificación:** Comprobar que `notificationsService` exporta los nuevos métodos y maneja excepciones consistentemente.

**Mensaje de commit:** `feat(shared): metodos registerDeviceToken y unregisterDeviceToken en notificationsService`

---

### Tarea 3 — Configuración de Canales y Handlers en `mobile/src/services/pushNotificationService.ts`

**Archivo nuevo:** `mobile/src/services/pushNotificationService.ts`.

**Instrucciones:**
1. Configurar el comportamiento de presentación en primer plano:
   ```typescript
   import * as Notifications from 'expo-notifications';
   import * as Device from 'expo-device';
   import { Platform } from 'react-native';
   import Constants from 'expo-constants';
   import { notificationsService } from '@uniwheels/shared';

   Notifications.setNotificationHandler({
     handleNotification: async () => ({
       shouldShowAlert: true,
       shouldPlaySound: true,
       shouldSetBadge: true,
     }),
   });
   ```
2. Implementar `registerForPushNotificationsAsync()`:
   - Verificar si el entorno es un dispositivo físico (`Device.isDevice`). En simuladores emitir un log informativo y retornar `null`.
   - Crear los **canales de notificación para Android**:
     - Canal prioritario: `trip_alerts` (Importancia: `Notifications.AndroidImportance.MAX`, sonido habilitado, patrón de vibración `[0, 250, 250, 250]`, luz led `#10b981`).
     - Canal estándar: `general_alerts` (Importancia: `Notifications.AndroidImportance.DEFAULT`).
   - Solicitar permisos: `Notifications.requestPermissionsAsync()`.
   - Obtener el token Expo:
     ```typescript
     const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
     const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
     const pushToken = tokenResponse.data;
     ```
   - Enviar el token al backend utilizando `notificationsService.registerDeviceToken`.
   - Retornar `pushToken`.

**Verificación:** Probar en un dispositivo real o emulador con EAS dev client y verificar que el token se obtiene y se imprime en logs.

**Mensaje de commit:** `feat(mobile): servicio pushNotificationService con canales Android y captura de token`

---

### Tarea 4 — Suscripción de Eventos y Enrutamiento Profundo en `mobile/src/app/_layout.tsx`

**Archivo:** `mobile/src/app/_layout.tsx`.

**Instrucciones:**
1. En el componente de layout raíz, inicializar el registro de notificaciones cuando el usuario esté autenticado (`user != null`).
2. Configurar el listener de interacción al tocar una notificación (`Notifications.addNotificationResponseReceivedListener`):
   ```typescript
   useEffect(() => {
     const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
       const data = response.notification.request.content.data;
       if (!data) return;

       // Enrutamiento según el tipo de notificación
       switch (data.type) {
         case 'driver_arrived':
         case 'trip_started':
         case 'trip_tracking':
           router.push('/(tabs)/map');
           break;
         case 'trip_completed':
         case 'rating_pending':
           router.push('/(tabs)/history');
           break;
         case 'vehicle_approved':
         case 'vehicle_rejected':
           router.push('/(tabs)/profile');
           break;
         default:
           router.push('/(tabs)');
           break;
       }
     });

     return () => subscription.remove();
   }, []);
   ```
3. En la función de cierre de sesión (`logout` en `useAppStore`), invocar `unregisterDeviceToken` para evitar que el dispositivo siga recibiendo alertas de la cuenta anterior.

**Verificación:** Enviar una notificación de prueba con payload `{ type: 'driver_arrived' }`, pulsar sobre el banner del sistema y verificar que la app se abre y navega directamente a la pestaña de mapa.

**Mensaje de commit:** `feat(mobile): enrutamiento profundo ante interaccion con notificaciones push`

---

### Tarea 5 — Configurar plugin de notificaciones en `mobile/app.json`

**Archivo:** `mobile/app.json`.

**Instrucciones:**
1. Añadir el plugin de `expo-notifications` a la configuración de Expo:
   ```json
   "plugins": [
     "expo-router",
     [
       "expo-notifications",
       {
         "icon": "./assets/images/notification-icon.png",
         "color": "#10b981",
         "sounds": ["./assets/sounds/notification.wav"]
       }
     ],
     ...
   ]
   ```
2. Configurar permisos de notificaciones para Android (`POST_NOTIFICATIONS`) e iOS (`aps-environment: production`).

**Verificación:** Validar `app.json` con `npx expo config`.

**Mensaje de commit:** `config(mobile): registrar plugin expo-notifications en app.json`

---

## Matriz de Verificación de Paridad

| ID Prueba | Caso de Uso | Entrada / Acción | Web Esperado | Mobile Esperado | Estado |
| :--- | :--- | :--- | :--- | :--- | :---: |
| PUSH-01 | Solicitud de permisos | Iniciar sesión en la app | Solicita permisos Web Push | Solicita permisos nativos de notificaciones del OS | [ ] |
| PUSH-02 | Registro de token | Permiso concedido | Guarda suscripción VAPID | Envía Expo Push Token a `POST /push/device-tokens` | [ ] |
| PUSH-03 | Alerta con app en fondo | Conductor marca "Llegué" | Notificación Service Worker | Notificación nativa con sonido y vibración en barra de estado | [ ] |
| PUSH-04 | Deep link al tocar push | Tap en notificación de viaje | Foco en pestaña web | Abre la app móvil y redirige a la pantalla de mapa | [ ] |
| PUSH-05 | Desregistro en logout | Usuario cierra sesión | Invalida endpoint web | Elimina/desactiva token del dispositivo en el backend | [ ] |
