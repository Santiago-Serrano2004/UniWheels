# T1: CI en verde (GitHub Actions)

- **Rama base:** `pivote/b2b-sin-pagos`. Crea `pivote/t1-ci` y abre un PR contra la rama base.
- **Problema:** `.github/workflows/ci.yml` falla en todas las ejecuciones (`gh run list`): usa PHP 8.3 y los `composer.lock` exigen ≥ 8.4. Además prueba `frontend/`, que está congelado y no se despliega, y no prueba `mobile/`, `admin/` ni `landing/`.
- **Alcance:** solo `.github/workflows/ci.yml`. **No cambies código de la app** salvo que un test de CI falle por una causa real; en ese caso, **detente** y repórtalo, no lo "arregles" silenciando el test.

## Cambios
1. **PHP 8.4** en todos los jobs de Laravel (`laravel-sqlite-tests` y `route-matching-tests`).
2. **Matriz de Laravel:** confirma que incluye `auth-service`, `vehicle-service`, `trip-service` y `notification-service`. route-matching sigue en su job propio con PostGIS.
3. **Redis:** auth y trip usan Redis en los tests (suspensiones). Revisa que el servicio `redis` del job esté configurado y que las variables `REDIS_HOST`/`REDIS_PORT` lleguen a los tests.
4. **ai-route-service:**
   - usa **Python 3.12**, porque las dependencias lo exigen;
   - ejecuta `python -m pytest tests/ -q` (con `python -m`, para que encuentre el paquete `app`).
5. **Quita el job `frontend-build`**: `frontend/` está congelado.
6. **Agrega tres jobs de Node 20:**
   - `mobile-checks`: en `mobile/`, `npm ci`, `npm run lint` y `npx tsc --noEmit`. Lint con 0 errores; las advertencias se aceptan. Para `tsc`, si la base tiene errores preexistentes, usa `continue-on-error: true` en ese paso y déjalo documentado en un comentario del YAML.
   - `admin-build`: en `admin/`, `npm ci` y `npm run build`.
   - `landing-build`: en `landing/`, `npm ci` y `npm run build`.
7. Que la CI corra en `push` y `pull_request` contra `main` **y** contra `pivote/**`.

## Verificación (obligatoria)
- Haz push de la rama y observa la ejecución con `gh run watch` (o haciendo polling de `gh run list`). **Itera hasta que todos los jobs pasen.**
- Si un job falla dos veces por la **misma** causa, detente y documéntalo en el PR con el log relevante.
- En la descripción del PR: el link de la ejecución en verde y la lista de jobs con su tiempo.
