> **Nota (2026-10-05):** los pagos, la billetera y Wompi fueron eliminados del producto. Ver `docs/adr/0001-pivote-b2b-sin-pagos.md` y `specs/pivote-b2b-sin-pagos.md`.

# Spec: Paridad móvil 03 — Experiencia del pasajero (Smart Match, modalidades de ruta, tarjeta de viaje activo y métodos de pago)

## Contexto mínimo (ya investigado, no repetir)

En la aplicación web SPA (`frontend/`), la experiencia del pasajero cuenta con un conjunto de capacidades clave para la búsqueda avanzada, el seguimiento de la reserva y la personalización que actualmente están truncadas o incompletas en la aplicación móvil (`mobile/`):

1. **Modalidades de ruta incompletas:** En `mobile/src/app/(tabs)/index.tsx:451-460`, las pestañas "Desde Campus" y "Entre Sedes" están cableadas con un mensaje informativo de `"Próximamente disponible"`, permitiendo únicamente búsquedas en modalidad "Hacia Campus". En `frontend/src/components/home/HomeView.jsx`, las tres modalidades están plenamente funcionales calculando orígenes y destinos preseleccionados según la sede del estudiante.
2. **Tarjeta de viaje activo y estados intermedios:** En `mobile/src/app/(tabs)/history.tsx:50-73`, la reserva activa se muestra como un banner azul plano sin desglose del ciclo de vida (`confirmado`, `en_camino`, `recogido`), sin visualización destacada del **PIN de seguridad de 4 dígitos** necesario para el abordaje, y sin botones de contacto directo (llamada o WhatsApp al conductor). En contraste, `frontend/src/components/trips/PassengerActiveTripCard.jsx` ofrece una tarjeta detallada con micro-estados, visualización del PIN, llamada, mensajería y botón de cancelación con diálogo de confirmación.
3. **Alertas de horario Smart Match:** En `frontend/src/store/useAppStore.js:290-340` y `frontend/src/components/trips/PassengerTripsView.jsx`, el pasajero puede guardar sus horarios de clase recurrentes para recibir sugerencias automáticas de conductores afines. En `mobile/src/app/(tabs)/history.tsx:8-13` esta funcionalidad fue omitida deliberadamente.
4. **Gestión de métodos de pago guardados:** En `frontend/src/components/profile/PaymentMethodsManagerModal.jsx`, el usuario puede administrar tarjetas de crédito/débito guardadas para agilizar reservas. En `mobile/`, no existe componente para consultar ni borrar tarjetas del store.
5. **Widget flotante de viaje activo (Live Island):** En `frontend/src/components/common/LiveTripIslandWidget.jsx`, un widget minimizable acompaña al pasajero en cualquier vista mientras tenga un viaje en curso, mostrando el progreso de la ruta y tiempo estimado de llegada (ETA).

---

## Alcance de esta v1 (explícitamente fuera de alcance)

- **Fuera de alcance:** Telemetría GPS en tiempo real y botón SOS (se cubren en `specs/mobile-paridad-04-gps-tracking-sos.md`).
- **Fuera de alcance:** Notificaciones push nativas en segundo plano (se cubren en `specs/mobile-paridad-05-push-notificaciones.md`).
- **Fuera de alcance:** Panel de administrador de Bienestar Universitario.

---

## Tareas

### Tarea 1 — Sincronizar entidades de pasajero en `packages/shared/src/store/useAppStore.js`

**Archivo:** `packages/shared/src/store/useAppStore.js`.

**Instrucciones:**
1. Añadir el estado `recurringPassengerAlerts` (array) y las acciones para gestionar alertas de horarios recurrentes:
   ```javascript
   recurringPassengerAlerts: [],
   addPassengerAlert: (alert) => set((state) => ({
     recurringPassengerAlerts: [...state.recurringPassengerAlerts, { ...alert, id: `alert_${Date.now()}` }]
   })),
   removePassengerAlert: (id) => set((state) => ({
     recurringPassengerAlerts: state.recurringPassengerAlerts.filter(a => a.id !== id)
   })),
   ```
2. Añadir el estado `savedCards` (array) y las acciones de gestión de tarjetas:
   ```javascript
   savedCards: [],
   addSavedCard: (card) => set((state) => ({
     savedCards: [...state.savedCards, { ...card, id: `card_${Date.now()}` }]
   })),
   removeSavedCard: (id) => set((state) => ({
     savedCards: state.savedCards.filter(c => c.id !== id)
   })),
   setDefaultCard: (id) => set((state) => ({
     savedCards: state.savedCards.map(c => ({ ...c, isDefault: c.id === id }))
   })),
   ```
3. Garantizar que estas propiedades se incluyan en la hidratación y serialización de sesión con `AsyncStorage`.

**Verificación:** Ejecutar verificación de tipos / lint en `packages/shared`.

**Mensaje de commit:** `feat(shared): soporte de alertas smart match y metodos de pago en store`

---

### Tarea 2 — Habilitar modalidades "Desde Campus" y "Entre Sedes" en `mobile/src/app/(tabs)/index.tsx`

**Archivo:** `mobile/src/app/(tabs)/index.tsx`.  
**Referencia de lógica de negocio:** `frontend/src/components/home/HomeView.jsx` (líneas ~80-180) y `frontend/src/components/home/HomeHeroRouteCard.jsx`.

**Instrucciones:**
1. Eliminar el bloqueo `"Próximamente disponible"` en los selectores de modalidad de viaje.
2. Definir los tipos de modalidad: `'hacia_campus'`, `'desde_campus'`, `'entre_sedes'`.
3. Al seleccionar `'desde_campus'`:
   - El punto de origen se fija automáticamente como el campus del usuario autenticado (`user?.campus?.name || 'Campus Principal'`).
   - El punto de destino se vuelve editable para que el estudiante ingrese su dirección de destino (ej. casa o barrio).
4. Al seleccionar `'entre_sedes'`:
   - Desplegar selectores de origen y destino basados en el catálogo de sedes universitarias (`authService.getInstitutions()`).
5. Conectar la búsqueda con `routesService.searchMatches` pasando la orientación geográfica y coordenadas correspondientes calculadas con `placesApiService`.

**Verificación:** Abrir la app móvil, alternar entre "Hacia Campus", "Desde Campus" y "Entre Sedes", comprobar que los inputs de origen/destino se adaptan dinámicamente y disparan la búsqueda al pulsar "Buscar Rutas".

**Mensaje de commit:** `feat(mobile): habilitacion de modalidades de ruta Desde Campus y Entre Sedes`

---

### Tarea 3 — Portar componente nativo `PassengerActiveTripCard.tsx` con PIN y estados de viaje

**Archivo nuevo:** `mobile/src/components/PassengerActiveTripCard.tsx`.  
**Referencia de lógica de negocio:** `frontend/src/components/trips/PassengerActiveTripCard.jsx`.

**Instrucciones:**
1. Crear el componente con estilos NativeWind soportando modo claro y oscuro.
2. Renderizar visualmente:
   - Estado del viaje con badge de color:
     - `STATUS_CONFIRMADO` (`bg-blue-600`): "Conductor asignado - Esperando salida".
     - `STATUS_EN_CAMINO` (`bg-amber-600`): "Conductor en camino al punto de encuentro".
     - `STATUS_EN_PUNTO_ENCUENTRO` (`bg-purple-600`): "Conductor esperando en el punto acordado".
     - `STATUS_RECOGIDO` (`bg-emerald-600`): "En trayecto hacia el destino".
   - **PIN de abordaje destacado:** Contenedor de alta visibilidad con tipografía monoespaciada grande (`text-3xl font-extrabold tracking-widest text-emerald-600 dark:text-emerald-400`), indicando "Muestra este PIN de 4 dígitos al conductor al subir al vehículo".
   - **Datos del vehículo y conductor:** Nombre, calificación con estrellas, foto de perfil, modelo del vehículo, placa y color.
   - **Botones de acción directa:**
     - Botón "Llamar": invoca `Linking.openURL('tel:' + conductorTelefono)`.
     - Botón "WhatsApp": invoca `Linking.openURL('https://wa.me/57' + conductorTelefono + '?text=' + encodeURIComponent('Hola, soy tu pasajero de UniWheels...'))`.
     - Botón "Cancelar reserva": abre modal nativo de confirmación y consume `tripLifecycleService.cancelTrip(tripId)`.
3. Integrar este componente en `mobile/src/app/(tabs)/history.tsx` y en la parte superior de `mobile/src/app/(tabs)/index.tsx` cuando `activePassengerBooking` no sea nulo.

**Verificación:** Iniciar sesión como pasajero con una reserva activa y comprobar que la tarjeta muestra el PIN, la placa, el estado dinámico y que los botones de llamada/WhatsApp abren los esquemas de URL correctos.

**Mensaje de commit:** `feat(mobile): componente nativo PassengerActiveTripCard con PIN y acciones`

---

### Tarea 4 — Portar componente flotante `LiveTripIslandWidget.tsx` para Mobile

**Archivo nuevo:** `mobile/src/components/LiveTripIslandWidget.tsx`.  
**Referencia de lógica de negocio:** `frontend/src/components/common/LiveTripIslandWidget.jsx`.

**Instrucciones:**
1. Implementar un widget flotante nativo en la esquina superior/inferior de la pantalla cuando exista un viaje activo en el store (`activePassengerBooking` o `activeDriverTrip`).
2. Utilizar `react-native-reanimated` para transiciones suaves de colapsado / expandido al tocar el widget.
3. Mostrar:
   - Indicador de estado animado (punto pulsante verde).
   - Destino del viaje y ETA estimado en minutos.
   - Barra de progreso del viaje con icono de vehículo (carro o moto).
   - Botón de acceso directo para navegar hacia la vista de mapa del viaje.
4. Incluir el widget en el layout raíz `mobile/src/app/_layout.tsx` para que persista a través de todas las pestañas de navegación.

**Verificación:** Reservar un viaje y navegar entre las pestañas `index`, `history` y `profile`; verificar que el widget flotante permanece visible y permite expandir el resumen del viaje en tiempo real.

**Mensaje de commit:** `feat(mobile): widget flotante nativo LiveTripIslandWidget`

---

### Tarea 5 — Portar `SmartMatchAlertsModal.tsx` y `PaymentMethodsManagerModal.tsx`

**Archivos nuevos:**
- `mobile/src/components/SmartMatchAlertsModal.tsx` (Ref: `frontend/src/components/trips/PassengerTripsView.jsx`)
- `mobile/src/components/PaymentMethodsManagerModal.tsx` (Ref: `frontend/src/components/profile/PaymentMethodsManagerModal.jsx`)

**Instrucciones:**
1. `SmartMatchAlertsModal.tsx`:
   - Formulario para crear una rutina: Día de la semana (Lunes a Viernes), Hora de llegada al campus, Sede universitaria, Tolerancia en minutos (15, 30, 45 min).
   - Lista de rutinas activas con botón para activar/desactivar o eliminar.
   - Conexión con `addPassengerAlert` y `removePassengerAlert` del store.
2. `PaymentMethodsManagerModal.tsx`:
   - Lista de métodos de pago: Nequi Directo, Efectivo, y Tarjetas de crédito/débito guardadas.
   - Opciones para marcar una tarjeta como predeterminada o eliminarla.
   - Enlace para agregar nueva tarjeta mediante el widget seguro de Wompi.
3. Vincular los modales desde el perfil (`mobile/src/app/(tabs)/profile.tsx`) y desde la cabecera/pantalla de viajes.

**Verificación:** Crear una rutina de clase en el modal, cerrar y reabrir la app para comprobar que se preserva en `AsyncStorage`. Abrir el gestor de tarjetas y verificar la selección de método predeterminado.

**Mensaje de commit:** `feat(mobile): modales de alertas Smart Match y administracion de tarjetas`

---

## Matriz de Verificación de Paridad

| ID Prueba | Caso de Uso | Entrada / Acción | Web Esperado | Mobile Esperado | Estado |
| :--- | :--- | :--- | :--- | :--- | :---: |
| PAS-01 | Búsqueda "Desde Campus" | Seleccionar pestaña, origen se bloquea a campus | Origen fijo, destino editable | Origen fijo, destino editable | [ ] |
| PAS-02 | Búsqueda "Entre Sedes" | Seleccionar origen Sede A, destino Sede B | Busca rutas directas intercampus | Busca rutas directas intercampus | [ ] |
| PAS-03 | Visualización de PIN | Pasajero con reserva confirmada | Muestra PIN 4 dígitos en recuadro verde | Muestra PIN 4 dígitos en recuadro verde | [ ] |
| PAS-04 | Contacto telefónico conductor | Tap en botón "Llamar" | Abre enlace `tel:+57...` | Invoca `Linking.openURL('tel:+57...')` | [ ] |
| PAS-05 | Contacto WhatsApp | Tap en botón "WhatsApp" | Abre chat web con texto predefinido | Abre app de WhatsApp con texto y datos del viaje | [ ] |
| PAS-06 | Persistencia de rutinas | Crear alerta de Lunes 7:00 AM | Persiste en store | Persiste en AsyncStorage vía store compartido | [ ] |
| PAS-07 | Cancelación con confirmación | Tap en cancelar reserva | Diálogo modal, llama `POST /trips/{id}/cancel` | Diálogo modal nativo, llama `POST /trips/{id}/cancel` | [ ] |
