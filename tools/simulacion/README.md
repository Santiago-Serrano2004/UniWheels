# Simulador de usuarios (T3)

Ejerce UniWheels como 20 personas reales (6 conductores, 14 pasajeros) y registra cada paso. **Solo localhost.**
Si una URL apunta a otro host (o a `uniwheels.org` / `68.155.150.69`) el simulador aborta.

## Requisitos
- Python 3.12+ y `pip install -r requirements.txt` (solo `httpx`).
- Backend local corriendo con el correo en log (no envía correos reales):

```bash
cd UniWheels
MAIL_MAILER=log ./uniwheels migrate
MAIL_MAILER=log ./uniwheels start      # Postgres y Redis (podman) ya deben estar arriba
```

## Uso
```bash
cd tools/simulacion
export UNIWHEELS_BACKEND_ROOT=/ruta/al/checkout/que/corre   # donde están vendor/ y .env (por defecto, este repo)
python -m simulacion run --all                # 12 escenarios -> reportes/simulacion/<fecha>/resultados.json
python -m simulacion run --escenario 1,5,11   # solo algunos (siempre hace la preparación: alta de los 20 usuarios)
python -m simulacion --cleanup                # borra SOLO lo que tenga prefijo sim_
```

La preparación usa la API real: `send-verification-code` -> código leído de
`services/auth-service/storage/logs/laravel.log` -> `register` -> `login`; los conductores hacen
`driver/register`, crean el vehículo y suben PDFs dummy, y `sim_admin` (creado con `php artisan tinker`)
aprueba los documentos. Los límites de velocidad (429) se esperan y reintentan, por lo que la preparación tarda unos minutos.

Todo lo que se crea tiene el prefijo `sim_` (correos `sim_<clave>@unab.edu.co`, documentos `sim_NNNN`, placas `SIM...`).
`--cleanup` borra por id de usuario `sim_` en las 5 bases, las llaves de suspensión en Redis y los códigos en caché.
No toca ningún otro dato.

## UI (Playwright)
```bash
node ui/proxy_local.mjs &                                   # 127.0.0.1:8090, imita gateway/api-locations.conf
(cd ../../admin && VITE_API_URL=http://127.0.0.1:8090 npm run dev) &   # 5174
(cd ../../landing && npm run dev) &                         # 5173
node ui/ui_admin.mjs   ../../reportes/simulacion/<fecha>/capturas/admin
node ui/ui_landing.mjs ../../reportes/simulacion/<fecha>/capturas/landing
```
Playwright se toma de `frontend/node_modules` (variable `PLAYWRIGHT_MODULE` para cambiarlo).
