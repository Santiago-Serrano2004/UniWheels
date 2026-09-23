# Spec: Paridad móvil 04 — Telemetría GPS real en vivo y Botón de Pánico SOS (RC-6)

## Contexto mínimo (ya investigado, no repetir)

En la auditoría de viabilidad de negocio (`tesis/auditoria/2026-09-21-viabilidad-negocio/CONSOLIDADO.md`, Riesgo Crítico RC-6) y en el diagnóstico de brechas de paridad (`tesis/auditoria/2026-09-22-paridad-movil/gap-analysis-gemini.md`), se identificaron dos falencias de alta criticidad para la seguridad de la comunidad universitaria:

1. **Ausencia de telemetría GPS real en la aplicación móvil:** `mobile/src/app/(tabs)/map.tsx:40-50` reconoce explícitamente que la visualización actual es una polilínea estática sin captura de coordenadas en vivo. El backend ya tiene implementada la tabla `trip_tracking_points` y los endpoints `POST /trips/{id}/tracking` (emisión de telemetría) y `GET /trips/{id}/tracking/latest` (consulta de última posición), pero el cliente móvil no emite ni consume coordenadas reales.
2. **Ausencia del sistema de emergencia SOS:** En `mobile/src/components/AppHeader.tsx:15-18`, el botón SOS está omitido. No existe modal de pánico, ni enlaces directos a las líneas nacionales de emergencia (`123`, `125`, `155`), ni capacidad de compartir la ubicación en tiempo real con contactos de confianza por WhatsApp en caso de riesgo durante el trayecto.

Esta especificación detalla la implementación completa del rastreo GPS bidireccional (Conductor → Backend → Pasajero) y del sistema de seguridad SOS en la app nativa Expo/React Native.

---

## Alcance de esta v1 (explícitamente fuera de alcance)

- **Fuera de alcance:** WebSockets o SSE (Server-Sent Events) para el tracking. Se utilizará polling HTTP eficiente (intervalo de 4 a 6 segundos para el pasajero y emisión cada 5 segundos para el conductor), alineado con la arquitectura actual de `trip-service`.
- **Fuera de alcance:** Recálculo de tráfico en tiempo real con Inteligencia Artificial durante la navegación (se utiliza la ruta base de PostGIS/OSRM).
- **Fuera de alcance:** Notificaciones push nativas de fondo (se abordan en `specs/mobile-paridad-05-push-notificaciones.md`).

---

## Tareas

### Tarea 1 — Métodos de telemetría y SOS en `packages/shared/src/api.js`

**Archivo:** `packages/shared/src/api.js`.

**Instrucciones:**
1. En `tripLifecycleService`, añadir los métodos de reporte y consulta de telemetría GPS:
   ```javascript
   async reportPosition(tripId, { latitude, longitude, speed_kmh, heading_degrees, accuracy_meters }) {
     try {
       const response = await tripLifecycleClient.post(`/trips/${tripId}/tracking`, {
         latitude,
         longitude,
         speed_kmh,
         heading_degrees,
         accuracy_meters
       });
       return response.data;
     } catch (error) {
       if (error.response?.data) throw error.response.data;
       throw { message: 'Error al emitir telemetría GPS.' };
     }
   },

   async getLatestPosition(tripId) {
     try {
       const response = await tripLifecycleClient.get(`/trips/${tripId}/tracking/latest`);
       return response.data?.data || null;
     } catch (error) {
       if (error.response?.data) throw error.response.data;
       return null;
     }
   },
   ```
2. Añadir método de reporte de incidente SOS:
   ```javascript
   async triggerEmergencySos(tripId, { latitude, longitude, emergencyType = 'panico_usuario' }) {
     try {
       const response = await tripLifecycleClient.post(`/trips/${tripId}/sos`, {
         latitude,
         longitude,
         emergency_type: emergencyType,
         timestamp: new Date().toISOString()
       });
       return response.data;
     } catch (error) {
       // Si el endpoint no existe o falla, no bloquear el flujo de llamada telefónica del dispositivo
       return { success: false, fallback: true };
     }
   }
   ```

**Verificación:** Verificar que `packages/shared/src/api.js` exporte las nuevas funciones sin errores sintácticos.

**Mensaje de commit:** `feat(shared): metodos de reporte de posicion GPS y evento SOS en tripService`

---

### Tarea 2 — Servicio y Hook de Tracking GPS en Conductor (`useDriverGpsTracking.ts`)

**Archivo nuevo:** `mobile/src/hooks/useDriverGpsTracking.ts`.

**Instrucciones:**
1. Utilizar `expo-location` para captura de posición de alta precisión:
   ```typescript
   import * as Location from 'expo-location';
   import { useEffect, useRef } from 'react';
   import { tripLifecycleService } from '@uniwheels/shared';
   ```
2. Implementar la lógica de suscripción continua:
   - Solicitar permisos de ubicación en primer plano (`Location.requestForegroundPermissionsAsync()`).
   - Si los permisos son concedidos, iniciar `Location.watchPositionAsync` con:
     - `accuracy: Location.Accuracy.High`
     - `timeInterval: 5000` (5 segundos)
     - `distanceInterval: 10` (10 metros de cambio mínimo)
   - En cada actualización de coordenadas:
     - Extraer `latitude`, `longitude`, `speed` (convertir de m/s a km/h multiplicando por 3.6), `heading` y `accuracy`.
     - Invocar `tripLifecycleService.reportPosition(tripId, payload)`.
3. Manejo de ciclo de vida:
   - Al desmontar el hook o finalizar el viaje, invocar `locationSubscription.remove()`.
   - Control de errores: si el dispositivo pierde la señal GPS temporalmente, registrar en consola sin interrumpir la interfaz del conductor.

**Verificación:** Ejecutar la app en modo conductor, iniciar un viaje de prueba y verificar en los logs de red que se envían peticiones `POST /trips/{id}/tracking` con coordenadas válidas cada 5 segundos.

**Mensaje de commit:** `feat(mobile): hook useDriverGpsTracking para emision continua de telemetria`

---

### Tarea 3 — Hook de Seguimiento de Posición para Pasajero (`usePassengerLiveTracking.ts`)

**Archivo nuevo:** `mobile/src/hooks/usePassengerLiveTracking.ts`.

**Instrucciones:**
1. Implementar hook de polling reactivo para el pasajero con viaje activo:
   - Recibir `tripId` y estado del viaje (`tripStatus`).
   - Activar polling únicamente si el estado es `STATUS_EN_CAMINO`, `STATUS_EN_PUNTO_ENCUENTRO` o `STATUS_RECOGIDO`.
   - Ejecutar `tripLifecycleService.getLatestPosition(tripId)` cada 5000 ms.
   - Retornar `{ driverCoords: { latitude, longitude, heading, speed }, isTrackingActive, lastUpdated }`.
2. Incluir cálculo aproximado de distancia euclidiana / Haversine entre la posición actual del conductor y el punto de recogida del pasajero para actualizar el ETA en vivo.
3. Desactivar automáticamente el intervalo cuando el viaje pase a `STATUS_COMPLETADO` o `STATUS_CANCELADO`.

**Verificación:** Simular la emisión de coordenadas desde el backend o conductor y comprobar que el hook del pasajero actualiza las coordenadas cada 5 segundos.

**Mensaje de commit:** `feat(mobile): hook usePassengerLiveTracking con polling de posicion y calculo de ETA`

---

### Tarea 4 — Renderizado de Marcador Animado en `mobile/src/app/(tabs)/map.tsx`

**Archivo:** `mobile/src/app/(tabs)/map.tsx`.

**Instrucciones:**
1. Importar `Marker`, `Polyline` de `react-native-maps`.
2. Integrar `usePassengerLiveTracking` cuando el usuario tenga un `activePassengerBooking`.
3. Renderizar:
   - Marcador personalizado del conductor con icono de carro/moto según el tipo de vehículo.
   - Rotación del icono usando el valor `heading` (rumbo en grados) devuelto por la telemetría.
   - Polilínea de la ruta calculada entre el punto de recogida y el campus.
   - Marcador estático con el punto de abordaje del pasajero.
4. Botón de recentrado: permite al usuario alternar entre centrar el mapa en su propia ubicación o en la posición del vehículo del conductor.

**Verificación:** Abrir el mapa con una reserva activa y comprobar que el icono del vehículo se posiciona sobre las coordenadas reportadas por el conductor y rota según su orientación.

**Mensaje de commit:** `feat(mobile): renderizado de conductor en tiempo real y rotacion de rumbo en mapa`

---

### Tarea 5 — Portar componente nativo `SosEmergencyModal.tsx` con Enlaces y WhatsApp

**Archivo nuevo:** `mobile/src/components/SosEmergencyModal.tsx`.  
**Referencia de lógica de negocio:** `frontend/src/components/common/SosEmergencyModal.jsx`.

**Instrucciones:**
1. Diseñar un modal de emergencia de alto impacto visual con tonos rojo carmesí (`bg-rose-600` / `bg-rose-950`).
2. Implementar botones de marcado telefónico directo con `Linking.openURL`:
   - **Línea Nacional 123 (Policía Nacional / Emergencias Generales):** `tel:123`.
   - **Línea Médica 125 (Ambulancias y CRUE):** `tel:125`.
   - **Línea 155 (Orientación y Protección a Mujeres / Violencia de Género):** `tel:155`.
   - **Seguridad Institucional UNAB / Campus:** teléfono configurable institucional (ej. `tel:6076436111`).
3. **Botón de compartir ubicación de pánico por WhatsApp:**
   - Obtener las coordenadas GPS actuales del usuario vía `Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })`.
   - Construir el enlace de Google Maps: `https://maps.google.com/?q=${lat},${lon}`.
   - Ensamblar el mensaje formateado:
     ```text
     🚨 ALERTA DE EMERGENCIA UNIWHEELS 🚨
     Necesito ayuda. Me encuentro en un viaje activo de UniWheels.
     - Conductor: {driverName}
     - Vehículo: {brand} {model} ({color})
     - Placa: {plateNumber}
     - Mi ubicación actual: https://maps.google.com/?q={lat},{lon}
     - Hora del reporte: {horaActual}
     ```
   - Invocar `Linking.openURL('whatsapp://send?text=' + encodeURIComponent(mensaje))` con fallback a `https://wa.me/?text=...`.
4. Disparar en segundo plano `tripLifecycleService.triggerEmergencySos` para auditoría en el backend.

**Verificación:** Abrir el modal de emergencia, tocar el botón de WhatsApp y verificar que se abre la aplicación de mensajería con el texto preformateado y el enlace funcional de Google Maps con las coordenadas exactas del dispositivo.

**Mensaje de commit:** `feat(mobile): modal de emergencia SosEmergencyModal con llamada 123 y WhatsApp GPS`

---

### Tarea 6 — Integrar botón SOS en `AppHeader.tsx` y en Navegación

**Archivo:** `mobile/src/components/AppHeader.tsx`.

**Instrucciones:**
1. Importar `AlertTriangle` o `ShieldAlert` de `lucide-react-native`.
2. Evaluar la presencia de un viaje activo (`activeDriverTrip` o `activePassengerBooking`).
3. Si hay viaje activo:
   - Renderizar en el `AppHeader` un botón destacado rojo pulsante: `<Pressable className="bg-rose-600 px-3 py-1.5 rounded-full flex-row items-center space-x-1 shadow-md"> <AlertTriangle size={14} color="#fff" /> <Text className="text-white text-xs font-black">SOS</Text> </Pressable>`.
   - Al presionar, abrir `SosEmergencyModal`.
4. Añadir también un botón flotante SOS permanente en `mobile/src/app/(tabs)/map.tsx`.

**Verificación:** Iniciar un viaje y comprobar que el botón SOS rojo aparece en la cabecera superior y en el mapa; al tocarlo debe abrir el modal de pánico.

**Mensaje de commit:** `feat(mobile): integracion del boton SOS en AppHeader y mapa durante viajes activos`

---

## Matriz de Verificación de Paridad

| ID Prueba | Caso de Uso | Entrada / Acción | Web Esperado | Mobile Esperado | Estado |
| :--- | :--- | :--- | :--- | :--- | :---: |
| GPS-01 | Captura GPS conductor | Conductor en viaje presiona "Iniciar" | Emite coords a `/tracking` cada 5s | Emite coords a `/tracking` cada 5s con `expo-location` | [ ] |
| GPS-02 | Visualización pasajero | Pasajero abre mapa con viaje en camino | Polling a `/tracking/latest` | Polling a `/tracking/latest` y marcador animado | [ ] |
| GPS-03 | Rumbo y rotación | Conductor cambia dirección de marcha | Rota icono en mapa Leaflet | Rota marcador en `react-native-maps` según `heading` | [ ] |
| SOS-01 | Visibilidad botón SOS | Sin viaje activo | Botón SOS oculto | Botón SOS oculto | [ ] |
| SOS-02 | Visibilidad con viaje | Conductor o pasajero con viaje en curso | Botón SOS rojo visible en cabecera | Botón SOS rojo visible en cabecera y mapa | [ ] |
| SOS-03 | Marcación Policía 123 | Tap en botón "Policía 123" | Abre `tel:123` en navegador | Invoca `Linking.openURL('tel:123')` nativo | [ ] |
| SOS-04 | Alerta WhatsApp con GPS | Tap en "Compartir WhatsApp" | Genera link maps y abre web WhatsApp | Obtiene GPS actual y abre app WhatsApp nativa | [ ] |
