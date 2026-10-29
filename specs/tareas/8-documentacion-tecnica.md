# Fase 8: documentación técnica sin pagos

- **Rama base:** `pivote/b2b-sin-pagos`. Crea `pivote/8-documentacion` y abre **un solo PR** contra la rama base.
- **Alcance:** solo archivos `.md` (y `CLAUDE.md` del repo). **No toques código.**
- **Fuente de verdad, léela primero:**
  - `docs/adr/0001-pivote-b2b-sin-pagos.md`
  - `docs/REGLAS_DE_NEGOCIO_Y_TARIFAS.md`
  - `specs/pivote-b2b-sin-pagos.md`
  - el código actual: si un doc describe algo, verifícalo contra el código antes de escribirlo.
- **Estilo:** cada doc conserva su idioma actual (el `README.md` raíz está en inglés; el resto, en español). Cero emojis nuevos. **No inventes funciones**: si algo no existe en el código, no lo documentes.

## 1. `README.md` (raíz, inglés)
- Quita la viñeta "Payments with Wompi…" (≈ l. 16), el nodo `W[Wompi]` y su arista en el diagrama mermaid (≈ l. 43) y "Wompi (payments)" de Integrations (≈ l. 69).
- Tabla de servicios (≈ l. 49–52): en auth-service quita "wallet"; en trip-service quita las menciones a pagos y comisión y agrega "late-cancellation tracking with automatic 30-day suspension".
- Agrega un párrafo corto **"Business model"**: B2B for universities; the platform never processes payments; drivers set a per-seat contribution capped by a suggested value (car COP 2,000 + 400/km, motorcycle COP 1,000 + 250/km), paid directly between users. Enlaza el ADR 0001.
- Si se mencionan los tests, actualiza los conteos solo si los puedes verificar contando en el código. Si no, no toques los números.

## 2. `docs/ARQUITECTURA_BASE_DE_DATOS.md`
- `auth_db` (≈ l. 10): quita "Billeteras Prepago" y agrega "suspensiones (suspended_until, bitácora)".
- Elimina la sección "Tablas: `user_wallets` y `wallet_transactions`" completa (≈ l. 35–38).
- Agrega a auth-service: `users.suspended_until` y `user_suspension_logs`, con `admin_user_id` nullable para las acciones automáticas (`auto_suspended`, `auto_reactivated`).
- En `trips` (≈ l. 81): deja `total_fare_cop` ("aporte acordado, se paga fuera de la plataforma") y quita `driver_amount_cop`, `platform_commission_cop` y `commission_status`. Quita también `payment_method`, `payment_confirmed_at` y `payment_reference` si aparecen.
- En `routes` (route-matching): documenta `base_contribution_cop` (aporte indicado por el conductor, 0..sugerido), `distance_km` y `suggested_contribution_cop`.
- En `trip_cancellations`: `had_penalty` significa "cancelación tardía".
- Quita cualquier tabla de Wompi (`wompi_webhook_events`).
- Si el doc dice "Perfil UNAB" u otras referencias a una universidad concreta, cámbialas por "perfil institucional".

## 3. `mobile/README.md`
- Quita el bloque "Pasarela de Pagos Wompi" y `EXPO_PUBLIC_WOMPI_PUBLIC_KEY` (≈ l. 47–48).
- Verifica la lista de variables `EXPO_PUBLIC_*` contra `mobile/src/lib/env.ts` y déjala igual al código.
- Si el README dice "SDK 54", corrígelo a SDK 57.

## 4. READMEs de servicios
- **`services/auth-service/README.md`:**
  - el título pasa a "Microservicio de Autenticación y Usuarios (auth-service)";
  - quita las billeteras (l. 3 y 12) y "saldo de billetera" de `/auth/me` (l. 24);
  - documenta el endpoint interno `POST /api/v1/internal/users/{id}/late-cancellation-suspension` (solo `jwt.service`) y el levantamiento perezoso de suspensiones vencidas.
- **`services/trip-service/README.md`:**
  - quita "Trazabilidad de comisiones… billetera" (l. 9);
  - documenta la política de cancelaciones tardías (3 en 30 días → 30 días de suspensión, configurable con `LATE_CANCEL_*`);
  - indica que `total_fare_cop` debe ser igual al aporte de la ruta.
- **`services/route-matching-service/README.md`** (si existe): documenta `GET /routes/contribution-suggestion`, el tope al publicar y las variables `CONTRIBUTION_*`. Si no existe el archivo, **no lo crees**.
- **`services/notification-service/README.md`:** quita "avisos de saldo en billetera" (l. 10).

## 5. `docker/DEPLOY.md`
- Las líneas ≈197–198 hablan de "VPS de pago" (hosting), **no** de pagos de usuarios: **déjalas**.
- Solo revisa que no queden instrucciones de Wompi. Ya se limpió en la 3.8.

## 6. `CLAUDE.md` del repo (`UniWheels/CLAUDE.md`)
- Tabla del mapa: `mobile/` pasa a "Expo SDK 57"; `frontend/` se marca como "**congelado** (no se agregan funciones; la app móvil es el producto)".
- En comandos de mobile: "Expo SDK 54 está fijado" pasa a "Expo SDK 57 está fijado".
- Agrega `admin/` (panel de Bienestar, React + Vite) y `landing/` (React + Vite) a la tabla, si no están.
- Sección "Trabajo actual": rama `pivote/b2b-sin-pagos`, pivote a B2B sin pagos (ver `specs/pivote-b2b-sin-pagos.md`).
- No cambies nada más de ese archivo.

## 7. Specs antiguas
Agrega **al inicio** (primera línea, antes del título) esta nota, **sin tocar el resto**, en:
- `specs/admin-backend-v1.md`, `specs/admin-panel-v1.md`, `specs/web-landing.md`, `specs/mobile-sdk-57-migracion.md`, `specs/mobile-mapa-leaflet-webview.md`;
- y todos los `specs/mobile-paridad-0*.md` que mencionen pagos, billetera o Wompi.

```
> **Nota (2026-10-05):** los pagos, la billetera y Wompi fueron eliminados del producto. Ver `docs/adr/0001-pivote-b2b-sin-pagos.md` y `specs/pivote-b2b-sin-pagos.md`.
```

## Verificación
1. `grep -rliE "wompi|wallet|billetera|recarga|comisi|commission" --include=*.md .`, excluyendo `node_modules`, `vendor`, `.venv`, `tesis/`, `graphify-out/`, `specs/` y `docs/adr/`: **sin resultados**.
2. Ningún archivo de código modificado: `git diff --stat` debe mostrar solo `.md`.
3. Commits por bloque (`docs: ...`).
4. Si algo no se puede verificar contra el código, no lo escribas y menciónalo en el PR.
