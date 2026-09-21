# Spec: Corrección de bugs de UX/UI y accesibilidad en UniWheels

## Contexto mínimo (ya investigado, no repetir)

Durante la auditoría visual y de experiencia de usuario en UniWheels (cliente React 19 SPA + Vite + Tailwind 4 + react-leaflet + zustand), se identificaron inconsistencias visuales, problemas de accesibilidad táctil, interferencias en la interacción del mapa y fricciones en el flujo de verificación telefónica de registro:

- **Iconografía y emojis**: La guía de diseño `.claude/skills/frontend-design-ux-ui/SKILL.md` (Sección 2.2) prohíbe terminantemente emojis y caracteres unicode sustitutivos (como `📧`, `★`, `✕`, `➔`) en favor de íconos vectoriales sobrios de `lucide-react`. Existen ocurrencias aisladas en `ProfileView.jsx`, `HomeView.jsx`, `TripMapOverlayControls.jsx`, `DriverLiveNavigationCockpit.jsx`, `ActiveRoleConflictBlocker.jsx`, `LiveTripIslandWidget.jsx`, `DriverHistoryView.jsx` y `PassengerTripsView.jsx`.
- **Theming en BottomNav**: `BottomNav.jsx` omite el indicador activo (`motion.div layoutId="activeTabIndicator"`) cuando `theme === 'dark'`, dejando la pestaña seleccionada sin relieve de fondo en modo oscuro a diferencia del modo claro.
- **Interferencia de cámara en TripMapView**: `TripMapView.jsx` cuenta con un timer automático en `MapAutoBounds` que ejecuta `fitRouteToScreen` 4.5 segundos después de que el usuario mueve o hace zoom al mapa. Esto le quita el control de la cámara al usuario de forma involuntaria mientras explora Bucaramanga o su ruta.
- **Sentidos de viaje en HomeView**: Los sentidos "Desde Campus" y "Entre Sedes" permiten interactuar con el buscador antes de informar que no hay soporte geoespacial activo en tiempo real para esas modalidades. Debe comunicarse proactivamente antes de que el usuario intente ingresar datos en vano.
- **Accesibilidad táctil (Touch Targets)**: En `HomeView.jsx`, `CampusSelectorModal.jsx` y `NotificationCenterModal.jsx`, varios botones de cierre y descarte tienen áreas de contacto inferiores a los 44x44px recomendados por los estándares WCAG y mobile-first.
- **Formateo de celular en RegisterForm**: El input de teléfono solicita 10 dígitos pero carece de espaciado legible tipo `3XX XXX XXXX`, aumentando la tasa de errores de digitación.
- **Verificación SMS y reenvío**: El backend `services/auth-service/app/Http/Controllers/Api/V1/AuthController.php` ya implementa `POST /api/v1/auth/send-sms-code` (con throttle de 5 req/min) y `frontend/src/services/api.js` expone `authService.sendSmsCode(phoneNumber)`. En `RegisterForm.jsx`, el botón de reenvío no cuenta con un temporizador visual de cooldown (p.ej. 45s), permitiendo clics repetidos que confunden al usuario o disparan errores de throttle.

## Alcance de esta v1 (explícitamente fuera de alcance)

- **Fuera de alcance**: Refactorización de modularidad de los archivos que superan 300 líneas (se abordará en una especificación independiente de arquitectura).
- **Fuera de alcance**: Implementación de nuevas funcionalidades de negocio (paraderos inteligentes oficiales, SheWheels, tarifa solidaria, ruteo inverso de sedes en backend).
- **Fuera de alcance**: Implementación de mecanismos de bypass o alternativas de validación telefónica sin SMS (ver sección siguiente).

## Decisión de producto y cumplimiento pendiente (Santiago)

> [!IMPORTANT]
> **Decisión de Producto Pendiente para Santiago:**
> En el Paso 3 de `RegisterForm.jsx`, el registro exige simultáneamente la validación del PIN de correo institucional y el código de 6 dígitos enviado por SMS.
> 
> Si un usuario legítimo experimenta fallas en la red celular de su operador y el SMS no llega tras varios intentos de reenvío, actualmente no existe una vía alterna (por ejemplo, validación vía WhatsApp, validación diferida por bienestar universitario o bypass temporal).
> 
> Decidir si se debe incorporar un mecanismo de contingencia/bypass telefónico es una **decisión estratégica de producto y cumplimiento institucional (seguridad de identidad vs. fricción de onboarding)** que le corresponde definir a Santiago. Codex **NO** debe inventar ni habilitar ningún bypass en esta iteración.

---

## Tareas

### Tarea 1 — Reemplazar emojis y glifos unicode por iconos Lucide

Reemplazar los glifos unicode y emojis restantes por iconos de `lucide-react` ya presentes en el proyecto, cuidando tamaños, colores y accesibilidad.

**Archivos a modificar:**
1. `frontend/src/components/profile/ProfileView.jsx` (~línea 509):
   - Reemplazar el texto `📧 Te enviaremos un correo de despedida:` por un bloque con `<Mail className="w-3.5 h-3.5 text-lochmara-500 shrink-0" />` y el texto `Te enviaremos un correo de despedida:`. (El icono `Mail` ya está importado en la cabecera).
2. `frontend/src/components/home/HomeView.jsx` (~línea 377):
   - En la tarjeta `topMatch`, reemplazar `{topMatch.rating ? `${topMatch.rating} ★` : 'Sin calificación'}` por una estructura con `<Star className="w-3 h-3 fill-amber-400 text-amber-400" />` junto al valor de calificación (siguiendo el patrón existente en `RatingFeedbackModal` y `PassengerTripsView`). (Importar `Star` de `lucide-react` si no está en la cabecera).
3. `frontend/src/components/map/TripMapOverlayControls.jsx` (~línea 341):
   - Reemplazar `{ratingValue} ★` por `<span className="inline-flex items-center gap-1">{ratingValue} <Star className="w-3 h-3 fill-amber-400 text-amber-400" /></span>`. (`Star` ya está importado).
4. `frontend/src/components/driver/DriverLiveNavigationCockpit.jsx` (~línea 479):
   - Importar `X` de `lucide-react` y reemplazar el caracter `✕` del modal de cobro QR por `<X className="w-4 h-4" />`.
5. `frontend/src/components/common/ActiveRoleConflictBlocker.jsx` (~línea 75):
   - Reemplazar `{activeTrip.origin} ➔ {activeTrip.destination}` por una estructura flex que use `<ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-70" />` entre el origen y el destino. (`ArrowRight` ya está importado).
6. `frontend/src/components/common/LiveTripIslandWidget.jsx` (~línea 321):
   - Importar `ArrowRight` de `lucide-react` y reemplazar `{trip.origin || 'Cañaveral'} ➔ {trip.destination || 'Campus El Jardín'}` usando `<ArrowRight className="w-3 h-3 shrink-0 opacity-70" />`.
7. `frontend/src/components/driver/DriverHistoryView.jsx` (~líneas 505 y 550):
   - Importar `ArrowRight` de `lucide-react` y reemplazar los caracteres `➔` por `<ArrowRight className="w-3 h-3 shrink-0 opacity-70" />`.
8. `frontend/src/components/trips/PassengerTripsView.jsx` (~línea 572):
   - Importar `ArrowRight` de `lucide-react` y reemplazar `➔` por `<ArrowRight className="w-3 h-3 shrink-0 opacity-70" />`.

**Verificación:** `cd frontend && npm run lint`. No deben surgir errores ni advertencias de variables no utilizadas o JSX inválido.

**Mensaje de commit:** `fix(ui): reemplazar emojis y glifos unicode por iconos lucide`

---

### Tarea 2 — Indicador de pestaña activa en BottomNav para Dark Mode

Permitir que el indicador visual de pestaña activa animado (`motion.div layoutId="activeTabIndicator"`) se renderice tanto en modo claro como en modo oscuro con estilos adaptados al tema.

**Archivo:** `frontend/src/components/common/BottomNav.jsx` (~líneas 52-59).

- Eliminar la restricción `isActive && theme !== 'dark'`.
- Renderizar `motion.div` cuando `isActive` sea `true`, aplicando clases dinámicas según `theme`:
  - Modo oscuro (`theme === 'dark'`): `bg-slate-800/80 border border-slate-700/60 shadow-xs`.
  - Modo claro: `bg-lochmara-50/80 border border-lochmara-200/60`.
- Mantener `layoutId="activeTabIndicator"` y `transition={{ type: 'spring', stiffness: 380, damping: 30 }}` para que la transición entre pestañas sea suave y consistente en ambos modos.

**Verificación:** `cd frontend && npm run lint`.

**Mensaje de commit:** `fix(ui): restaurar indicador de pestaña activa en modo oscuro en bottomnav`

---

### Tarea 3 — Botón flotante para recentrar ruta en TripMapView (removiendo auto-recentrado intrusivo)

Eliminar el recentrado forzado automático por temporizador y reemplazarlo por un botón flotante discreto (`Locate`) que solo aparezca cuando el usuario haya desplazado el mapa manualmente.

**Archivo:** `frontend/src/components/map/TripMapView.jsx` (~líneas 26-114 y JSX).

- En `MapAutoBounds` (o mediante estado compartido en el mapa):
  - Eliminar el `resetTimerRef.current = setTimeout(() => { fitRouteToScreen(0.65); }, 4500);` dentro de `handleUserInteraction`.
  - Crear un estado booleano (ej. `const [isMapPanned, setIsMapPanned] = useState(false);`).
  - Cuando ocurran eventos `dragstart`, `zoomstart` o `movestart` originados por el usuario (`!isProgrammaticMoveRef.current`), establecer `isMapPanned(true)`.
  - Cuando se ejecute un ajuste inicial o programático (`fitRouteToScreen`), resetear `isMapPanned(false)`.
  - Renderizar un botón flotante discreto en el mapa con `AnimatePresence` cuando `isMapPanned` sea `true`:
    - Posición: esquina superior derecha del mapa (ej. `top-16 right-3` o sobre el lateral del viewport) con z-index adecuado (`z-20` o `z-30`).
    - Ícono: `<Locate className="w-4 h-4" />` (importar `Locate` de `lucide-react`).
    - Estilo: botón circular o redondeado con `backdrop-blur-md`, fondo `bg-white/90 dark:bg-slate-900/90`, borde `border border-slate-200 dark:border-slate-700`, sombra `shadow-lg`, texto accesible `title="Recentrar ruta"` y label `Recentrar`.
    - Al hacer clic en el botón: llamar a `fitRouteToScreen(0.45)` y establecer `isMapPanned(false)`.

**Verificación:** `cd frontend && npm run lint`.

**Mensaje de commit:** `fix(map): boton flotante para recentrar ruta en lugar de timer automatico intrusivo`

---

### Tarea 4 — Comunicación proactiva de modalidades en desarrollo en HomeView

Comunicar inmediatamente al usuario la disponibilidad de los sentidos de viaje ("Desde Campus" y "Entre Sedes") sin permitir que complete un formulario de búsqueda para luego ser rechazado.

**Archivos:**
1. `frontend/src/components/home/HomeHeroRouteCard.jsx` (~líneas 94-150 y zona de inputs):
   - En los botones del toggle de sentido ("Desde Campus" y "Entre Sedes"), agregar un badge visual sutil `Próximamente` o `Próx.` (`text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20`).
   - Cuando `directionFilter !== 'towards'`, reemplazar la sección de inputs de búsqueda por un banner informativo integrado dentro de la misma tarjeta que explique cordialmente:
     *"Esta modalidad de trayecto estará disponible próximamente en tu campus. Por ahora, selecciona 'Hacia Campus' para encontrar cupos en tiempo real."* con un botón de acción rápida para volver a "Hacia Campus".
2. `frontend/src/components/home/HomeView.jsx` (~líneas 135-140 y ~469-482):
   - Asegurar que la vista mantenga la coherencia visual y que el tab "Hacia Campus" permanezca 100% operativo sin alteraciones en su lógica de matching.

**Verificación:** `cd frontend && npm run lint`.

**Mensaje de commit:** `fix(home): comunicar proactivamente la disponibilidad de sentidos de viaje`

---

### Tarea 5 — Ampliar touch targets mínimos de 44x44px en botones de cierre y descarte

Aumentar el área táctil efectiva a un mínimo de 44x44px en botones de cierre/descarte para cumplir con accesibilidad mobile-first sin distorsionar el tamaño visual de los iconos.

**Archivos a modificar:**
1. `frontend/src/components/home/HomeView.jsx` (~línea 359):
   - En el botón de descarte de la sugerencia `topMatch`, ajustar clases a `min-w-[44px] min-h-[44px] -mr-2 -mt-2 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer shrink-0` manteniendo el icono `<X className="w-3.5 h-3.5" />`.
2. `frontend/src/components/home/CampusSelectorModal.jsx` (~línea 88):
   - En el botón de cierre del modal de sedes, cambiar `w-8 h-8 rounded-xl` a `min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors cursor-pointer shrink-0`.
3. `frontend/src/components/common/NotificationCenterModal.jsx` (~línea 176):
   - En el botón de cierre del centro de notificaciones, cambiar `p-1 rounded-full` a `min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors cursor-pointer text-slate-400 hover:text-slate-200 hover:bg-slate-800/50`.

**Verificación:** `cd frontend && npm run lint`.

**Mensaje de commit:** `fix(a11y): ampliar touch target minimo de 44x44px en botones de cierre`

---

### Tarea 6 — Máscara visual de celular colombiano en RegisterForm

Facilitar la digitación del número telefónico en el registro mostrando el formato estándar colombiano `3XX XXX XXXX` mientras el usuario escribe, conservando el valor plano de 10 dígitos para el backend.

**Archivo:** `frontend/src/components/auth/RegisterForm.jsx` (~líneas 573-595).

- Crear una función auxiliar pura `formatColombianPhone(digits)`:
  ```js
  const formatColombianPhone = (digits = '') => {
    const clean = digits.replace(/\D/g, '').slice(0, 10);
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  };
  ```
- En el `<input type="tel">` de número de celular:
  - `value={formatColombianPhone(telefono)}`
  - `placeholder="315 123 4567"`
  - `onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}`
- Comprobar que en `procesarPaso1`, `reenviarSms` y `procesarRegistroFinal` se siga enviando el string limpio de 10 dígitos (`telefono.replace(/\D/g, '')`).

**Verificación:** `cd frontend && npm run lint`.

**Mensaje de commit:** `fix(auth): mascara visual de formato para celular colombiano en registro`

---

### Tarea 7 — Cooldown y retroalimentación para reenvío de código SMS en RegisterForm

Prevenir reintentos compulsivos y saturación de peticiones agregando un temporizador visual de espera (cooldown de 45 segundos) en el botón de reenvío de código SMS del Paso 3.

**Archivo:** `frontend/src/components/auth/RegisterForm.jsx` (~líneas 210-246 y ~804-840).

- Agregar un estado `const [smsCooldown, setSmsCooldown] = useState(45);`.
- Iniciar `smsCooldown` en 45 segundos al avanzar al Paso 3 (cuando se despachan los primeros códigos en `procesarPaso2`).
- En un `useEffect`: si `smsCooldown > 0`, decrementar en 1 cada 1000ms con `setInterval` (limpiando el timer en el cleanup).
- En la función `reenviarSms`: al disparar exitosamente `authService.sendSmsCode`, reiniciar `setSmsCooldown(45)`.
- En el botón de reenvío SMS (~línea 830):
  - `disabled={reenviandoSms || smsCooldown > 0}`
  - Texto dinámico: `{reenviandoSms ? 'Reenviando...' : smsCooldown > 0 ? `Reenviar código en ${smsCooldown}s` : 'Reenviar código SMS'}`
- Agregar un mensaje de ayuda debajo del input de SMS:
  `<p className="text-[10px] text-slate-400 text-center">¿No recibiste el SMS? Revisa la cobertura de tu celular o solicita un nuevo código al expirar el temporizador.</p>`

**Verificación:** `cd frontend && npm run lint`.

**Mensaje de commit:** `fix(auth): temporizador de cooldown y retroalimentacion para reenvio de sms`

---

## Instrucción final para el agente ejecutor

1. Trabaja tarea por tarea de forma estrictamente secuencial (Tarea 1 a Tarea 7).
2. Antes de modificar cada archivo, lee su contenido real para ubicar las líneas exactas.
3. Ejecuta la verificación (`cd frontend && npm run lint`) tras cada tarea.
4. Realiza un commit individual de Git por cada tarea con el mensaje exacto especificado (en minúsculas, sin punto final). No agrupes varias tareas en un solo commit.
5. No modifiques ningún archivo fuera del alcance explícito de esta spec.
