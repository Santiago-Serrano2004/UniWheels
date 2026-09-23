# Landing de UniWheels en uniwheels.org (y retiro de la app web de estudiantes)

**Documento:** `specs/web-landing.md`
**Fecha:** 2026-09-23
**Estado:** Aprobado por Santiago — en implementación

---

## Contexto mínimo (decidido, no repetir)

- El producto es la app móvil. Hoy en `https://uniwheels.org` se sirve la SPA de estudiantes (`frontend/`, congelada), desde el contenedor `frontend` de `docker/docker-compose.prod.yml` detrás de `gateway` (`gateway/nginx.prod.conf`).
- Santiago decidió: **retirar la SPA de estudiantes de producción**, poner una **landing informativa** en `uniwheels.org` hecha con **React + Vite con el diseño de la app**, y llevar el panel de administración a `admin.uniwheels.org` (spec aparte: `specs/admin-panel-v1.md`).
- **La API sigue en `https://uniwheels.org/api/v1`**, porque la usa la app móvil. Las rutas `/api/...` de `nginx.prod.conf` no cambian.
- El certificado de origen de Cloudflare ya cubre `uniwheels.org` y `*.uniwheels.org`.
- Marca: tokens en `frontend/src/styles/tokens.css` (Tailwind 4 `@theme`: `lochmara-*`, `brand-*`, `status-*`), logo animado en `frontend/src/components/common/AnimatedLogo.jsx` (variantes animada y `isStatic`), splash en `SplashScreen.jsx`. Guía de diseño: `.claude/skills/frontend-design-ux-ui` (cero emojis, íconos `lucide-react`, modo claro y oscuro).
- La app todavía **no está publicada** en las tiendas.

## Alcance

- Nuevo proyecto `landing/` (Vite + React 19 + Tailwind 4, las mismas versiones que `frontend/package.json`). Página única con anclas, sin backend.
- `frontend/` se queda en el repo sin cambios, pero deja de desplegarse. Si se decide borrarlo, va en otra tarea.
- Fuera de alcance: blog, CMS, formularios con backend, analítica.

## Contenido (en español, sin emojis)

1. **Hero**: logo animado (reutilizar `AnimatedLogo`), título "Viaja a la U con tu comunidad" y subtítulo sobre carpooling entre estudiantes y personal verificados de la UNAB. Botones: "Descargar la app" (badges App Store / Google Play en estado **"Próximamente"**, deshabilitados) y "Cómo funciona" (ancla).
2. **Cómo funciona**: dos columnas, Pasajero y Conductor, con 3 pasos cada una (registro con correo institucional → buscar o publicar ruta → viajar con PIN de abordaje).
3. **Modalidades**: Hacia el campus, Desde el campus, Entre sedes.
4. **Seguridad**: solo comunidad UNAB verificada por correo institucional; PIN de abordaje; botón SOS con ubicación en tiempo real; documentos del conductor (SOAT, licencia, tecnomecánica) revisados por Bienestar Universitario; tratamiento de datos según la Ley 1581 de 2012.
5. **Para conductores**: requisitos (vehículo, SOAT y licencia vigentes, tecnomecánica si aplica) y cómo se aprueba la solicitud.
6. **Preguntas frecuentes**: acordeón con 5 o 6 preguntas (quién puede usarla, cómo se paga, qué pasa si cancelo, cómo se protegen mis datos, cuándo sale en las tiendas).
7. **Footer**: marca, contacto (`uniwheelscontact@gmail.com`), enlace a la política de tratamiento de datos (sección o página propia; reutilizar el texto de Habeas Data de `mobile/src/components/HabeasDataModal.tsx` o del equivalente en `frontend/`, **sin inventar texto legal nuevo**) y el año.

Diseño: responsive mobile-first (sin scroll horizontal, gutter de 16 px en móvil), modo claro y oscuro con `prefers-color-scheme` y los mismos tokens, animaciones de entrada suaves con `framer-motion` (la web ya lo usa). Metadatos: `<title>`, descripción, Open Graph e ícono.

## Tareas

### Tarea 1 — Proyecto `landing/`

Scaffold Vite + React + Tailwind 4. Copiar `tokens.css` y el logo desde `frontend/` (no importar desde `frontend/`: se retira). `npm run build` genera `landing/dist`.

**Verificación**: `cd landing && npm run build` sin errores. Commit: `feat(landing): proyecto base con tokens y logo de la marca`.

### Tarea 2 — Secciones de contenido

Implementar las 7 secciones, con componentes chicos (menos de 300 líneas cada uno).

**Verificación**: build ok. Revisar en 390 px y 1280 px de ancho, en claro y en oscuro, con Playwright (ya está instalado en `frontend/node_modules`): screenshots a `/tmp`, **no** commitearlos. Commit: `feat(landing): secciones de contenido`.

### Tarea 3 — Imagen Docker de la landing

`docker/landing.Dockerfile`: multi-stage (node build → nginx:alpine con `landing/dist`), igual que la imagen actual de `frontend`. Revisar su Dockerfile como referencia.

**Verificación**: `docker build` local si hay Docker; si no, revisar el Dockerfile contra el de `frontend`. Commit: `build(landing): imagen Docker de la landing`.

### Tarea 4 — Enrutamiento en producción

- `docker/docker-compose.prod.yml`: nuevo servicio `landing` (red `uniwheels_net`). El servicio `frontend` sale del compose, y `gateway.depends_on` pasa a depender de `landing` en su lugar.
- `gateway/nginx.prod.conf`: upstream `landing` en lugar de `frontend_spa`; el `location /` del server de `uniwheels.org` apunta a `landing`. **No tocar** ningún `location /api/...` ni el mirror de Wompi. Actualizar `Content-Security-Policy` si la landing necesita algo nuevo (por ejemplo, fuentes).

**Verificación**: `nginx -t` en un contenedor `nginx:1.27-alpine` con la config (si hay Docker), o revisión manual. Commit: `feat(gateway): uniwheels.org sirve la landing y se retira la SPA de estudiantes`.

**El despliegue a la VM lo hace Claude**, no el implementador.
