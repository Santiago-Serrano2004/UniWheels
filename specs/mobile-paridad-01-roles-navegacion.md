> **Nota (2026-10-05):** los pagos, la billetera y Wompi fueron eliminados del producto. Ver `docs/adr/0001-pivote-b2b-sin-pagos.md` y `specs/pivote-b2b-sin-pagos.md`.

# Spec: Paridad móvil 01 — Conmutador de roles, bloqueo por conflicto y navegación de billetera

## Contexto mínimo (ya investigado, no repetir)

La aplicación web SPA (`frontend/`) cuenta con un soporte maduro para la alternancia entre los roles de **Pasajero** y **Conductor** verificado, así como un mecanismo estricto de exclusión mutua para impedir que un usuario opere simultáneamente en ambos roles mientras tenga un viaje o reserva en curso:

- `frontend/src/components/common/Header.jsx` — el botón de rol evalúa `user.isDriver` y `activeRole` (líneas 26-41, 84-115). Si el usuario es conductor aprobado, alterna entre `'passenger'` y `'driver'` actualizando el estado y redirigiendo a la vista principal respectiva (`'home'` o `'driver'`). Si no es conductor, abre `DriverInviteModal`.
- `frontend/src/components/common/ActiveRoleConflictBlocker.jsx` — componente de bloqueo de interfaz (líneas 1-125) que se activa cuando `activeRole === 'passenger' && activeDriverTrip` o `activeRole === 'driver' && activePassengerBooking` (ver `frontend/src/App.jsx:108-134`). Muestra una tarjeta informativa con el viaje en conflicto, los detalles de ruta/horario y un botón de redirección segura a la vista correspondiente para resolver o continuar dicho viaje.
- `frontend/src/components/common/BottomNav.jsx` — la barra de navegación adapta sus pestañas según el rol activo (líneas 18-31). Para pasajeros muestra: `Inicio`, `Ruta`, `Viajes`, `Perfil`. Para conductores muestra: `Mi Panel`, `Publicar`, `Viajes`, `Billetera`, `Perfil`.
- `packages/shared/src/store/useAppStore.js` — el store compartido ya define `activeRole`, `toggleRole`, `activeDriverTrip` y `activePassengerBooking`, pero en `mobile/src/components/AppHeader.tsx` (líneas 109-115) el botón de rol está estático y cableado a `"Pasajero"` abriendo siempre `openDriverInviteModal`, impidiendo que los usuarios aprobados cambien a modo conductor.
- `mobile/src/app/(tabs)/_layout.tsx` — la pestaña `wallet` (`Billetera`) está desactivada con `options={{ href: null }}` (línea 45), impidiendo el acceso a `mobile/src/app/(tabs)/wallet.tsx` desde la barra de navegación.

Este spec es el prerequisito obligatorio para habilitar el flujo de conductor en mobile, ya que sin el conmutador de rol y la navegación adaptativa no es posible acceder a las pantallas operativas del conductor.

---

## Alcance de esta v1 (explícitamente fuera de alcance)

- **Fuera de alcance:** Implementación del wizard de registro de conductor, publicación de rutas, cabina de conductor y navegación GPS (se implementan en `specs/mobile-paridad-02-flujo-conductor.md`).
- **Fuera de alcance:** Botón SOS de cabecera y modal de pánico en mobile (spec independiente de emergencias).
- **Fuera de alcance:** Pestaña o panel de administrador de Bienestar Universitario en mobile (la app móvil se enfoca exclusivamente en estudiantes/conductores/pasajeros).
- **Fuera de alcance:** Notificaciones push nativas y Live Activities de segundo plano.

---

## Tareas

### Tarea 1 — Sincronización de roles y persistencia en el Store Compartido

**Archivo:** `packages/shared/src/store/useAppStore.js` (líneas ~76-92, ~198-243).

**Instrucciones:**
1. Revisar la función `toggleRole` en `useAppStore.js`:
   - Asegurar que al alternar de rol (`passenger` ↔ `driver`), valide `state.user?.isDriver`. Si no es conductor verificado, mantener `activeRole: 'passenger'`.
   - Si es conductor, alternar `nuevoRol = state.activeRole === 'passenger' ? 'driver' : 'passenger'`.
   - Actualizar el objeto `user` con `role: nuevoRol` y persistirlo mediante `writeStoredSession(usuarioActualizado)`.
   - Establecer `activeTab: 'home'` al conmutar para asegurar que ambas plataformas carguen la pantalla inicial del rol correspondiente.
2. En `hydrateSession`, asegurar que si el usuario tiene `isDriver: true`, respete el último `role` persistido en la sesión (`sesion?.role || 'passenger'`).
3. En `login`, asegurar que `user.driverStatus` y `user.isDriver` se inicialicen consistentemente con el payload devuelto por `auth-service`.

**Casos borde:** Si un usuario inicia sesión sin ser conductor y modifica el estado local, `toggleRole` debe ignorar el cambio y preservar `activeRole: 'passenger'`.

**Verificación:** Ejecutar `node -e "const { useAppStore } = require('./packages/shared/src/store/useAppStore.js'); console.log(typeof useAppStore);"` o verificar que `npm run lint` en `packages/shared` pase sin errores.

**Mensaje de commit:** `feat(shared): persistencia y validacion de conmutacion de roles en useAppStore`

---

### Tarea 2 — Conmutador dinámico de rol en `AppHeader.tsx` de Mobile

**Archivo:** `mobile/src/components/AppHeader.tsx` (líneas ~49-136).

**Instrucciones:**
1. Importar `Car`, `UserCheck`, `ShieldCheck` de `lucide-react-native`.
2. Extraer del store `useAppStore`:
   ```tsx
   const activeRole = useAppStore((state) => state.activeRole);
   const toggleRole = useAppStore((state) => state.toggleRole);
   const isDriverVerified = Boolean(user?.isDriver);
   ```
3. Reemplazar el botón de rol estático de las líneas 109-115 por la lógica de conmutación:
   ```tsx
   const handleRolePress = () => {
     if (isDriverVerified) {
       toggleRole();
       router.replace('/(tabs)');
     } else {
       openDriverInviteModal();
     }
   };
   ```
4. Renderizar visualmente el botón con estilos nativos adaptados al estado:
   - Si `isDriverVerified && activeRole === 'driver'`: fondo verde esmeralda (`bg-emerald-600 dark:bg-emerald-700`), icono `<Car size={13} color="#a7f3d0" />`, texto `"Conductor"` (`text-white font-bold`).
   - Si `activeRole === 'passenger'`: fondo oscuro (`bg-slate-900 dark:bg-slate-800`), icono `<UserCheck size={13} color="#7dd3fc" />`, texto `"Pasajero"` (`text-white font-bold`).
   - Si el usuario no es conductor verificado, añadir un indicador sutil o mantener `"Pasajero"` que al tocar invoque el modal informativo `DriverInviteModal`.

**Casos borde:** Al pulsar el botón mientras un conductor tiene un viaje activo, el cambio de rol se ejecuta en el store y la vista de destino activará inmediatamente el bloqueador de conflicto (Tarea 4).

**Verificación:** Abrir la app móvil en simulador o web (`npm run web` en `mobile/`), iniciar sesión con un usuario con `isDriver: true` y pulsar el badge superior para comprobar que el texto alterna entre "Pasajero" y "Conductor" con el cambio de color correspondiente.

**Mensaje de commit:** `feat(mobile): conmutador dinamico de rol pasajero y conductor en AppHeader`

---

### Tarea 3 — Portar componente nativo `ActiveRoleConflictBlocker.tsx`

**Archivo nuevo:** `mobile/src/components/ActiveRoleConflictBlocker.tsx`.  
**Referencia de lógica de negocio:** `frontend/src/components/common/ActiveRoleConflictBlocker.jsx`.

**Instrucciones:**
1. Crear el componente funcional en React Native utilizando componentes estándar (`View`, `Text`, `Pressable`, `ScrollView`) y estilos con `NativeWind` (`className`).
2. Definir la interfaz TypeScript de props:
   ```tsx
   interface ActiveRoleConflictBlockerProps {
     conflictType: 'driver_active' | 'passenger_active';
     activeTrip: {
       departureTime?: string;
       time?: string;
       origin?: string;
       destination?: string;
       driverName?: string;
       [key: string]: any;
     } | null;
     onRedirect: () => void;
   }
   ```
3. Implementar la tarjeta visual de advertencia:
   - Icono `ShieldAlert` en contenedor ámbar (`bg-amber-500/20 border-amber-400/30 text-amber-300`).
   - Badge superior `"OPERACIÓN ACTIVA"`.
   - Título dinámico:
     - `conflictType === 'driver_active'`: `"Tienes un viaje activo como Conductor"`.
     - `conflictType === 'passenger_active'`: `"Tienes una reserva activa como Pasajero"`.
   - Mensaje explicativo de seguridad vial y coherencia operativa.
   - Resumen del viaje en curso: origen, destino con icono `ArrowRight`, y hora estimada de salida.
   - Nota informativa de bloqueo: `"La navegación en esta sección está bloqueada para evitar duplicidad de roles. La pestaña Perfil permanece disponible."`.
4. Botones de acción:
   - Botón primario:
     - Si `driver_active`: icono `Car`, texto `"Volver a Mi Panel de Conductor"`.
     - Si `passenger_active`: icono `CalendarCheck`, texto `"Volver a Mis Viajes de Pasajero"`.
     - Evento `onPress={onRedirect}`.
   - Botón secundario: icono `User`, texto `"Ir a Mi Perfil"`, con navegación a `/(tabs)/profile`.

**Casos borde:** Si `activeTrip` no contiene `origin` o `destination`, renderizar valores de respaldo razonables (`'Campus Universitario'` / `'Punto de encuentro'`) sin arrojar errores de renderizado.

**Verificación:** Comprobar que el archivo compile limpiamente con `npx tsc --noEmit` en el workspace `mobile/`.

**Mensaje de commit:** `feat(mobile): componente nativo ActiveRoleConflictBlocker`

---

### Tarea 4 — Integración del Bloqueo por Conflicto de Roles en Pantallas de Tabs

**Archivos:**
- `mobile/src/app/(tabs)/index.tsx`
- `mobile/src/app/(tabs)/map.tsx`
- `mobile/src/app/(tabs)/history.tsx`

**Instrucciones:**
1. En cada una de las tres pantallas principales (`index.tsx`, `map.tsx`, `history.tsx`), leer del store:
   ```tsx
   const activeRole = useAppStore((state) => state.activeRole);
   const activeDriverTrip = useAppStore((state) => state.activeDriverTrip);
   const activePassengerBooking = useAppStore((state) => state.activePassengerBooking);
   const toggleRole = useAppStore((state) => state.toggleRole);
   ```
2. Evaluar condiciones de conflicto al inicio del render de cada pantalla:
   - **Caso A (Conductor con ruta activa operando en vista de pasajero):**
     Si `activeRole === 'passenger' && activeDriverTrip`, renderizar `<ActiveRoleConflictBlocker conflictType="driver_active" activeTrip={activeDriverTrip} onRedirect={() => { toggleRole(); router.replace('/(tabs)'); }} />`.
   - **Caso B (Pasajero con cupo activo intentando operar en modo conductor):**
     Si `activeRole === 'driver' && activePassengerBooking`, renderizar `<ActiveRoleConflictBlocker conflictType="passenger_active" activeTrip={activePassengerBooking} onRedirect={() => { toggleRole(); router.replace('/(tabs)/history'); }} />`.
3. Garantizar que `mobile/src/app/(tabs)/profile.tsx` y `mobile/src/app/(tabs)/wallet.tsx` **no** contengan este bloqueo, de modo que el usuario siempre pueda consultar su perfil y saldo financiero.

**Casos borde:** Cuando el viaje activo finalice o se cancele (`activeDriverTrip` o `activePassengerBooking` pasan a `null`), el bloqueador se desmonta automáticamente restaurando la vista normal.

**Verificación:** Simular en el store un `activeDriverTrip` mientras `activeRole === 'passenger'` y comprobar que al ingresar a `Inicio`, `Ruta` o `Viajes` se presenta el bloqueador y el botón de redirección conmuta el rol y restablece la navegación.

**Mensaje de commit:** `feat(mobile): proteccion de exclusion mutua por rol activo en pantallas de tabs`

---

### Tarea 5 — Habilitar Pestaña de Billetera Condicional en `_layout.tsx`

**Archivo:** `mobile/src/app/(tabs)/_layout.tsx` (líneas ~14-53).

**Instrucciones:**
1. Importar `Wallet` de `lucide-react-native`.
2. Leer `activeRole` desde `useAppStore`:
   ```tsx
   const activeRole = useAppStore((state) => state.activeRole);
   const isDriver = activeRole === 'driver';
   ```
3. Configurar la visibilidad de la pestaña `wallet` según el rol activo:
   ```tsx
   <Tabs.Screen
     name="wallet"
     options={{
       title: 'Billetera',
       tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
       href: isDriver ? '/(tabs)/wallet' : null,
     }}
   />
   ```
4. Ajustar el orden y títulos de los tabs para mantener paridad con la web:
   - En modo **Pasajero**: `index` ("Inicio"), `map` ("Ruta"), `history` ("Viajes"), `profile` ("Perfil"), `wallet` (`href: null`).
   - En modo **Conductor**: `index` ("Mi Panel"), `map` (`href: null` o "Ruta"), `history` ("Historial"), `wallet` ("Billetera"), `profile` ("Perfil").
5. Verificar que `mobile/src/app/(tabs)/wallet.tsx` renderice correctamente el saldo de la billetera, el botón de recarga con Wompi (`WompiWidgetModal`) y el historial de transacciones.

**Casos borde:** Si el usuario accede mediante un deep link directo a `/wallet` siendo pasajero, la pantalla debe cargar normalmente sin romperse (el saldo y las recargas son válidos para ambos roles).

**Verificación:** Conmutar a modo Conductor en la app móvil y verificar que la pestaña "Billetera" aparece en la barra inferior con su icono `Wallet`, y que al pulsarla navega a `wallet.tsx` mostrando el saldo real y los movimientos. Al conmutar de nuevo a Pasajero, la pestaña desaparece de la barra.

**Mensaje de commit:** `feat(mobile): navegacion dinamica por rol y habilitacion de tab de billetera`

---

### Tarea 6 — Gestión de Rol y Estado de Verificación en `profile.tsx`

**Archivo:** `mobile/src/app/(tabs)/profile.tsx` (líneas ~60-150).

**Instrucciones:**
1. En la pantalla de perfil, añadir una tarjeta o sección dedicada al estado del conductor:
   - Si `user?.isDriver`:
     - Mostrar badge de "Conductor Verificado" en verde esmeralda con icono `ShieldCheck`.
     - Mostrar botón interactivo "Cambiar a Modo Conductor" / "Cambiar a Modo Pasajero" que invoque `toggleRole()`.
   - Si `user?.driverStatus === 'pending'`:
     - Mostrar banner informativo en amarillo/ámbar: "Verificación de Conductor en Trámite por Bienestar Universitario".
   - Si no está registrado como conductor:
     - Mostrar tarjeta de invitación: "¿Tienes vehículo? Conduce en UniWheels y comparte gastos de gasolina", con botón que abra `openDriverInviteModal()`.

**Casos borde:** Si `user` es nulo (durante hidratación de sesión), no renderizar la tarjeta hasta completar la carga de datos.

**Verificación:** Abrir la pestaña Perfil con un usuario conductor y verificar que se muestra su estado verificado y el botón funcional de alternancia de rol.

**Mensaje de commit:** `feat(mobile): seccion de estado y conmutacion de rol en perfil de usuario`

---

## Instrucción final para el agente ejecutor

Haz commit tras cada tarea (`git add -A && git commit -m '...'`). Al terminar tu turno o al agotar tu cuota, escribe un bloque ESTADO con: hechas, pendientes, siguiente paso concreto, archivos tocados, cómo verificar y la base del diff. Reglas en `~/playbook-agentes.md`.
