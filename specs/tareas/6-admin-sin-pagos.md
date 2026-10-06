# Fase 6: panel de administración sin pagos

- **Rama base:** `pivote/b2b-sin-pagos`. Crea `pivote/6-admin-sin-pagos` y abre **un solo PR** contra la rama base.
- **Alcance:** solo `admin/` (React + Vite + react-router). **No toques** servicios, `mobile/`, `landing/` ni `frontend/`.
- **UI:** cero emojis, solo íconos `lucide-react`, mismo estilo visual que el resto del panel. Español neutro (tú).

## Contrato del backend (ya mergeado)
- **Ya no existen:** `GET /admin/payments/trips`, `GET /admin/payments/topups` y `user.wallet`.
- **`GET /admin/trips`** ya no trae `payment_method`, `driver_amount_cop`, `platform_commission_cop`, `commission_status`, `payment_confirmed_at` ni `payment_reference`. Sí trae `total_fare_cop` (el aporte acordado, que se paga por fuera de la app).
- **Usuarios** (`GET /admin/users` y `GET /admin/users/{id}`): traen `suspended_until` (ISO o null).
  - En la bitácora de suspensiones aparecen las acciones nuevas `auto_suspended` y `auto_reactivated`, con `admin` = null.
  - Al reactivar manualmente, el backend limpia `suspended_until`.

## Cambios
1. **Viajes** (`src/pages/TripsPaymentsPage.jsx`):
   - Renómbrala a `src/pages/TripsPage.jsx` (componente `TripsPage`).
   - Quita la pestaña "Pagos", sus sub-pestañas (`viajes`/`recargas`), `paymentsSummary` y todo su estado y handlers. Queda solo la lista de viajes con sus filtros actuales.
   - En la tabla, quita las columnas de método de pago y comisión. La columna del monto se llama **"Aporte acordado"** (`total_fare_cop`), y un `0` se muestra como `"Gratis"`.
   - Encima de la tabla, un texto pequeño: `"Los aportes se pagan directamente entre usuarios; UniWheels no procesa pagos."`.
2. **Rutas y navegación:**
   - En `src/App.jsx`, la ruta `viajes-pagos` pasa a ser `viajes`, con un `<Navigate to="/viajes" replace />` desde `viajes-pagos`.
   - En `src/components/AdminLayout.jsx`, el ítem pasa a `to: '/viajes'` y `label: 'Viajes'`, con un ícono acorde (no de dinero).
3. **`src/services/api.js`:** elimina `getTripPayments` y `getTopupPayments`.
4. **Usuarios** (`src/pages/UsersPage.jsx`):
   - Quita el bloque de saldo de billetera del detalle (≈ l. 560–575: `wallet.balance_cop` / `is_locked`).
   - Cambia la descripción de la página (≈ l. 229) a: `"Consulta de perfiles universitarios, reputación y suspensiones."`.
   - **Estado de suspensión:** si `is_active` es false y `suspended_until` existe, muestra **"Suspendido hasta dd/mm/aaaa"** (hora de Colombia) en la lista y en el detalle. Si no hay fecha, muestra "Suspendido" como hoy.
   - **Bitácora:** muestra las cuatro acciones con etiqueta propia:
     - `suspended` → "Cuenta suspendida";
     - `reactivated` → "Cuenta reactivada";
     - `auto_suspended` → "Suspensión automática (cancelaciones tardías)";
     - `auto_reactivated` → "Reactivación automática (fin del plazo)".

     Si `admin` es null, el autor es "Sistema".
   - **Al reactivar manualmente:** actualiza el estado local también con `suspended_until: null`.
   - Ajusta `formatCOP` si queda sin uso, para que lint no falle.

## Verificación
1. `cd admin && npm ci && npm run build`: sin errores.
2. `npm run lint`, si existe el script: sin errores nuevos.
3. Este grep en `admin/src` no devuelve nada:
   ```
   grep -rniE "wallet|billetera|saldo|recarga|topup|payment|comisi|commission"
   ```
4. Commits por bloque (`refactor(admin): ...`).
5. Si algo falla dos veces por la misma causa, **detente** y documéntalo en el PR. Nada fuera de este alcance.
