---
description: Scaffold de un microservicio Laravel siguiendo la convencion del monorepo UniWheels
---
Crea un nuevo microservicio Laravel para: $ARGUMENTS

Primero pregunta (si no está en $ARGUMENTS): nombre del servicio (`<x>-service`) y puerto libre (los usados: 8001-8006).

Luego, siguiendo EXACTAMENTE el patrón de `services/auth-service` y la skill `laravel-microservices`:
1. `composer create-project laravel/laravel services/<nombre>` (Laravel 13, PHP 8.3).
2. Añade dependencias que usan todos: `laravel/sanctum`, `firebase/php-jwt`, `predis/predis`, `sentry/sentry-laravel`, `spatie/laravel-permission`; dev: `pestphp/pest`, `laravel/pint`, `nunomaduro/collision`.
3. Copia y adapta de auth-service: config de JWT (mismo secreto compartido, este servicio es consumidor, no emisor), middleware de auth, estructura `app/Services` + `app/Http/Requests`, respuesta estándar `{ success, data, message }`, `.env.example`.
4. Registra el servicio en:
   - `./uniwheels` (array `SERVICES`, con nombre:puerto:ruta:comando).
   - `.github/workflows/ci.yml` (matriz `laravel-sqlite-tests` salvo que necesite PostGIS → job propio como `route-matching`).
   - `docker/docker-compose.yml` si lleva contenedor.
5. Un test Pest de humo que compruebe que `/up` responde y que un endpoint protegido exige JWT.
6. `./vendor/bin/pint` sobre lo generado.

No implementes lógica de negocio: deja el esqueleto listo y en verde. Resume qué archivos tocaste fuera del servicio nuevo.
