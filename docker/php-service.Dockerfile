# Dockerfile de producción genérico para los 5 microservicios Laravel
# (auth-service, vehicle-service, route-matching-service, trip-service,
# notification-service) — todos son PHP 8.4+ / Laravel 13 con la misma forma
# (composer.json pide ^8.3, pero el árbol de dependencias real -symfony 8.1 vía
# laravel/framework 13.25- ya exige 8.4.1+; verificado tratando de construir
# contra 8.3 y viendo el conflicto real de Composer antes de fijar esta versión).
# Se referencia una sola vez desde docker-compose.prod.yml con distinto
# `context` por servicio, en vez de mantener 5 Dockerfiles casi idénticos.
#
# Deliberadamente NO usa php-fpm + nginx separados: a la escala actual (MVP
# universitario, ~3.000 DAU estimados en el propio documento de arquitectura)
# `php artisan serve` en un contenedor por servicio es más simple de operar y
# usa menos RAM que 5 pools de FPM en una VM de 12GB compartida — el mismo
# comando que ya corre en desarrollo, solo containerizado. Si el tráfico real
# lo exige más adelante, migrar a FPM+Nginx por servicio es un cambio
# localizado a este archivo, no una reescritura del proyecto.
FROM docker.io/library/composer:2 AS composer_bin

FROM docker.io/library/php:8.4-cli-alpine

RUN apk add --no-cache postgresql-dev libzip-dev icu-dev \
    && docker-php-ext-install pdo pdo_pgsql pgsql bcmath intl zip

COPY --from=composer_bin /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copiar solo los manifiestos primero para aprovechar la caché de capas de Docker
# en rebuilds donde el código cambió pero las dependencias no.
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-progress --optimize-autoloader --no-scripts

COPY . .
RUN composer run-script post-autoload-dump --no-interaction \
    && php artisan config:clear \
    && chown -R www-data:www-data storage bootstrap/cache

ARG SERVICE_PORT=8000
ENV SERVICE_PORT=${SERVICE_PORT}
EXPOSE ${SERVICE_PORT}

USER www-data

# Migraciones + arranque en un solo entrypoint: cada servicio aplica sus propias
# migraciones contra su propia base de datos al iniciar (patrón database-per-service
# ya usado en desarrollo vía `php artisan migrate --force`).
#
# El loop de `schedule:run` cada 60s reemplaza a un cron/supervisor real —
# mismo criterio de simplicidad que el resto del archivo. Si un servicio no
# define tareas en routes/console.php, el comando simplemente no hace nada
# cada minuto (costo despreciable). Corre en background para no bloquear el
# proceso principal (`php artisan serve`), que sigue siendo el PID 1 del
# contenedor.
CMD php artisan migrate --force \
    && (while true; do php artisan schedule:run >> /dev/null 2>&1; sleep 60; done &) \
    && php artisan serve --host=0.0.0.0 --port=${SERVICE_PORT}
