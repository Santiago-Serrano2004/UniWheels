# UniWheels — Guía de Despliegue a Producción ($0/mes)

Stack: **Oracle Cloud "Always Free" (VM Ampere A1, 2 OCPU/12GB)** + **Cloudflare**
(proxy, TLS, CDN) + **Cloudflare R2** (documentos de vehículo). Todo corre con
`docker/docker-compose.prod.yml`, que containeriza los 6 microservicios y el
frontend (a diferencia del flujo de desarrollo de `./uniwheels`, que los corre
directo en el host).

Los pasos de creación de cuentas/DNS son tuyos — requieren verificación de
identidad/clics en paneles web que no puedo hacer por ti. Todo lo demás
(Dockerfiles, compose, Nginx, driver de almacenamiento) ya está listo en el repo.

---

## 1. Provisionar la VM (Oracle Cloud)

1. Crea una cuenta en [cloud.oracle.com](https://cloud.oracle.com) (pide tarjeta
   para verificar identidad — el tier "Always Free" no cobra mientras te quedes
   dentro de sus límites).
2. **Compute → Instances → Create Instance**:
   - Imagen: **Canonical Ubuntu 24.04** (arm64).
   - Shape: **VM.Standard.A1.Flex** — Always Free permite hasta 2 OCPU / 12GB
     total (Oracle redujo este límite a la mitad en junio de 2026; sigue siendo
     suficiente para este stack a escala de piloto universitario).
   - Si te da "Out of host capacity": es un problema conocido y frecuente del
     shape ARM Always Free — reintenta en otra disponibilidad (AD) de la misma
     región, o en otra región, hasta que tome.
3. **Networking → Security List** de la VCN: abre el puerto **80/TCP** entrante
   (y **443/TCP** si más adelante activas TLS "Full" — ver paso 4). Puerto 22
   (SSH) ya viene abierto por defecto solo para tu IP de gestión.
4. Anota la **IP pública** de la instancia — la necesitas en el paso 3.

## 2. Preparar la VM

```bash
ssh ubuntu@<IP_PUBLICA>

sudo apt update && sudo apt install -y docker.io docker-compose-plugin git
sudo usermod -aG docker $USER && newgrp docker

git clone <URL_DE_TU_REPO> uniwheels
cd uniwheels
```

## 3. Cloudflare (dominio real + HTTPS gratis)

1. **Dominio**: la opción ideal y gratuita es pedirle a Bienestar/Sistemas de la
   UNAB un subdominio delegado, p. ej. `uniwheels.unab.edu.co` (ya está
   referenciado como placeholder en `gateway/nginx.prod.conf`). Si no es viable
   a corto plazo, un dominio propio cuesta ~$10 USD/año (Cloudflare Registrar,
   Namecheap, etc.) — evita los dominios "gratis" tipo `.tk`/`.ml`, tienen mala
   reputación y algunos navegadores/ISPs los bloquean.
2. Crea una cuenta gratis en [cloudflare.com](https://dash.cloudflare.com),
   añade el dominio, y actualiza los nameservers donde lo compraste (o pide a
   Sistemas UNAB que delegue el subdominio a los nameservers de Cloudflare).
3. **DNS → Add record**: tipo `A`, nombre `uniwheels` (o `@` si es dominio raíz),
   valor = la IP pública de la VM, **proxy activado** (nube naranja).
4. **SSL/TLS → Overview**: modo **Full** (recomendado, no mucho más esfuerzo que
   "Flexible" y cifra también el tramo Cloudflare→VM):
   - **SSL/TLS → Origin Server → Create Certificate** → copia el certificado y
     la llave privada que te da Cloudflare (válido 15 años, gratis, solo
     Cloudflare confía en él — no sirve para nada más).
   - En la VM: guarda ambos en `gateway/certs/origin.crt` y `gateway/certs/origin.key`.
   - Descomenta el bloque `server { listen 443 ssl; ... }` en
     `gateway/nginx.prod.conf`, apunta `ssl_certificate`/`ssl_certificate_key` a
     esas rutas, agrega `return 301 https://$host$request_uri;` en el bloque de
     `listen 80`, y monta `./certs:/etc/nginx/certs:ro` + el puerto `443:443`
     en el servicio `gateway` de `docker-compose.prod.yml`.
   - Si prefieres arrancar más simple: deja el modo **Flexible** y el gateway en
     solo puerto 80 tal como está — el candado en el navegador sigue siendo
     real, solo que el tramo Cloudflare→VM queda sin cifrar (aceptable para un
     piloto, no ideal a largo plazo).

## 4. Cloudflare R2

### 4a. Bucket de documentos vehiculares (reemplaza el disco local)
1. **R2 → Create bucket** (p. ej. `uniwheels-documentos`). 10GB gratis para
   siempre, sin costo de egreso.
2. **R2 → Manage API tokens → Create API token** con permisos de
   lectura/escritura sobre ese bucket específico. Copia el **Access Key ID**, **Secret
   Access Key**, y el **endpoint S3** que te muestra (formato
   `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`).
3. En `services/vehicle-service/.env.production` (paso 5): `PRIVATE_DOCS_DISK_DRIVER=s3`
   + esas credenciales en `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` / `R2_ENDPOINT`.

### 4b. Bucket SEPARADO para backups de base de datos (Offsite Disaster Recovery)
1. **R2 → Create bucket** (p. ej. `uniwheels-backups-db`).
   > **IMPORTANTE**: No reutilizar el bucket de documentos de vehículo para los backups de la base de datos. Separar los buckets garantiza el principio de mínimo privilegio (el microservicio de vehículos no puede leer ni borrar backups de la DB), permite políticas de cifrado y retención independientes (ej. purga automática de dumps >30 días en R2), y evita mezclar datos operativos con respaldos del sistema.
2. **R2 → Manage API tokens → Create API token** con permisos exclusivos sobre el bucket `uniwheels-backups-db`.
3. En `docker/.env`:
   ```bash
   R2_BACKUPS_BUCKET=uniwheels-backups-db
   R2_BACKUPS_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
   R2_BACKUPS_ACCESS_KEY_ID=<token-id-backups>
   R2_BACKUPS_SECRET_ACCESS_KEY=<token-secret-backups>
   ```

## 5. Variables de entorno de producción

Crea `docker/.env` (para las variables que usa el propio `docker-compose.prod.yml` y los scripts de backup/restore):

```bash
POSTGRES_PASSWORD=<contraseña fuerte nueva>
REDIS_PASSWORD=<contraseña fuerte nueva>
VITE_API_URL=https://<tu-dominio>/api/v1
VITE_VEHICLE_API_URL=https://<tu-dominio>/api/v1
VITE_ROUTE_API_URL=https://<tu-dominio>/api/v1
VITE_TOMTOM_API_KEY=<tu key real de TomTom>
VITE_SENTRY_DSN=<tu DSN real de Sentry, si lo activaste>
R2_BACKUPS_BUCKET=uniwheels-backups-db
R2_BACKUPS_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_BACKUPS_ACCESS_KEY_ID=<tu-access-key-backups>
R2_BACKUPS_SECRET_ACCESS_KEY=<tu-secret-key-backups>
```

Para cada uno de los 5 servicios Laravel, copia su `.env.example` a
`.env.production` y ajusta:
- `APP_ENV=production`, `APP_DEBUG=false`.
- `DB_HOST=postgres_gis` (nombre del servicio, no `127.0.0.1`).
- `REDIS_HOST=redis`, `REDIS_PASSWORD=` (igual al de `docker/.env`).
- Las URLs entre servicios (`AUTH_SERVICE_URL`, `ROUTE_MATCHING_SERVICE_URL`,
  `VEHICLE_SERVICE_URL`, `AI_ROUTE_SERVICE_URL`, `TRIP_SERVICE_URL`) deben usar
  el nombre del servicio Docker en vez de `127.0.0.1`, p. ej.
  `AUTH_SERVICE_URL=http://auth-service:8001`.
  **`docker-compose.prod.yml` ya las fija en `environment`** (tienen prioridad
  sobre `.env.production`), así un `.env.production` incompleto no deja a un
  servicio apuntando a `127.0.0.1`: auth-service (`VEHICLE_`, `ROUTE_MATCHING_`,
  `TRIP_` y `NOTIFICATION_SERVICE_URL`), notification-service (`AUTH_` y
  `TRIP_SERVICE_URL`), route-matching-service (`AUTH_`, `VEHICLE_`,
  `AI_ROUTE_SERVICE_URL` y `OSRM_BACKEND_URL`) y trip-service (`AUTH_` y
  `ROUTE_MATCHING_SERVICE_URL`). `python3 scripts/check_compose_service_urls.py`
  (corre en la CI) falla si un servicio lee una `*_URL` que el compose no define.
- `JWT_SECRET`: **el mismo valor exacto en los 5 servicios** (y en
  `ai-route-service`) — es un secreto compartido entre microservicios, no por
  servicio.
- Credenciales reales de Sentry (`SENTRY_LARAVEL_DSN`) y, en `vehicle-service`,
  las `R2_*` del paso 4a. UniWheels no procesa pagos: no hay credenciales de
  pasarela de pago (ADR 0001).
- **`trip-service`** necesita `AUTH_SERVICE_URL` (le pide a auth-service la
  suspensión automática por cancelaciones tardías) y acepta
  `LATE_CANCEL_THRESHOLD` (3), `LATE_CANCEL_WINDOW_DAYS` (30) y
  `LATE_CANCEL_SUSPENSION_DAYS` (30). `docker-compose.prod.yml` ya los define
  con esos valores por defecto; para cambiarlos, ponlos en `docker/.env`.
- **`route-matching-service`** acepta `CONTRIBUTION_CAR_BASE` (2000),
  `CONTRIBUTION_CAR_PER_KM` (400), `CONTRIBUTION_MOTO_BASE` (1000) y
  `CONTRIBUTION_MOTO_PER_KM` (250): fórmula del aporte sugerido
  (`base + km × valor_por_km`, redondeado hacia arriba a la centena). También
  tienen esos valores por defecto en `docker-compose.prod.yml`.

Para `ai-route-service`, copia igual su `.env.example` a `.env.production` y
ajusta `TRIP_SERVICE_URL=http://trip-service:8004`.

## 6. Primer arranque

```bash
cd uniwheels/docker
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

# Seeders una sola vez (roles + instituciones) — las migraciones ya corren
# automáticamente al arrancar cada contenedor (ver php-service.Dockerfile).
docker compose -f docker-compose.prod.yml exec auth-service php artisan db:seed --class=RoleSeeder --force
docker compose -f docker-compose.prod.yml exec auth-service php artisan db:seed --class=InstitutionSeeder --force
```

Verifica: `curl -I http://localhost/api/v1/auth/../up` desde la VM, y
`https://<tu-dominio>` desde tu navegador.

## 7. Uptime Kuma

Ya viene incluido en el compose, puerto `3001`. Entra a
`http://<IP_PUBLICA>:3001` (o crea un registro DNS interno si prefieres no
exponerlo públicamente), crea el usuario admin la primera vez, y agrega un
monitor HTTP por cada `/up` de los 5 servicios Laravel + `/health` de
ai-route-service + el dominio público.

## 8. Backups de la base de datos

El volumen `postgres_data` protege de un reinicio del contenedor, no de un
disco corrupto, un `docker compose down -v` accidental, ni de borrar algo por
error en producción. Configura un backup diario en el HOST (no dentro de un
contenedor, para que sobreviva a que se recree el de Postgres):

```bash
crontab -e
# agregar:
0 3 * * * /home/ubuntu/uniwheels/docker/backup-postgres.sh >> /home/ubuntu/uniwheels/docker/backups/backup.log 2>&1
```

`docker/backup-postgres.sh` hace `pg_dumpall` comprimido de las 5 bases de datos a `docker/backups/`, mantiene 14 días de retención local y, si `R2_BACKUPS_BUCKET` está configurado en `docker/.env`, sube automáticamente cada dump a Cloudflare R2 en el bucket dedicado configurado en el paso 4b.

## 9. Nota: listo para una futura app React Native

Este despliegue ya sirve sin cambios para el ítem de backlog "App Móvil Nativa"
del documento de especificación: la app solo necesitaría apuntar a
`https://<tu-dominio>/api/v1/...`, el mismo contrato que ya consume la SPA. Lo
único que **no** está cubierto todavía es el canal de notificaciones push:
`notification-service` hoy solo entrega Web Push (navegador). Una app React
Native necesitaría un canal adicional vía Firebase Cloud Messaging/APNs — tarea
separada para cuando ese desarrollo arranque, no bloquea nada de este despliegue.

## Escalar más adelante

Todo esto es Docker Compose corriendo en una VM — si el tráfico real supera lo
que da la VM gratis, migrar es mover el mismo `docker-compose.prod.yml` a una
VPS de pago (Hetzner ~$4-5 USD/mes por 2vCPU/4GB, DigitalOcean, o un shape
pago de la propia Oracle) sin rediseñar nada. El siguiente escalón después de
eso (separar cada microservicio a su propio host, balanceo de carga) es un
proyecto aparte, no algo que este stack necesite ahora.
