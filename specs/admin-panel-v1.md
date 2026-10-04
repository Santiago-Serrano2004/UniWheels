> **Nota (2026-10-05):** los pagos, la billetera y Wompi fueron eliminados del producto. Ver `docs/adr/0001-pivote-b2b-sin-pagos.md` y `specs/pivote-b2b-sin-pagos.md`.

# Panel de administración v1 en admin.uniwheels.org

**Documento:** `specs/admin-panel-v1.md`
**Fecha:** 2026-09-23
**Estado:** Aprobado por Santiago — se implementa después de `specs/admin-backend-v1.md`
**Depende de:** `specs/admin-backend-v1.md` (endpoints `/api/v1/admin/...`) y `specs/web-landing.md` (retiro de la SPA de estudiantes).

---

## Contexto mínimo (decidido, no repetir)

- El panel es para el personal de Bienestar Universitario (rol `administrador`). Cuenta creada en producción: `uniwheels@gmail.com`.
- Vive en **`admin.uniwheels.org`**. El certificado de origen de Cloudflare ya cubre `*.uniwheels.org`. Santiago agrega en Cloudflare DNS un registro `A admin → 68.155.150.69`, proxied.
- **Mismo origen para la API**: el server block de `admin.uniwheels.org` en nginx también enruta `/api/...` a los mismos upstreams que `uniwheels.org`, para no depender de CORS. Hay que extraer las locations `/api` a un archivo incluido por los dos server blocks (`gateway/api-locations.conf`), sin cambiar su contenido ni su orden, incluido el mirror de Wompi.
- La base existente es `frontend/src/components/admin/AdminVehicleReviewView.jsx` (lista de vehículos, visor de documentos vía `fetchDocumentBlob`, verificar o rechazar documentos con notas). También sirve `frontend/src/services/api.js`, que tiene login, refresh del token y las llamadas de vehículos.
- Diseño: los mismos tokens (`frontend/src/styles/tokens.css`), el logo, cero emojis, `lucide-react`, modo claro y oscuro. Es una herramienta de escritorio (la ergonomía que justificó el ADR 07), pero tiene que poder usarse desde un celular.

## Alcance

- Nuevo proyecto `admin/` (Vite + React 19 + Tailwind 4 + react-router), independiente de `frontend/`: copiar lo que se reutilice, **no importar** de `frontend/`.
- Fuera de alcance: métricas y gráficos (fase 4), edición de datos de usuarios, reembolsos.

## Tareas

### Tarea 1 — Proyecto `admin/`, login y layout

- Login con correo y contraseña contra `/api/v1/auth/login`. Si el usuario no tiene rol `administrador` → mensaje "Esta cuenta no tiene acceso al panel" y no se guarda la sesión. El token va en memoria y en `sessionStorage` (no `localStorage`), con refresh como en `frontend/src/services/api.js`. Logout.
- Layout: barra lateral (en móvil se colapsa en un menú) con Vehículos, Alertas SOS, Usuarios, Viajes y Pagos, y un indicador con el número de alertas SOS pendientes. Rutas protegidas.
- Cliente API con base relativa `/api/v1` (mismo origen). Nombres de usuario resueltos con `POST /api/v1/admin/users/lookup`, cacheados en memoria.

**Verificación**: `npm run build`. Commit: `feat(admin): proyecto base, login solo para administradores y layout`.

### Tarea 2 — Vehículos

- Lista con filtro por estado (pendiente por defecto), búsqueda por placa y paginación.
- Detalle en `/vehiculos/:id` (es la URL a la que lleva el correo): datos del vehículo y del dueño, y los documentos con su visor. Imagen en `<img>`; PDF en un visor embebido (`<object>`/`<iframe>` con un blob URL) con opción de descargar. Número y vencimiento de cada documento, con alerta si está por vencer o vencido.
- Botones Verificar / Rechazar (con nota obligatoria) por documento. El estado del vehículo se actualiza solo (lo calcula el backend) y se muestra.
- Reutilizar lo que sirva de `AdminVehicleReviewView.jsx`.

**Verificación**: build. Commit: `feat(admin): revision de vehiculos y documentos`.

### Tarea 3 — Alertas SOS

- Lista pendientes / atendidas, de la más reciente a la más antigua: hora, conductor, pasajero, placa, dirección del viaje, estado del viaje, y la ubicación con un link a Google Maps y un mapa chico (Leaflet con las capas de `mapTileProviders`).
- "Marcar como atendida" con notas. Consulta cada 30 s mientras la vista está abierta. Resaltado visual de las pendientes.

**Verificación**: build. Commit: `feat(admin): alertas SOS`.

### Tarea 4 — Usuarios

- Lista con búsqueda (nombre, correo, código) y filtros (rol, activo). Detalle con reputación, billetera, vehículos (`GET /api/v1/admin/vehicles?search=` por dueño si el backend lo permite; si no, omitir) e historial de suspensiones.
- Suspender (motivo obligatorio, con confirmación) y reactivar. El botón no aparece para administradores.

**Verificación**: build. Commit: `feat(admin): gestion y suspension de usuarios`.

### Tarea 5 — Viajes y pagos

- Viajes: lista con filtros de estado y fechas.
- Pagos: dos pestañas, "Pagos de viajes" (con los totales del período) y "Recargas de billetera". Solo lectura, montos en COP con formato colombiano.

**Verificación**: build. Commit: `feat(admin): consulta de viajes y pagos`.

### Tarea 6 — Despliegue: imagen y nginx

- `docker/admin.Dockerfile` (multi-stage → nginx:alpine con `admin/dist` y fallback de SPA a `index.html`).
- `docker/docker-compose.prod.yml`: servicio `admin`.
- `gateway/nginx.prod.conf`: extraer las locations de `/api` a `gateway/api-locations.conf` (con `include` en los dos servers), y agregar el server `admin.uniwheels.org` (443, mismos certificados y headers de seguridad; `location /` → upstream `admin`). Agregar `admin.uniwheels.org` al redirect 80 → 443. Montar el nuevo archivo en el volumen del gateway.

**Verificación**: `nginx -t` con Docker si hay, o revisión manual cuidadosa de que las locations de `/api` quedan idénticas. Commit: `feat(gateway): server de admin.uniwheels.org con la API en el mismo origen`.

**El despliegue a la VM lo hace Claude.**
