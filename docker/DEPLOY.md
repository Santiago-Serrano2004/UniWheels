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

## 4. Cloudflare R2 (documentos de vehículo — reemplaza el disco local)

1. **R2 → Create bucket** (p. ej. `uniwheels-documentos`). 10GB gratis para
   siempre, sin costo de egreso.
2. **R2 → Manage API tokens → Create API token** con permisos de
   lectura/escritura sobre ese bucket. Copia el **Access Key ID**, **Secret
   Access Key**, y el **endpoint S3** que te muestra (formato
   `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`).
3. En `services/vehicle-service/.env.production` (paso 5): `PRIVATE_DOCS_DISK_DRIVER=s3`
   + esas 3 credenciales en `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` / `R2_ENDPOINT`.

## 5. Variables de entorno de producción

Crea `docker/.env` (para las variables que usa el propio `docker-compose.prod.yml`):

```bash
POSTGRES_PASSWORD=<contraseña fuerte nueva>
REDIS_PASSWORD=<contraseña fuerte nueva>
VITE_API_URL=https://<tu-dominio>/api/v1
VITE_VEHICLE_API_URL=https://<tu-dominio>/api/v1
VITE_ROUTE_API_URL=https://<tu-dominio>/api/v1
VITE_TOMTOM_API_KEY=<tu key real de TomTom>
VITE_SENTRY_DSN=<tu DSN real de Sentry, si lo activaste>
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
- `JWT_SECRET`: **el mismo valor exacto en los 5 servicios** (y en
  `ai-route-service`) — es un secreto compartido entre microservicios, no por
  servicio.
- Credenciales reales de Wompi (`WOMPI_*`), Sentry (`SENTRY_LARAVEL_DSN`) y,
  en `vehicle-service`, las `R2_*` del paso 4.

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

`docker/backup-postgres.sh` ya está en el repo — hace `pg_dumpall` comprimido
de las 5 bases de datos a `docker/backups/`, con 14 días de retención local.
Es un backup solo local: si querés protegerte también contra la pérdida del
disco de la VM entera, el siguiente paso natural es subir cada dump al mismo
bucket R2 del paso 4 (gratis hasta 10GB) — no está automatizado todavía, es
una mejora aparte cuando haya tráfico real que proteger.

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
