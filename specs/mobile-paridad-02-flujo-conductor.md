# Spec: Paridad móvil 02 — Flujo completo del conductor (registro vehicular, publicación, cabina GPS, liquidación e historial)

## Contexto mínimo (ya investigado, no repetir)

Actualmente en la aplicación móvil (`mobile/`), el rol de conductor está **100% ausente**. Mientras que la web (`frontend/`) cuenta con un ciclo de vida completo de conducción (desde el registro de documentos hasta el reporte de telemetría y liquidación de ganancias), un usuario en la aplicación móvil no dispone de ninguna de estas capacidades:

- **Registro vehicular y validación legal:** `frontend/src/components/driver/DriverRegistrationWizard.jsx` implementa un flujo guiado de 4 pasos (especificaciones del vehículo con validación de placas colombianas vía `ColombianPlateInput.jsx` y `colombianVehicleRules.js`, documentos SOAT/Tarjeta/RTM, licencia de conducción y firma táctil con consentimiento de Habeas Data). En mobile solo existe un modal estático pasivo (`DriverInviteModal.tsx`).
- **Publicación de rutas y Smart Match:** `frontend/src/components/driver/DriverRoutePublishForm.jsx` permite parametrizar origen, destino hacia/desde campus, puntos de parada, días, horas, cupos y cálculo de tarifa sugerida por kilómetro contra `route-matching-service` (`POST /routes`). En mobile no existe formulario de publicación.
- **Cabina de control (Cockpit):** `frontend/src/components/driver/DriverCockpitCard.jsx` administra los pasajeros confirmados en tiempo real, transiciones de estado del viaje (`POST /trips/{id}/start`, `POST /trips/{id}/arrive`), verificación del PIN de 4 dígitos de cada pasajero (`POST /trips/{id}/verify-pin`) y lanzamiento de navegación.
- **Navegación GPS y telemetría en tiempo real:** `frontend/src/components/driver/InAppGpsNavigator.jsx` y `frontend/src/hooks/useTurnByTurnNavigation.js` siguen la ruta OSRM con instrucciones paso a paso y emiten la posición, rumbo y velocidad cada 5 segundos al endpoint `POST /trips/{id}/tracking` de `trip-service`. Mobile no emite telemetría ni tiene navegador GPS en la aplicación.
- **Liquidación financiera y penalizaciones:** `frontend/src/components/driver/TripSettlementModal.jsx` calcula el arqueo de caja (efectivo vs saldo digital) descontando el 12% de comisión institucional y finaliza el viaje (`POST /trips/{id}/complete`). `CancelTripPenaltyModal.jsx` aplica una deducción de $3.000 COP al saldo si el conductor cancela una ruta con pasajeros confirmados.
- **Historial de conducción:** `frontend/src/components/driver/DriverHistoryView.jsx` consume `GET /driver/history`, calculando ingresos netos acumulados y métricas ecológicas (gramos de CO₂ prevenidos). En mobile, `history.tsx` solo consulta el historial de pasajero.
- **Desincronización en SDK compartido:** `packages/shared/src/api.js` carece de los métodos de telemetría (`reportPosition`, `getLatestPosition`), registro de vehículos y catálogos. Asimismo, `packages/shared/src/store/useAppStore.js` omite `recurringDriverTrips`, `rechargeDriverWallet` y métodos de gestión de tarjetas.

Esta spec porta integralmente toda la lógica de negocio del flujo de conductor a la aplicación nativa Expo, construyendo una experiencia visual y de interacción adaptada a React Native con componentes de alto rendimiento.

---

## Alcance de esta v1 (explícitamente fuera de alcance)

- **Fuera de alcance:** Notificaciones push nativas de segundo plano (FCM / APNs) con `expo-notifications` (se abordará en una spec posterior con backend de tokens).
- **Fuera de alcance:** Botones SOS de cabecera y modal de pánico telefónico en mobile (spec independiente de emergencias).
- **Fuera de alcance:** Guía de voz sintetizada con `expo-speech` (se usará guía visual giro a giro con opción a lanzar apps externas de navegación como Waze o Google Maps).
- **Fuera de alcance:** Live Activities y Dynamic Island nativas de iOS (ActivityKit) o Foreground Services continuos de Android.
- **Fuera de alcance:** Panel de administrador de Bienestar Universitario (`AdminVehicleReviewView`).
- **Fuera de alcance:** Configuración de compilación en la nube (EAS Build / Credentials) y publicación en App Store o Google Play.

---

## Tareas

### Tarea 1 — Métodos faltantes de Conductor en `packages/shared/src/api.js`

**Archivo:** `packages/shared/src/api.js`.

**Instrucciones:**
1. En `vehicleService`, añadir los métodos de registro vehicular y consulta de estado:
   ```javascript
   async registerVehicle(vehicleData) {
     try {
       const response = await vehicleApiClient.post('/vehicles', vehicleData);
       return response.data;
     } catch (error) {
       if (error.response?.data) throw error.response.data;
       throw { message: 'Error al registrar el vehículo.' };
     }
   },

   async checkApprovedVehicle() {
     try {
       const response = await vehicleApiClient.get('/vehicles/check-approved');
       return response.data?.data || null;
     } catch {
       return null;
     }
   },

   async uploadVehicleDocument(vehicleId, documentType, fileUri, fileName, mimeType) {
     try {
       const formData = new FormData();
       formData.append('document_type', documentType);
       formData.append('file', {
         uri: fileUri,
         name: fileName || `${documentType}.jpg`,
         type: mimeType || 'image/jpeg',
       });
       const response = await vehicleApiClient.post(`/vehicles/${vehicleId}/documents`, formData, {
         headers: { 'Content-Type': 'multipart/form-data' },
       });
       return response.data;
     } catch (error) {
       if (error.response?.data) throw error.response.data;
       throw { message: 'Error al subir el documento del vehículo.' };
     }
   },
   ```
2. En `authService`, asegurar la existencia del método `registerDriver`:
   ```javascript
   async registerDriver(driverPayload) {
     try {
       const response = await apiClient.post('/driver/register', driverPayload);
       return response.data;
     } catch (error) {
       if (error.response?.data) throw error.response.data;
       throw { message: 'Error al registrar la solicitud de conductor.' };
     }
   },
   ```
3. En `tripLifecycleService`, añadir los métodos de telemetría GPS y ciclo de vida de conducción:
   ```javascript
   async reportPosition(tripId, { latitude, longitude, speed_kmh, heading_degrees, accuracy_meters }) {
     try {
       const response = await tripLifecycleClient.post(`/trips/${tripId}/tracking`, {
         latitude, longitude, speed_kmh, heading_degrees, accuracy_meters,
       });
       return response.data;
     } catch {
       return null;
     }
   },

   async getLatestPosition(tripId) {
     try {
       const response = await tripLifecycleClient.get(`/trips/${tripId}/tracking/latest`);
       return response.data?.data || null;
     } catch {
       return null;
     }
   },
   ```
4. En `routesService`, verificar que existan `publishRoute`, `getMyRoutes`, `evaluateDetour` y `optimizePassengers`.

**Casos borde:** Los métodos de telemetría (`reportPosition`, `getLatestPosition`) tragan errores de red puntuales devolviendo `null` para no interrumpir el loop de navegación GPS.

**Verificación:** Ejecutar `node -e "const api = require('./packages/shared/src/api.js'); console.log(typeof api.tripLifecycleService.reportPosition);"` y confirmar que devuelva `function`.

**Mensaje de commit:** `feat(shared): endpoints de conductor, telemetria gps y catalogo vehicular en api.js`

---

### Tarea 2 — Propiedades y Acciones de Conductor en `packages/shared/src/store/useAppStore.js`

**Archivo:** `packages/shared/src/store/useAppStore.js`.

**Instrucciones:**
1. Agregar el estado y las acciones para plantillas de viajes recurrentes del conductor:
   ```javascript
   recurringDriverTrips: [],
   setRecurringDriverTrips: (trips) => set({ recurringDriverTrips: trips || [] }),
   toggleRecurringDriverTrip: (templateId) =>
     set((state) => ({
       recurringDriverTrips: state.recurringDriverTrips.map((t) =>
         t.id === templateId ? { ...t, isActive: !t.isActive } : t
       ),
     })),
   addRecurringDriverTrip: (nuevoTemplate) =>
     set((state) => ({
       recurringDriverTrips: [
         { id: 'rec_d_' + Date.now(), isActive: true, ...nuevoTemplate },
         ...state.recurringDriverTrips,
       ],
     })),
   deleteRecurringDriverTrip: (templateId) =>
     set((state) => ({
       recurringDriverTrips: state.recurringDriverTrips.filter((t) => t.id !== templateId),
     })),
   ```
2. Agregar la acción `rechargeDriverWallet`:
   ```javascript
   rechargeDriverWallet: (monto) =>
     set((state) => ({
       driverWalletBalance: state.driverWalletBalance + Number(monto),
     })),
   ```
3. Agregar gestión de métodos de pago guardados (`savedCards`):
   ```javascript
   savedCards: [],
   setSavedCards: (cards) => set({ savedCards: cards || [] }),
   addCard: (nuevaTarjeta) =>
     set((state) => ({
       savedCards: [
         ...state.savedCards.map((c) => (nuevaTarjeta.isDefault ? { ...c, isDefault: false } : c)),
         { id: 'card-' + Date.now(), ...nuevaTarjeta },
       ],
     })),
   deleteCard: (cardId) =>
     set((state) => ({
       savedCards: state.savedCards.filter((c) => c.id !== cardId),
     })),
   setDefaultCard: (cardId) =>
     set((state) => ({
       savedCards: state.savedCards.map((c) => ({ ...c, isDefault: c.id === cardId })),
     })),
   ```
4. Agregar alertas recurrentes de pasajero (`recurringPassengerAlerts`, `togglePassengerAlert`, `addPassengerAlert`, `deletePassengerAlert`) para sincronizar completamente el contrato con `frontend/src/store/useAppStore.js`.

**Casos borde:** Garantizar que ninguna mutación de estado rompa el flujo de `hydrateSession` ni genere referencias circulares.

**Verificación:** Comprobar que `npm run lint` en el paquete `shared` pase sin warnings.

**Mensaje de commit:** `feat(shared): soporte de rutas recurrentes, tarjetas y balance en store compartido`

---

### Tarea 3 — Reglas de Validación Vehicular e Input de Placas Colombianas

**Archivos nuevos:**
- `packages/shared/src/utils/colombianVehicleRules.ts` (o `.js`)
- `mobile/src/components/driver/ColombianPlateInput.tsx`

**Referencias de lógica de negocio:**
- `frontend/src/utils/colombianVehicleRules.js`
- `frontend/src/components/driver/ColombianPlateInput.jsx`

**Instrucciones:**
1. Crear `colombianVehicleRules.ts` en `packages/shared/src/utils/` exportando:
   - `FORMATO_PLACA_CARRO = /^[A-Z]{3}\d{3}$/` (Ej. `KLU492`)
   - `FORMATO_PLACA_MOTO = /^[A-Z]{3}\d{2}[A-Z]$/` (Ej. `UAB12D`)
   - Función `validarPlacaColombiana(placa, tipoVehiculo)` que devuelva `{ valida: boolean, error?: string }`.
   - Función `formatearPlacaVisual(placa)` que inserte un espacio o guion visual (`KLU-492` o `UAB-12D`).
2. Crear `ColombianPlateInput.tsx` en `mobile/src/components/driver/`:
   - Componente nativo con `TextInput`, estilizado como placa vehicular colombiana física (borde amarillo reflectivo en modo carro, fondo blanco, tipografía monoespaciada en negrita mayúscula).
   - Props: `value: string`, `onChangeText: (text: string) => void`, `vehicleType: 'car' | 'motorcycle'`, `error?: string`.
   - Auto-capitalización forzada a mayúsculas y filtrado estricto de caracteres inválidos (solo letras `A-Z` y números `0-9`).
   - Badge inferior que indique dinámicamente si el formato cumple la normativa colombiana de tránsito.

**Casos borde:** Manejar el caso de motos donde el sexto caracter debe ser una letra, no un número.

**Verificación:** Probar que el componente acepte `KLU492` para carro y `UAB12D` para moto, rechazando formatos menores a 6 caracteres o combinaciones inválidas.

**Mensaje de commit:** `feat(mobile): reglas de transito y componente nativo ColombianPlateInput`

---

### Tarea 4 — Wizard de Registro de Vehículo y Conductor (4 pasos)

**Archivos nuevos:**
- `mobile/src/components/driver/wizard-steps/VehicleSpecsStep.tsx`
- `mobile/src/components/driver/wizard-steps/LegalDocumentsStep.tsx`
- `mobile/src/components/driver/wizard-steps/DriverLicenseStep.tsx`
- `mobile/src/components/driver/wizard-steps/HabeasDataSignatureStep.tsx`
- `mobile/src/components/driver/DriverRegistrationWizard.tsx`

**Referencias de lógica de negocio:**
- `frontend/src/components/driver/DriverRegistrationWizard.jsx`
- `frontend/src/components/driver/wizard-steps/VehicleSpecsStep.jsx`
- `frontend/src/components/driver/wizard-steps/LegalDocumentsStep.jsx`
- `frontend/src/components/driver/wizard-steps/DriverLicenseStep.jsx`
- `frontend/src/components/driver/wizard-steps/HabeasDataSignatureStep.jsx`

**Instrucciones:**
1. **Paso 1 (`VehicleSpecsStep.tsx`):**
   - Selector de tipo (`car` | `motorcycle`), consumo de `vehicleService.getCatalogBrands()` y `getCatalogModels(brandId)`.
   - Input de placa física con `ColombianPlateInput`.
   - Si es moto, checkbox obligatorio de casco reglamentario certificado con visor.
   - Capacidad de puestos para pasajeros (1-4).
2. **Paso 2 (`LegalDocumentsStep.tsx`):**
   - Tarjetas de carga para: (1) SOAT vigente, (2) Tarjeta de Propiedad vehicular, (3) Revisión Técnico-Mecánica (RTM si aplica por antigüedad).
   - Captura y previsualización de foto mediante `PhotoPickerModal` / `expo-image-picker`.
   - Fechas de vencimiento de cada póliza con `@react-native-community/datetimepicker`.
3. **Paso 3 (`DriverLicenseStep.tsx`):**
   - Número de licencia de conducción colombiana, categoría (A2, B1, B2, C1), fecha de expedición y vencimiento, foto frontal de la licencia.
4. **Paso 4 (`HabeasDataSignatureStep.tsx`):**
   - Términos de autorización para consulta de antecedentes disciplinarios/judiciales ante la Policía Nacional y SIMIT.
   - Canvas de firma táctil nativo (captura de trazo vectorial con `react-native-svg` y gestos táctiles `PanResponder` o `react-native-gesture-handler`).
   - Botón para limpiar trazo y checkbox de confirmación bajo fe de juramento.
5. **Orquestador (`DriverRegistrationWizard.tsx`):**
   - Barra de progreso superior con indicador de los 4 pasos.
   - Manejo del estado consolidado del formulario.
   - Envío al backend: llamada a `vehicleService.registerVehicle`, subida de archivos adjuntos con `uploadVehicleDocument` y actualización del estado del usuario en el store vía `updateDriverStatus('pending', datosConductor)`.

**Casos borde:** Si la conexión falla a mitad de la subida de documentos, mostrar error puntual con opción a reintentar el paso actual sin perder los datos ya digitados.

**Verificación:** Completar los 4 pasos en el simulador móvil y verificar que se genera el registro del vehículo y el estado del usuario pasa a `pending`.

**Mensaje de commit:** `feat(mobile): wizard completo de registro de conductor en 4 pasos con firma digital`

---

### Tarea 5 — Onboarding del Conductor y Modal de Celebración de Aprobación

**Archivos nuevos:**
- `mobile/src/components/driver/DriverOnboardingView.tsx`
- `mobile/src/components/common/DriverApprovedCelebrationModal.tsx`

**Referencias de lógica de negocio:**
- `frontend/src/components/driver/DriverOnboardingView.jsx`
- `frontend/src/components/common/DriverApprovedCelebrationModal.jsx`

**Instrucciones:**
1. Crear `DriverOnboardingView.tsx`:
   - Vista mostrada cuando el usuario aún no es conductor o su solicitud está en trámite.
   - Si `driverStatus === 'unregistered'`: beneficios del programa de movilidad compartida, cálculo estimado de ahorro de combustible mensual, botón "Iniciar Solicitud de Conductor" que abre `DriverRegistrationWizard`.
   - Si `driverStatus === 'pending'`: banner de revisión institucional por Bienestar Universitario, checklist de documentos en verificación (SOAT, RTM, Licencia, Antecedentes) y botón "Comprobar Estado" que consulta `vehicleService.checkApprovedVehicle()`.
2. Crear `DriverApprovedCelebrationModal.tsx`:
   - Modal de celebración con animación festiva (confeti / logo UniWheels), felicitaciones por habilitación institucional y botón "Comenzar a Conducir" que conmuta automáticamente a `activeRole: 'driver'` y redirige a `/(tabs)`.
3. Polling de aprobación:
   - Al cargar `index.tsx` en rol conductor o con estado `pending`, realizar una consulta a `vehicleService.checkApprovedVehicle()`. Si devuelve `approved`, actualizar el store (`updateDriverStatus('approved')`) y abrir el modal de celebración.

**Casos borde:** Persistir en almacenamiento local (`AsyncStorage`) el acuse de recibo de la celebración para no mostrarla repetidamente en cada inicio de sesión.

**Verificación:** Simular la respuesta `approved` en `checkApprovedVehicle()` y comprobar que se abre el modal de celebración y se actualiza el rol en la cabecera.

**Mensaje de commit:** `feat(mobile): onboarding de conductor y modal de celebracion de aprobacion`

---

### Tarea 6 — Formulario de Publicación de Rutas

**Archivo nuevo:** `mobile/src/components/driver/DriverRoutePublishForm.tsx`.  
**Referencia de lógica de negocio:** `frontend/src/components/driver/DriverRoutePublishForm.jsx`.

**Instrucciones:**
1. Crear el formulario nativo para parametrizar nuevas rutas de viaje universitario:
   - Selector de sentido de viaje: "Hacia Campus", "Desde Campus", "Entre Sedes".
   - Selector de campus destino (reutilizar `CampusSelectorModal.tsx`).
   - Selector de ubicación de salida / origen (reutilizar `LocationPickerModal.tsx`).
   - Selección de fecha de viaje y hora de salida (`@react-native-community/datetimepicker`).
   - Selector de cupos disponibles (1 a 4 puestos según el vehículo registrado).
   - Definición del punto de encuentro o paradas intermedias recomendadas en Bucaramanga y su área metropolitana.
   - Tarifa solidaria sugerida calculada por tramo ($4.000 - $6.000 COP) con slider o botones rápidos.
2. Botón de publicación que invoque `routesService.publishRoute(payload)` y añada el viaje al store mediante `useAppStore.publishDriverTrip(payload)`.
3. Notificación de éxito y redirección inmediata a la cabina o historial de viajes del conductor.

**Casos borde:** Impedir la publicación si la hora de salida seleccionada es menor a la hora actual del dispositivo.

**Verificación:** Publicar una ruta hacia Campus El Jardín para las 06:45 AM y confirmar que se crea en `route-matching-service` y aparece en la lista de viajes publicados del store.

**Mensaje de commit:** `feat(mobile): formulario nativo de publicacion de rutas de conductor`

---

### Tarea 7 — Cabina de Control del Conductor (`DriverCockpitCard`)

**Archivo nuevo:** `mobile/src/components/driver/DriverCockpitCard.tsx`.  
**Referencia de lógica de negocio:** `frontend/src/components/driver/DriverCockpitCard.jsx`.

**Instrucciones:**
1. Crear el componente nativo de gestión activa del viaje del conductor:
   - Encabezado con estado del viaje (`Publicado`, `En camino`, `En punto de encuentro`, `En curso`).
   - Resumen de origen, destino, hora de salida y cupos ocupados vs disponibles.
   - Lista de pasajeros confirmados en la ruta (obtenidos de `tripsService.getActiveTripsForRoute(routeId)`):
     - Foto/avatar de cada pasajero, nombre, programa académico, punto de recogida.
     - Botones de contacto rápido: llamada telefónica directa (`tel:`) y WhatsApp (`https://wa.me/`).
     - Estado individual del pasajero (`esperando`, `recogido`).
2. Acciones del ciclo de vida del viaje:
   - Botón primario dinámico:
     - Estado inicial → "Iniciar Recorrido" (`tripLifecycleService.startDriving(tripId)`).
     - En camino → "Llegué al Punto de Encuentro" (`tripLifecycleService.arriveAtMeetingPoint(tripId)`).
     - Pasajeros por abordar → "Verificar PIN de Abordaje" (abre modal de PIN numérico de 4 dígitos y llama `tripLifecycleService.verifyPin(tripId, pin)`).
     - Todos abordados → "Iniciar Navegación GPS" (abre `InAppGpsNavigator.tsx`).
     - Llegando a destino → "Finalizar y Liquidar Viaje" (abre `TripSettlementModal.tsx`).
   - Botón de cancelación de ruta (abre `CancelTripPenaltyModal.tsx`).

**Casos borde:** Si un pasajero dicta un PIN incorrecto, mostrar alerta de PIN inválido en rojo sin alterar el estado del resto de los pasajeros.

**Verificación:** Iniciar un viaje desde la cabina, ingresar el PIN de un pasajero de prueba y comprobar que el estado del pasajero cambia a "recogido" y se habilita la finalización del trayecto.

**Mensaje de commit:** `feat(mobile): cabina de control del conductor con verificacion de pin y ciclo de vida`

---

### Tarea 8 — Hooks de Ruteo y Navegación GPS en Mobile

**Archivos nuevos:**
- `mobile/src/hooks/useOsrmRoute.ts`
- `mobile/src/hooks/useTurnByTurnNavigation.ts`

**Referencias de lógica de negocio:**
- `frontend/src/hooks/useOsrmRoute.js`
- `frontend/src/hooks/useTurnByTurnNavigation.js`

**Instrucciones:**
1. Crear `useOsrmRoute.ts`:
   - Hook que consulta la API pública de OSRM (`/route/v1/driving/{coords}?overview=full&geometries=geojson&steps=true`).
   - Devuelve la polilínea decodificada de coordenadas `[latitude, longitude]`, distancia total en metros, duración estimada en segundos y el array detallado de maniobras `steps` (instrucciones de giro, nombre de calle, tipo de maniobra).
2. Crear `useTurnByTurnNavigation.ts`:
   - Hook que recibe las coordenadas actuales del GPS y el array de maniobras OSRM.
   - Calcula mediante distancia geodésica (fórmula Haversine) cuál es la maniobra activa y la distancia restante hasta el próximo giro.
   - Detecta cuando el conductor ha completado un tramo o ha llegado al destino final.

**Casos borde:** Si la llamada a OSRM falla por problemas de conectividad, generar una polilínea recta de respaldo entre origen y destino para no interrumpir el seguimiento.

**Verificación:** Probar el hook con un origen y destino en Bucaramanga y verificar que retorne las coordenadas de la ruta y las maniobras paso a paso.

**Mensaje de commit:** `feat(mobile): hooks de ruteo osrm y navegacion giro a giro`

---

### Tarea 9 — Navegador GPS en App con Telemetría cada 5 segundos

**Archivo nuevo:** `mobile/src/components/driver/InAppGpsNavigator.tsx`.  
**Referencia de lógica de negocio:** `frontend/src/components/driver/InAppGpsNavigator.jsx`.

**Instrucciones:**
1. Crear la pantalla completa de navegación GPS utilizando `react-native-maps`:
   - Mapa en vista cenital/perspectiva centrado en la posición real del vehículo.
   - Trazado de la ruta con `<Polyline />` en color institucional (`#0284c7`).
   - Marcador del vehículo con icono de auto/moto que rota dinámicamente según el rumbo magnético (`heading`).
2. Captura continua de ubicación con `expo-location`:
   - Solicitar permisos en primer plano con `Location.requestForegroundPermissionsAsync()`.
   - Iniciar `Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 5 }, callback)`.
3. Transmisión periódica de telemetría a backend:
   - Controlar con un `useRef` el timestamp del último envío.
   - Limitar (throttle) a máximo un envío cada 5 segundos a `tripLifecycleService.reportPosition(tripId, { latitude, longitude, speed_kmh, heading_degrees, accuracy_meters })`.
4. HUD de Navegación superior e inferior:
   - Panel superior oscuro con la próxima maniobra (icono de giro a la derecha/izquierda, nombre de la vía y distancia restante).
   - Velocímetro digital en km/h (`pos.coords.speed * 3.6`).
   - Botón para abrir rutas en aplicaciones externas (Waze, Google Maps, Apple Maps) usando `packages/shared/src/utils/mapNavigation.js`.
   - Botón de cierre o regreso a la cabina compacta limpiando la suscripción del GPS al desmontar.

**Casos borde:** Si el usuario deniega los permisos de geolocalización, mostrar banner informativo advirtiendo que el GPS en vivo está desactivado y utilizar las coordenadas de origen de la ruta.

**Verificación:** Abrir el navegador en el dispositivo, verificar que el marcador sigue la posición del GPS y comprobar en los logs de red que se emiten peticiones `POST /trips/{id}/tracking` cada 5s.

**Mensaje de commit:** `feat(mobile): navegador gps turn-by-turn con telemetria en vivo cada 5 segundos`

---

### Tarea 10 — Modal de Liquidación Financiera y Cierre de Viaje

**Archivo nuevo:** `mobile/src/components/driver/TripSettlementModal.tsx`.  
**Referencia de lógica de negocio:** `frontend/src/components/driver/TripSettlementModal.jsx`.

**Instrucciones:**
1. Crear el modal nativo de arqueo financiero al culminar el viaje:
   - Resumen del trayecto (fecha, origen, destino, total de pasajeros abordados).
   - Desglose contable transparente:
     - Ingresos brutos por tarifa recaudada (`totalPasajeros * tarifa`).
     - Desglose de pagos recibidos en Efectivo (que el conductor tiene en mano) vs Saldo Digital (recibido por Wompi / Billetera).
     - Deducción de la comisión de plataforma institucional (12%).
     - Balance neto final a favor del conductor acreditado a su billetera.
2. Botón de confirmación "Finalizar y Liquidar Viaje":
   - Llama a `tripLifecycleService.completeTrip(tripId)`.
   - Limpia el viaje activo en el store (`useAppStore.finishActiveDriverTrip()`).
   - Sincroniza el saldo actualizado de la billetera.
   - Muestra animación de éxito y redirige a la vista principal del conductor.

**Casos borde:** Si un pasajero no abordó, solo liquidar sobre los pasajeros cuyo PIN fue verificado efectivamente.

**Verificación:** Finalizar un viaje con 2 pasajeros a $4.500 COP y comprobar que el modal calcula $9.000 COP brutos, deduce $1.080 COP (12%) y muestra $7.920 COP netos, actualizando la base de datos tras confirmar.

**Mensaje de commit:** `feat(mobile): modal de liquidacion financiera y arqueo de comisiones del conductor`

---

### Tarea 11 — Modal de Penalización por Cancelación de Conductor

**Archivo nuevo:** `mobile/src/components/driver/CancelTripPenaltyModal.tsx`.  
**Referencia de lógica de negocio:** `frontend/src/components/driver/CancelTripPenaltyModal.jsx`.

**Instrucciones:**
1. Crear el modal nativo de advertencia de cancelación de ruta:
   - Si la ruta tiene pasajeros confirmados:
     - Alerta roja destacada advirtiendo el impacto sobre la comunidad estudiantil.
     - Advertencia de penalización obligatoria de $3.000 COP descontada del saldo de la billetera.
     - Selector de motivo de cancelación (falla mecánica, emergencia médica, imprevisto de fuerza mayor).
   - Si la ruta no tiene pasajeros: cancelación libre sin penalidad.
2. Botón de confirmación "Cancelar Ruta y Aceptar Penalidad":
   - Llama a `tripLifecycleService.cancelTrip(tripId, 'driver', reason)`.
   - Aplica el descuento de saldo en el store (`useAppStore.cancelDriverTrip(true, 3000)`).
   - Cierra la ruta y regresa al panel principal.

**Casos borde:** Si el saldo de la billetera es menor a $3.000 COP, permitir la cancelación pero dejar el saldo en 0 COP y registrar el motivo en el backend.

**Verificación:** Cancelar una ruta con pasajeros asignados y confirmar que se descuenta la penalización del saldo local y se envía la cancelación a `trip-service`.

**Mensaje de commit:** `feat(mobile): modal de cancelacion de conductor con penalizacion de saldo`

---

### Tarea 12 — Historial de Conducción y Ganancias

**Archivo nuevo:** `mobile/src/components/driver/DriverHistoryView.tsx`.  
**Referencia de lógica de negocio:** `frontend/src/components/driver/DriverHistoryView.jsx`.

**Instrucciones:**
1. Crear el componente nativo de historial para el conductor:
   - Tarjetas de métricas consolidadas en la cabecera:
     - Ganancias netas totales acumuladas en COP.
     - Total de pasajeros transportados.
     - Calificación promedio del conductor (estrellas).
     - Huella de carbono prevenida (kg de CO₂ evitados por compartir vehículo).
   - Lista cronológica de rutas realizadas:
     - Fecha, hora, origen, destino con icono `ArrowRight`.
     - Estado del viaje (`Completado`, `Cancelado`).
     - Cantidad de pasajeros y valor neto liquidado.
2. Filtros rápidos por período: "Todos", "Esta semana", "Este mes".
3. Integrar en `mobile/src/app/(tabs)/history.tsx` para que renderice `DriverHistoryView` cuando `activeRole === 'driver'` y la vista de pasajero cuando `activeRole === 'passenger'`.

**Casos borde:** Manejar el estado de lista vacía con una ilustración sobria y mensaje invitando a publicar la primera ruta.

**Verificación:** Conmutar a modo Conductor, abrir la pestaña "Historial" y verificar que se listan las rutas anteriores con las ganancias acumuladas calculadas correctamente.

**Mensaje de commit:** `feat(mobile): vista de historial de rutas y metricas financieras del conductor`

---

### Tarea 13 — Integración del Panel Principal del Conductor en `index.tsx`

**Archivo:** `mobile/src/app/(tabs)/index.tsx`.

**Instrucciones:**
1. Modificar `index.tsx` para orquestar la vista principal según el rol activo:
   ```tsx
   if (activeRole === 'driver') {
     if (!user?.isDriver) {
       return <DriverOnboardingView />;
     }
     if (activeDriverTrip) {
       return <DriverCockpitCard />;
     }
     return (
       <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950 p-4">
         {/* Tarjeta de estado y bienvenida al conductor */}
         {/* Botón destacado 'Publicar Nueva Ruta' que abre DriverRoutePublishForm */}
         {/* Lista de plantillas de rutas recurrentes con switch activo/inactivo */}
         {/* Resumen de próximas salidas programadas */}
       </ScrollView>
     );
   }
   ```
2. Garantizar que el cambio entre modo Pasajero y Conductor actualice de inmediato la pantalla inicial sin recargas manuales.

**Casos borde:** Si el usuario es conductor verificado pero no tiene rutas activas, presentar accesos directos claros para publicar una ruta o configurar rutinas recurrentes.

**Verificación:** Cambiar a modo Conductor desde el Header y verificar que la pestaña de Inicio renderiza el panel de conductor en lugar del buscador de pasajeros.

**Mensaje de commit:** `feat(mobile): orquestacion de panel de conductor en pantalla principal de inicio`

---

## Instrucción final para el agente ejecutor

Haz commit tras cada tarea (`git add -A && git commit -m '...'`). Al terminar tu turno o al agotar tu cuota, escribe un bloque ESTADO con: hechas, pendientes, siguiente paso concreto, archivos tocados, cómo verificar y la base del diff. Reglas en `~/playbook-agentes.md`.
