# T3: simulación de usuarios reales y reporte de bugs

- **Rama base:** `pivote/b2b-sin-pagos`. Crea `pivote/t3-simulacion` y abre un PR contra la rama base. El PR **solo** agrega el simulador y el reporte; **no corrige bugs**. Los bugs se corrigen después, en specs aparte.
- **Objetivo:** ejercer el sistema como lo harían 20 personas reales durante una semana de clases y reportar todo lo que falle, confunda o contradiga las reglas.

## Reglas de seguridad (obligatorias)
- **Nunca** contra producción (`uniwheels.org`, la VM `68.155.150.69`). Solo `localhost`.
- **No** modifiques `.env.production` ni ningún `.env` versionado. Para el correo usa `MAIL_MAILER=log`, pasado como variable de entorno al levantar auth-service, para no enviar correos reales con Resend.
- **No** borres datos de desarrollo existentes. Crea usuarios con el prefijo `sim_`, y al final deja un comando de limpieza (`--cleanup`) que borre solo lo que tenga ese prefijo.

## Entorno
- Este equipo tiene PHP 8.5, Podman, PostgreSQL+PostGIS (`uniwheels_postgres_gis`) y Redis (`uniwheels_redis`).
- Levanta el sistema con `./uniwheels start` (ver `./uniwheels help`) y comprueba con `./uniwheels status`. Si algún servicio no arranca, revisa `./uniwheels logs <svc>`. Ese problema ya cuenta como hallazgo.
- Antes de simular, corre `./uniwheels migrate`.

## 1. Simulador (`tools/simulacion/`)
- **Python 3.12** con `httpx`, en `tools/simulacion/requirements.txt`, más un `README.md` corto con cómo correrlo.
- `personas.py`: 6 conductores (4 carro y 2 moto) y 14 pasajeros, con barrios reales del área metropolitana de Bucaramanga (Cabecera, Cañaveral, Floridablanca, Piedecuesta, Girón, Provenza, Real de Minas…) y las sedes que devuelve `GET /institutions`.
- **Alta de usuarios por la API real:**
  1. `send-verification-code`;
  2. leer el código del log de auth-service (`storage/logs/laravel.log`);
  3. `register` y `login`.
- **Conductores:**
  1. `driver/register`;
  2. crear el vehículo;
  3. subir los documentos con PDFs dummy generados por el script;
  4. aprobarlos con un usuario administrador `sim_admin`, creado con `php artisan tinker`, por medio de los endpoints de admin, igual que lo haría Bienestar.
- **Escenarios** (cada uno es una función que registra pasos, respuestas y aserciones):
  1. **Camino feliz:** el conductor pide el aporte sugerido y publica con ese valor. El pasajero busca, encuentra, reserva por el aporte exacto, el conductor verifica el PIN y completa el viaje.
  2. **Tope del aporte:** publicar por encima del sugerido devuelve 422 con `max_contribution_cop`; publicar con 0 y con el sugerido devuelve 201.
  3. **Moto:** el sugerido usa 1000 + 250/km, y la ruta tiene 1 cupo.
  4. **Desvío:** un pasajero fuera del corredor (modalidad 2) ve el mismo aporte de la ruta y puede reservar.
  5. **Cupos:** más reservas que cupos; la última se rechaza.
  6. **Cancelaciones tardías:** el mismo pasajero cancela tarde 3 veces en rutas distintas. En la 3.ª queda suspendido; login y requests responden 403 con `suspended_until`; las cancelaciones a tiempo no cuentan.
  7. **Levantamiento perezoso:** adelantar `suspended_until` al pasado (con tinker) y comprobar que el siguiente request reactiva al usuario y escribe `auto_reactivated` en la bitácora.
  8. **Administrador:** listar usuarios, ver el detalle con la bitácora y suspender y reactivar manualmente. El usuario suspendido manualmente **no** se reactiva solo.
  9. **SOS:** un pasajero en viaje activa el SOS y el administrador lo ve y lo atiende.
  10. **Entradas inválidas:**
      - ids que no son UUID;
      - coordenadas fuera de rango;
      - token vencido o ausente;
      - un usuario que intenta operar un viaje ajeno;
      - reservar dos veces el mismo viaje;
      - publicar sin vehículo aprobado.
  11. **Concurrencia ligera:** 10 pasajeros buscan y reservan a la vez la misma ruta de 3 cupos. Debe haber exactamente 3 reservas, sin sobrecupo.
  12. **Semana simulada:** los 20 usuarios repiten publicar, buscar y reservar en franjas de 6 a 8 a. m. y de 5 a 7 p. m. durante 5 "días" (moviendo las horas de salida). Mide la tasa de búsquedas con resultado, los tiempos de respuesta p50/p95 por endpoint y los errores 5xx.
- `python -m simulacion run --all` ejecuta todo y escribe `reportes/simulacion/<fecha>/resultados.json` con cada paso.

## 2. UI web (Playwright)
- Si está disponible el skill `webapp-testing`, úsalo. Si no, usa Playwright con Python.
- **Panel de administración** (`admin/`, `npm run dev` apuntando a la API local):
  - login con `sim_admin`;
  - recorrer Vehículos, detalle con documentos, Usuarios, detalle, suspensión, Viajes y SOS;
  - capturas de cada pantalla y errores de consola.
- **Landing** (`landing/`):
  - carga, ancla `#universidades`, el modal de privacidad y las preguntas frecuentes;
  - errores de consola;
  - capturas en escritorio y en móvil (390 px).

## 3. Revisión de la app móvil (sin dispositivo)
La app no se puede manejar aquí. Revisa **estáticamente** que cada llamada de `packages/shared/src/api.js` coincida con el contrato real que observaste en la simulación: campos, nombres y códigos de error. Reporta cada desajuste como bug.

## 4. Reporte (`reportes/simulacion/<fecha>/REPORTE.md`)
- **Resumen:** escenarios que pasaron y fallaron, métricas de la semana simulada (tasa de búsquedas con resultado, p50/p95 y 5xx) y los 5 hallazgos más graves.
- **Un bloque por bug:**
  - ID (`SIM-001`…);
  - severidad (**crítica**: pérdida de datos, seguridad o flujo principal roto; **alta**; **media**; **baja**);
  - componente;
  - pasos para reproducir (comandos o requests exactos);
  - resultado esperado y obtenido;
  - evidencia (respuesta, log o captura);
  - sugerencia de causa, con archivo y línea si la encontraste.
- **Observaciones de UX**, aparte de los bugs.
- No inventes bugs: cada uno tiene que tener evidencia reproducible.

## Verificación
- El simulador corre de punta a punta con un solo comando. La limpieza `--cleanup` funciona.
- El PR incluye `tools/simulacion/`, `reportes/simulacion/<fecha>/` (con capturas, comprimidas si pesan más de 5 MB) y la descripción con el resumen del reporte.
- Al terminar, detén los servicios con `./uniwheels stop`, salvo los contenedores de Postgres y Redis.
