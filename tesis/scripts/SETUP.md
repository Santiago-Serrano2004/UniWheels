# Configuración del snapshot de la tesis (lo que hace Santiago una vez)

Tiempo total: ~20 min. Al final, `snapshot.py` exporta el Doc a PDF y lo sube
como nueva versión del PDF publicado en la carpeta compartida, sin romper enlaces.

---

## 1. Autorizar el lector de Drive (para que los agentes lean el Doc)

En Claude Code:
1. Escribe `/mcp` y Enter.
2. Elige **claude.ai Google Drive**.
3. Autentica → se abre el navegador → elige tu cuenta Google → **Permitir**.
4. Vuelve a Claude Code; debe quedar como *Connected*.

Esto es solo lectura. La subida de versiones usa la cuenta de servicio (pasos 2-6).

---

## 2. Proyecto en Google Cloud + Drive API

1. Entra a https://console.cloud.google.com
2. Selector de proyecto (barra superior) → **Nuevo proyecto** → nombre `uniwheels-tesis` → **Crear**. Selecciónalo.
3. Ve a https://console.cloud.google.com/apis/library
4. Busca **Google Drive API** → ábrela → **Habilitar**.

---

## 3. Cuenta de servicio + clave JSON

1. Ve a https://console.cloud.google.com/apis/credentials
2. **+ Crear credenciales** → **Cuenta de servicio**.
3. Nombre `tesis-snapshot` → **Crear y continuar** → sin roles → **Continuar** → **Listo**.
4. En la lista *Cuentas de servicio*, haz clic en `tesis-snapshot`.
5. Pestaña **Claves** → **Agregar clave** → **Crear clave nueva** → **JSON** → **Crear**. Se descarga un `.json`.
6. Apunta el **email** de la cuenta de servicio (algo como
   `tesis-snapshot@uniwheels-tesis.iam.gserviceaccount.com`).
7. Mueve la clave al repo:
   ```bash
   mv ~/Downloads/uniwheels-tesis-*.json \
      ~/Desktop/proyecto_backend/UniWheels/tesis/scripts/sa-key.json
   ```
   (ya está en `.gitignore`, no se subirá)

---

## 4. Compartir con la cuenta de servicio

**Opción simple:** comparte la **carpeta compartida de la tesis** con el email de
la cuenta de servicio, rol **Editor**. Con eso puede leer el Doc y actualizar el PDF.

**Opción estricta:** carpeta como **Lector**, y el PDF publicado (paso 5) como **Editor**.

En ambos casos, al compartir desmarca "Notificar a las personas".

---

## 5. Crear el PDF publicado (una sola vez)

1. En el Doc: **Archivo → Descargar → PDF**.
2. Sube ese PDF a la carpeta compartida con el nombre `Proyecto_de_grado.pdf`.
3. Ese archivo es el que la gente abrirá siempre; su enlace no cambiará nunca más.

---

## 6. IDs y config.json

- **doc_id**: de la URL del Doc → `.../document/d/`**`ESTA_PARTE`**`/edit`
- **target_file_id**: abre el PDF en Drive → `.../file/d/`**`ESTA_PARTE`**`/view`

```bash
cd ~/Desktop/proyecto_backend/UniWheels/tesis/scripts
cp config.example.json config.json
# edita config.json y rellena doc_id y target_file_id
```

---

## 7. Dependencias de Python (venv, para no tocar el Python del sistema)

```bash
cd ~/Desktop/proyecto_backend/UniWheels/tesis/scripts
python3 -m venv .venv
.venv/bin/pip install google-api-python-client google-auth
```

---

## 8. Probar

```bash
cd ~/Desktop/proyecto_backend/UniWheels
tesis/scripts/.venv/bin/python tesis/scripts/snapshot.py --local-only   # solo exporta a tesis/export/
tesis/scripts/.venv/bin/python tesis/scripts/snapshot.py --no-commit    # + sube nueva versión a Drive
tesis/scripts/.venv/bin/python tesis/scripts/snapshot.py                # + commit del snapshot
```

---

## 9. Programarlo

**Cron local** (diario 20:00):
```bash
crontab -e
```
```
0 20 * * * cd /home/santiago/Desktop/proyecto_backend/UniWheels && tesis/scripts/.venv/bin/python tesis/scripts/snapshot.py >> tesis/scripts/snapshot.log 2>&1
```

O en Claude Code: `/schedule` → rutina diaria que ejecuta ese comando.
