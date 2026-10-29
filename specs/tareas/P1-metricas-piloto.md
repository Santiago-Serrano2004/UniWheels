# P1: métricas del piloto (criterios de abandono)

- **Rama base:** `pivote/b2b-sin-pagos`. Crea `pivote/p1-metricas` y abre **un solo PR** contra la rama base.
- **Objetivo:** que Bienestar y el fundador vean cada semana si el piloto funciona, con los criterios de abandono de `negocio/reporte-viabilidad-pesimista.md` §12 (ese archivo no está en el repo; los umbrales van abajo).
- **CI en verde obligatoria.** route-matching y trip usan **PHPUnit**. Revisa `tests/Pest.php` antes de escribir tests. No nombres helpers como métodos de `TestCase`.
- **Privacidad (Ley 1581):** las métricas son **agregadas**. Ningún endpoint de métricas devuelve nombres, correos ni ids de usuarios.

## Métricas, por semana ISO, en hora de Colombia, últimas 12 semanas
| Métrica | Fuente | Umbral de alerta |
|---|---|---|
| Usuarios activos por semana: personas distintas que buscaron, publicaron o viajaron | route-matching y trip | < 30 |
| Conductores que publicaron al menos una ruta | route-matching | < 8 |
| Búsquedas totales y % con al menos un resultado | route-matching | < 25 % |
| Viajes completados | trip | sin umbral |
| Cancelaciones tardías | trip | sin umbral |
| Repetición a 14 días: % de pasajeros con un viaje completado que completan otro en los 14 días siguientes (cohorte por semana del primer viaje) | trip | < 20 % |

## route-matching-service
1. **Migración** `search_logs`: `id`, `passenger_id` (uuid), `results_count` (int), `modality_1_count`, `modality_2_count` y `created_at`. Índice en `created_at`.
2. En `search-match`, después de calcular los resultados, inserta una fila. **Si la inserción falla, no rompe la búsqueda**: solo registra un warning.
3. `GET /api/v1/admin/metrics/weekly?weeks=12`, con `jwt.auth` + `admin`. Responde por semana: `searches`, `searches_with_results`, `hit_rate`, `publishing_drivers` y `active_user_ids_hash`. Este último es una lista de **hashes** SHA-256 de los ids con un secreto de la app, para poder unirlos con los de trip sin exponer ids. **Si prefieres, devuelve solo los conteos** y deja la unión de activos únicos a trip con un endpoint interno; documenta la decisión.

## trip-service
1. `GET /api/v1/admin/metrics/weekly?weeks=12` (admin): `completed_trips`, `late_cancellations`, `active_passengers`, `active_drivers` y `repeat_14d_rate` por semana.
2. **Usuarios activos únicos entre servicios:** trip llama a route-matching por un endpoint **interno** (`jwt.service`) para traer los hashes de usuarios activos por semana. Calcula la unión y responde `weekly_active_users`. Si route-matching no responde, devuelve solo los activos de trip y `partial: true`.

## admin (panel de Bienestar)
1. Página nueva **"Piloto"** (`/piloto`), con un ítem en el menú lateral y un ícono de `lucide-react`.
2. **Tarjetas de la semana actual** con los 4 indicadores que tienen umbral: usuarios activos, conductores que publican, % de búsquedas con resultado y repetición a 14 días. Cada una muestra el valor, el umbral y un estado: "En meta" o "Bajo el umbral". **Sin emojis**; usa color y texto.
3. **Tabla de las últimas 12 semanas** con todas las métricas.
4. **Botón "Exportar CSV"** de la tabla, para los informes de la universidad.
5. Si alguna fuente responde `partial`, se muestra un aviso pequeño.
6. **Mismo estilo** que el resto del panel.

## Tests
- **route-matching:**
  - una búsqueda registra un log;
  - un error al registrar el log no rompe la búsqueda;
  - el endpoint de métricas agrega bien 2 semanas de datos sembrados;
  - un usuario que no es admin recibe 403.
- **trip:**
  - la repetición a 14 días con una cohorte sembrada: 3 pasajeros, 1 repite dentro de los 14 días y 1 repite a los 20 días → 33 %;
  - la unión de usuarios activos con `Http::fake`;
  - `partial` cuando falla route-matching;
  - un usuario que no es admin recibe 403.
- **admin:** `npm run build` en verde.

## Criterios de terminado
- CI en verde, con el link en el PR.
- **Nota de despliegue:** migración `search_logs` (route-matching), endpoints nuevos y página nueva del panel.
- Si algo falla dos veces por la misma causa, detente y documéntalo. Nada fuera de este alcance.
