# Backlog: Paridad Visual Mobile vs Web (Colores, Animación, Distribución)

**Documento:** `specs/mobile-paridad-09-paridad-visual.md`
**Fecha:** 2026-09-22
**Estado:** Backlog — no implementado, priorizado para cuando se retome

---

## Contexto mínimo (ya investigado, no repetir)

Las fases 00-08 auditaron paridad **funcional** (dinero, PIN, GPS, hooks, SOS, push). Esta fase audita paridad **visual/UX**: colores, animaciones, espaciado. Auditoría hecha 2026-09-22 comparando 4 pares de componentes reales (no supuestos):

- `frontend/src/components/common/SosEmergencyModal.jsx` vs `mobile/src/components/SosEmergencyModal.tsx`
- `frontend/src/components/trips/PassengerActiveTripCard.jsx` vs `mobile/src/components/PassengerActiveTripCard.tsx`
- `frontend/src/components/common/LiveTripIslandWidget.jsx` vs `mobile/src/components/LiveTripIslandWidget.tsx`
- `frontend/src/components/driver/DriverLiveNavigationCockpit.jsx` vs `mobile/src/components/driver/DriverCockpitCard.tsx`

**Ya verificado 1:1, NO es tarea de este backlog** — la animación de arranque (`frontend/src/components/common/SplashScreen.jsx` + `AnimatedLogo.jsx` vs `mobile/src/components/BrandedSplash.tsx` + `AnimatedUniWheelsLogo.tsx`) ya es una réplica fiel: mismos 20 paths SVG, mismos colores hex, mismos delays escalonados (0.1s a 1.54s), misma curva de easing de salida (`bezier(0.7,0,0.84,0)`), mismo spring de entrada de letras (`damping:14, stiffness:160`), mismo `durationMs=3600` (mobile lo trae como default del parámetro, web lo pasa explícito — mismo valor). Confirmado leyendo ambos archivos completos, no solo el resumen. El comentario en `AnimatedUniWheelsLogo.tsx` incluso documenta correctamente que el `pathLength` de framer-motion en la web no dibuja nada visible (los paths no tienen `stroke`) y que el efecto real es el fade por `opacity` — y mobile replica exactamente ese comportamiento real, no una versión "mejorada" que divergiría del original. No tocar este componente salvo que aparezca una regresión real.

## Alcance de esta v1 (explícitamente fuera de alcance)

- Wizard de registro de conductor y tab bar completo — no auditados a fondo, mismo patrón esperado por los 4 pares ya revisados pero sin confirmar.
- Diferencias de plataforma esperadas: `Modal` nativo de RN vs `createPortal` web, safe-area insets, status bar — no se igualan, son correctas tal como están.
- Subir `mobile`'s Tailwind de v3 a v4 — no viable, NativeWind (Expo SDK 54) no lo soporta todavía.

## Hallazgos de Investigación (ya investigado)

1. **Colores custom (`lochmara`/`brand`/`status`) — ya sincronizados, sin trabajo.** Definidos en `frontend/src/styles/tokens.css` (Tailwind v4 `@theme`) y `mobile/tailwind.config.js` (`theme.extend.colors`), hex idénticos carácter por carácter.
2. **Colores default de Tailwind (`rose`, `amber`, `emerald`) — desalineados por versión.** Web usa `tailwindcss@^4.3.3` (paleta default migrada a OKLCH), mobile usa `tailwindcss@^3.4.19` vía NativeWind (paleta default RGB clásica). Verificado con las librerías instaladas de cada lado:
   - `rose-500`: web `#ff2056` vs mobile `#f43f5e`
   - `amber-400`: web `#ffb900` vs mobile `#fbbf24`
   - `emerald-600`: web `#009966` vs mobile `#059669`

   Estos 3 colores dominan la UI de SOS, estados de viaje y advertencias — cualquier componente que use `bg-rose-500`, `text-amber-300`, etc. (clase de Tailwind, no hex inline) diverge visualmente entre plataformas.
3. **Animación — la web anima casi todo, mobile casi nada (fuera del splash, que ya está bien).**
   - `PassengerActiveTripCard`: web anima `initial={{opacity:0,scale:0.96}} → animate={{opacity:1,scale:1}}` (framer-motion). Mobile: sin animación, aparece instantáneo.
   - `DriverCockpitCard` (modal de PIN) y `SosEmergencyModal`: web anima `scale:0.9→1 / 0.92→1, opacity:0→1` con curvas custom (`transition:{duration:0.22, ease:[0.16,1,0.3,1]}` en el caso de SOS). Mobile usa `<Modal animationType="fade">` de RN puro, que solo anima opacidad — no hay scale ni la curva de easing custom.
   - `LiveTripIslandWidget`: único componente con animación real en mobile (`useSharedValue`+`withTiming`, pulso de opacidad 800ms↔800ms). Pero el timing no coincide: web usa `type:'spring', stiffness:400, damping:30` para la entrada y `duration:2.0, ease:'easeInOut'` para el pulso; mobile usa un pulso lineal de 1.6s total sin spring de entrada.
4. **Espaciado / border-radius — sin problema real.** Mismos radios (`2xl`/`3xl`/`full`/`lg`/`xl`) y mismas escalas de padding/gap en el par más grande comparado (SOS modal). Diferencia mínima de `p-3` (web) vs `p-3.5` (mobile), plausiblemente intencional por área táctil — no tocar.

## Tareas

### Tarea 1 — Fijar `rose`/`amber`/`emerald` como colores custom en `mobile/tailwind.config.js`

Igual que ya se hizo con `lochmara`/`brand`/`status`: agregar `rose`, `amber`, `emerald` a `theme.extend.colors` en `mobile/tailwind.config.js` con los valores hex reales que compila Tailwind v4 en la web (no los defaults de Tailwind v3), para que ambas plataformas rendericen el mismo color pese a la diferencia de versión.

**Antes de implementar**: extraer la rampa completa (50-950, no solo los 3 tonos ya verificados) de cada familia desde el CSS compilado real de `frontend` (`npm run build` y grep del hex en el bundle, o inspeccionar `tailwindcss/theme.css` de la versión instalada en `frontend/node_modules`) — no adivinar valores OKLCH→hex a mano para los tonos no verificados.

**Verificación**: los 3 valores ya confirmados (`rose-500:#ff2056`, `amber-400:#ffb900`, `emerald-600:#009966`) deben coincidir exactamente en el config nuevo. `cd mobile && npx tsc --noEmit && npm run lint` sin errores nuevos.

### Tarea 2 — Animar entrada de `mobile/src/components/PassengerActiveTripCard.tsx`

Instrumentar con `react-native-reanimated` (ya es dependencia del proyecto, usado en `LiveTripIslandWidget.tsx` y `BrandedSplash.tsx` como referencia de patrón) una animación de entrada `opacity:0→1, scale:0.96→1`, replicando `frontend/src/components/trips/PassengerActiveTripCard.jsx`.

**Verificación**: matriz de verificación de comportamiento de `specs/mobile-paridad-00-metodologia-verificacion.md` — los valores de opacity/scale inicial y final deben coincidir con la referencia web. `cd mobile && npx tsc --noEmit && npm run lint` sin errores nuevos.

### Tarea 3 — Reemplazar el fade plano del `Modal` de RN en `DriverCockpitCard.tsx` y `SosEmergencyModal.tsx`

Envolver el contenido interno de ambos modales en una vista animada con Reanimated (`scale:0.9→1` o `0.92→1` según el original, `opacity:0→1`, curva `Easing.bezier(0.16,1,0.3,1)` para entrada), controlada manualmente en paralelo al `<Modal animationType="fade">` (que se deja tal cual para el fondo/backdrop nativo — no hay que reemplazar el `Modal` en sí, solo animar su contenido).

**Verificación**: duración y curva de easing deben coincidir con `frontend/src/components/common/SosEmergencyModal.jsx` (`duration:0.22, ease:[0.16,1,0.3,1]`) y el modal de PIN en `frontend/src/components/driver/DriverLiveNavigationCockpit.jsx`. `cd mobile && npx tsc --noEmit && npm run lint` sin errores nuevos.

### Tarea 4 — Ajustar timing de `mobile/src/components/LiveTripIslandWidget.tsx` al de la web

Cambiar el pulso lineal actual (1.6s total) por: entrada con spring (`stiffness:400, damping:30`, vía `withSpring` de Reanimated) y pulso continuo con `duration:2000ms` y easing `Easing.inOut(Easing.ease)` (en vez del lineal actual), replicando `frontend/src/components/common/LiveTripIslandWidget.jsx`.

**Verificación**: los parámetros de spring y la duración del pulso deben coincidir numéricamente con los de la referencia web. `cd mobile && npx tsc --noEmit && npm run lint` sin errores nuevos.

---

## Notas de secuenciación

- Tareas 2-4 no dependen entre sí ni de la Tarea 1 — se pueden hacer en cualquier orden o en paralelo.
- Cada tarea es un commit individual, siguiendo el patrón ya establecido en las fases 01-08.
- Ninguna de estas tareas toca backend ni infraestructura desplegada — solo `mobile/` y `mobile/tailwind.config.js`, sin riesgo de producción.
