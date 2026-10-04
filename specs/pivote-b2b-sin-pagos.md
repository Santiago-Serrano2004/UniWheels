# Pivote: UniWheels B2B para universidades, sin procesar pagos

Estado: plan aprobado en sus decisiones; las tareas están pendientes. Fecha: 2026-10-04.
Antecedente: `../negocio/reporte-viabilidad-pesimista.md`.

## Decisiones (tomadas por el usuario)
1. **Quién paga:** la universidad paga una licencia. Para estudiantes y personal la app es gratis.
2. **Cero pagos en la plataforma.** UniWheels no cobra, no recauda y no se queda con ninguna comisión.
3. **Tarifa:** la app **sugiere** un aporte al conductor y el conductor **indica** el suyo. Ese aporte se muestra a los pasajeros y se paga **por fuera de la app**, en efectivo o por Nequi.
4. **El código de pagos se elimina**, no se apaga: Wompi, billetera, recargas, liquidación, comisión y conciliación.
5. **Varias universidades:** el modelo se diseña ahora y se implementa cuando haya un segundo cliente.
6. **Documentación a replantear:** la técnica del repo, la tesis (como sugerencias), la landing con los textos legales, y el documento de negocio.

## Reglas nuevas que reemplazan las de dinero
- **Aporte sugerido por cupo** = carro `2000 + 400 × km`, moto `1000 + 250 × km` (~43 % de una app). ⚠️ Riesgo legal alto; ver reglas §1.2.
  - Es configurable por institución cuando exista el modelo de varias universidades.
- **Tope:** el aporte que indica el conductor tiene que ser **≤ al aporte sugerido**, y puede ser $0. El tope es la defensa de "compartir gastos" frente a la infracción D12. Hay que validarlo con un abogado.
- **Cancelaciones:** las penalizaciones dejan de ser en dinero.
  - 3 cancelaciones tardías en 30 días → suspensión de 30 días con el mecanismo de suspensión existente (Redis). El umbral 3 está por confirmar.
- **Calificaciones, PIN, SOS y verificación de documentos:** no cambian.

## Reparto
| Quién | Qué |
|---|---|
| **Claude (local)** | Fases 0, 1, 2, 7 (textos), 10 y 11, más la revisión de cada diff |
| **Ejecutor** (Claude en la nube con Sonnet; si no hay, agy) | Fases 3 a 6 y 8. Una tarea por sesión, una rama y un PR |
| **Usuario (manual)** | Fase 9: panel de Wompi, `.env.production`, decisiones legales |

Cada tarea debe poder commitearse sola. **Comando de verificación** por servicio Laravel:

```
cd services/<svc> && composer test
```

Para mobile, admin y landing:

```
npm run lint && npm run build
```

Si una tarea falla dos veces, se detiene y se reporta el diagnóstico.

---

## Fase 0: Registro de la decisión
- **0.1** ADR con el título "Pivote a B2B institucional sin procesamiento de pagos": contexto, decisión, consecuencias y alternativas descartadas (comisión del 12 %, feature flag).

## Fase 1: Documento de negocio (Claude)
- **1.1** `../negocio/modelo-b2b.md`:
  - propuesta de valor para la universidad (seguridad, comunidad verificada, panel de Bienestar, reportes de movilidad y sostenibilidad);
  - planes y precios como hipótesis;
  - piloto pagado por un semestre;
  - métricas que se reportan;
  - qué incluye la licencia.
- **1.2** Presentación de una página para la UNAB: el problema, la solución, el piloto, las métricas y el pedido concreto.

## Fase 2: Reglas de negocio (Claude, antes de tocar código)
- **2.1** Reescribir `docs/REGLAS_DE_NEGOCIO_Y_TARIFAS.md`:
  - quitar la sección 1 (billetera prepago y liquidación);
  - agregar el aporte sugerido con su tope;
  - cancelaciones sin dinero;
  - la sección 4 queda igual.

## Fase 3: Backend
- **3.1 auth-service: eliminar billetera, Wompi y recargas.**
  - Borrar `WalletController`, `WalletTransactionService`, `WompiService`, `UserWallet`, `WalletTransaction` y `WompiWebhookEvent`.
  - Borrar `ReconcileWompiTransactionsCommand` y su programación en `routes/console.php`.
  - Borrar `AdminPaymentController`, `GetAdminTopupsRequest` y `AdminTopupResource`, con sus rutas en `routes/api.php`.
  - Quitar el saldo de `UserResource` y de `AdminUserDetailResource`, y la relación de billetera en `User`.
  - Quitar `wompi` de `config/services.php` y el saldo falso del `DatabaseSeeder`.
  - **Migración nueva** que elimine las tablas de billetera y las de eventos de Wompi. **No borrar las migraciones viejas.**
  - Tests: borrar `WalletControllerTest`, `ReconcileWompiTransactionsTest` y `AdminTopupsTest`; ajustar `AuthTest` y `AdminUserManagementTest`.
- **3.2 trip-service: eliminar el cobro y la liquidación.**
  - Borrar `TripPaymentController`, `AdminTripPaymentController`, `WalletServiceClient`, `WompiService` y `WompiWebhookEvent`.
  - Borrar `GetAdminTripPaymentsRequest` y `AdminTripPaymentResource`, con sus rutas.
  - En `Trip`: quitar `COMMISSION_RATE`, el reparto de comisión al completar el viaje y `DRIVER_CANCEL_PENALTY_COP`.
  - Ajustar `TripLifecycleController`, `AdminTripResource` y `AdminSosEventResource`.
  - Migración nueva: eliminar `payment_confirmed_at`, las columnas de comisión, ganancia y penalización, y la tabla de eventos de Wompi.
  - Tests: borrar `PaymentSettlementTest` y `TripPaymentWebhookTest`; ajustar `TripLifecycleTest`, `AdminTripsAndPaymentsTest` (renombrar a `AdminTripsTest`) y los demás que fallen.
- **3.3 trip-service: aporte sugerido y tope.**
  - Endpoint `GET /api/v1/trips/contribution-suggestion?distance_km=` que aplique la fórmula de la Fase 2, con `vehicle_type` y con `APORTE_BASE`/`APORTE_KM` por tipo de vehículo (carro 2000/400, moto 1000/250) leídos de la configuración.
  - Renombrar `total_fare_cop` a `contribution_cop` con una migración.
  - `CreateTripRequest` valida `0 ≤ contribution_cop ≤ sugerido`.
  - Tests de la fórmula, del tope y del valor 0.
- **3.4 Cancelaciones sin dinero.**
  - Contador de cancelaciones tardías por usuario.
  - Al llegar a N, suspensión temporal con `UserSuspensionService`, a través del endpoint interno de auth o el mecanismo equivalente que ya existe.
  - Tests.
- **3.5 ai-route-service.** Quitar `suggested_fare_cop` de `optimization.py` y de su schema, o hacer que delegue en la fórmula única. **La fórmula vive en un solo lugar: trip-service.**
- **3.6 route-matching-service.** Revisar `suggested_contribution_cop` en `TripRequest` para alinearlo con `contribution_cop`.
- **3.7 notification-service.** Quitar los tipos de notificación de pagos y recargas, si existen.
- **3.8 gateway y docker.**
  - Quitar el `mirror` del webhook de Wompi en `gateway/api-locations.conf` y en `gateway/nginx.conf`.
  - Quitar las variables `WOMPI_*` de los compose y de los `.env.example`.

## Fase 4: Paquete compartido
- **4.1** `packages/shared`: quitar las funciones de billetera, recargas y pago de `api.js` e `index.js`, y el estado de billetera en `store/useAppStore.js`. Agregar `getContributionSuggestion()`.

## Fase 5: App móvil
- **5.1** Borrar la pestaña `(tabs)/wallet.tsx` y su entrada en `_layout.tsx`, junto con `WompiWidgetModal`, `PaymentMethodSelectorModal`, `PaymentMethodsManagerModal` y `TripSettlementModal`.
- **5.2** Ajustar `index.tsx`, `map.tsx`, `profile.tsx`, `AppHeader`, `DriverCockpitCard`, `DriverHistoryView`, `RatingFeedbackModal`, `DriverApprovedCelebrationModal`, `login.tsx` y `register.tsx`: quitar el saldo, los pagos y las ganancias.
- **5.3** `CancelTripPenaltyModal`: el aviso pasa a ser de cancelaciones tardías y suspensión. Ya no menciona dinero.
- **5.4** Formulario para publicar un viaje: mostrar el aporte sugerido y un campo editable con tope, con el texto "Se paga directo al conductor. UniWheels no cobra comisión".
- **5.5** Vista del pasajero: mostrar "Aporte al conductor: $X (efectivo o Nequi, directo)".

## Fase 6: Panel de administración
- **6.1** `TripsPaymentsPage` pasa a ser `TripsPage`: sin pagos. Ajustar `App.jsx`, `AdminLayout.jsx` y `services/api.js`.
- **6.2** `UsersPage`: sin saldo. Mostrar las cancelaciones tardías y las suspensiones.

## Fase 7: Landing y textos legales
- **7.1** `FAQ.jsx` y `HowItWorks.jsx`: el pago es directo, sin comisión, y la app es gratis para la comunidad.
- **7.2** Nueva sección "Para universidades" con un llamado a escribir al correo de contacto.
- **7.3** Textos legales: Habeas Data y política de privacidad sin datos de pago. Corregir de paso lo de "cifrado y anonimización" que no está implementado. **Claude redacta y el usuario aprueba antes de aplicar.**

## Fase 8: Documentación técnica
- **8.1** `README.md`, `docs/ARQUITECTURA_BASE_DE_DATOS.md`, `docker/DEPLOY.md`, `docker/RUNBOOK_CONTINUIDAD.md` y los README de cada servicio.
- **8.2** Las specs antiguas que mencionan pagos (`specs/admin-*`, `specs/mobile-paridad-*`, `specs/web-landing.md`) **no se reescriben**. Se les agrega al inicio: `> Nota (2026-10-04): los pagos fueron eliminados; ver specs/pivote-b2b-sin-pagos.md`.

## Fase 9: Producción (usuario y Claude)
1. Hacer deploy de las fases 3 a 8 y correr las migraciones.
2. Quitar las variables `WOMPI_*` de `.env.production` en la VM.
3. **El usuario**, en el panel de Wompi: desactivar el webhook y las llaves y cerrar la cuenta si no se va a usar.
4. Verificación final:
   - la API responde 200;
   - `/wallet`, `/topups` y el webhook responden 404;
   - se puede crear un viaje con aporte y se rechaza uno con aporte mayor al tope.

## Fase 10: Tesis (Claude prepara, el usuario pega en el Doc)
- **10.1** `tesis/notas/pivote-b2b-sugerencias.md`: para cada apartado afectado (alcance, requisitos, modelo de negocio, arquitectura, reglas de negocio y legal), el texto actual resumido, el cambio propuesto y la justificación. **El Google Doc no se edita desde aquí.**

## Fase 11: Diseño de varias universidades (solo documento)
- **11.1** `docs/DISENO_MULTI_INSTITUCION.md`:
  - entidad `institution`: dominios de correo, sedes, parámetros (`APORTE_BASE`, `APORTE_KM`, umbral de cancelaciones) y administradores por institución;
  - `institution_id` en todas las tablas y como claim en el JWT;
  - aislamiento de datos y alcance del panel de administración;
  - plan de migración.
- **No se implementa** hasta que haya un segundo cliente.

---

## Orden de ejecución sugerido
**0 → 2 → 1** (en paralelo) **→ 3.1 → 3.2 → 3.3 → 3.4 → 3.5 a 3.8 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11**

Las fases 1, 10 y 11 son de texto y pueden ir en paralelo con el código.

## Pendiente del usuario
- [x] Aporte: carro $2.000 + $400/km, moto $1.000 + $250/km (ver reglas §1.2). [ ] Validar la referencia de apps de moto en Bucaramanga. [ ] **Concepto de un abogado obligatorio antes del lanzamiento** (riesgo D12).
- [x] Suspensión de 1 mes (30 días). [ ] Confirmar umbral N = 3.
- [ ] Aprobar los textos legales de la Fase 7.3.
- [ ] Desactivar Wompi en su panel.
