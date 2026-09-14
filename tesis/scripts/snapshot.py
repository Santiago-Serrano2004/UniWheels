#!/usr/bin/env python3
"""
snapshot.py — exporta el Google Doc de la tesis a PDF y:
  1. guarda una copia con fecha en tesis/export/
  2. la sube como NUEVA VERSION del PDF publicado en la carpeta compartida
     (mismo fileId, mismo enlace; Drive conserva las versiones anteriores)

Requisitos:
  pip install google-api-python-client google-auth
  Cuenta de servicio de Google Cloud con Drive API habilitada.
  Compartir con el email de la cuenta de servicio (permiso Editor) la CARPETA
  de la tesis (cubre leer el Doc y crear/actualizar el PDF publicado).

Config: copiar config.example.json a config.json y rellenar:
  - doc_id:        URL del Doc  .../document/d/<doc_id>/edit
  - folder_id:     URL de la carpeta compartida  .../folders/<folder_id>
  - target_file_id: se rellena SOLO. Vacío la primera vez: el script crea
                    "Proyecto_de_grado.pdf" en la carpeta y guarda aqui su id.

Uso:
  python snapshot.py            # exporta, sube nueva version, commit si hay diff
  python snapshot.py --no-commit
  python snapshot.py --local-only   # solo guarda en export/, no toca Drive
"""
import argparse
import datetime as dt
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
EXPORT_DIR = HERE.parent / "export"
CFG_PATH = HERE / "config.json"
PUBLISHED_NAME = "Proyecto_de_grado.pdf"


def load_config() -> dict:
    if not CFG_PATH.exists():
        sys.exit("Falta config.json (copia config.example.json y rellena los IDs).")
    cfg = json.loads(CFG_PATH.read_text())
    if not cfg.get("doc_id") or cfg["doc_id"].startswith("ID_"):
        sys.exit("config.json: 'doc_id' sin rellenar.")
    return cfg


def drive_client(sa_key_path: Path):
    from google.oauth2 import service_account
    from googleapiclient.discovery import build

    creds = service_account.Credentials.from_service_account_file(
        str(sa_key_path), scopes=["https://www.googleapis.com/auth/drive"]
    )
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def export_as(drive, doc_id: str, mime: str) -> bytes:
    import io
    from googleapiclient.http import MediaIoBaseDownload

    req = drive.files().export_media(fileId=doc_id, mimeType=mime)
    buf = io.BytesIO()
    dl = MediaIoBaseDownload(buf, req)
    done = False
    while not done:
        _, done = dl.next_chunk()
    return buf.getvalue()


def update_published_pdf(drive, file_id: str, pdf_path: Path):
    from googleapiclient.http import MediaFileUpload

    media = MediaFileUpload(str(pdf_path), mimetype="application/pdf", resumable=True)
    drive.files().update(
        fileId=file_id,
        media_body=media,
        keepRevisionForever=True,
        supportsAllDrives=True,
    ).execute()


def git(*args) -> str:
    return subprocess.run(
        ["git", *args], cwd=HERE.parent, capture_output=True, text=True
    ).stdout.strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-commit", action="store_true")
    ap.add_argument("--local-only", action="store_true")
    args = ap.parse_args()

    cfg = load_config()
    sa_key = HERE / cfg.get("sa_key_path", "sa-key.json")
    if not sa_key.exists():
        sys.exit(f"No existe la clave de la cuenta de servicio: {sa_key}")

    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = dt.datetime.now().strftime("%Y-%m-%d")
    out = EXPORT_DIR / f"proyecto-de-grado_{stamp}.pdf"

    drive = drive_client(sa_key)
    print("Exportando el Doc (PDF + Markdown para auditoría)...")
    pdf = export_as(drive, cfg["doc_id"], "application/pdf")
    out.write_bytes(pdf)
    (EXPORT_DIR / "proyecto-de-grado_latest.pdf").write_bytes(pdf)
    print(f"  {out.relative_to(HERE.parent.parent)}  ({len(pdf)//1024} KB)")

    try:
        md = export_as(drive, cfg["doc_id"], "text/markdown")
        (EXPORT_DIR / f"proyecto-de-grado_{stamp}.md").write_bytes(md)
        (EXPORT_DIR / "proyecto-de-grado_latest.md").write_bytes(md)
        print(f"  proyecto-de-grado_{stamp}.md  ({len(md)//1024} KB)")
    except Exception as e:
        print(f"  (markdown no disponible: {type(e).__name__})")

    if not args.local_only:
        tid = cfg.get("target_file_id", "").strip()
        if not tid or tid.startswith("ID_"):
            sys.exit(
                "\nFalta 'target_file_id' en config.json.\n"
                "Una cuenta de servicio no puede crear el archivo (no tiene cuota).\n"
                "Hazlo una vez tú:\n"
                f"  1. Sube este PDF a la carpeta compartida:\n     {out}\n"
                "     (nómbralo 'Proyecto_de_grado.pdf' — será el enlace fijo)\n"
                "  2. Ábrelo en Drive y copia el id de la URL /file/d/<ID>/view\n"
                "  3. Pega ese id en config.json -> target_file_id\n"
                "  4. Vuelve a ejecutar snapshot.py\n"
            )
        print("Subiendo como nueva versión del PDF publicado...")
        update_published_pdf(drive, tid, out)
        print("  hecho: mismo enlace, versión nueva en Drive.")

    if not args.no_commit:
        git("add", "export")
        if git("status", "--porcelain", "export"):
            subprocess.run(
                ["git", "commit", "-m", f"tesis: snapshot {stamp}"],
                cwd=HERE.parent.parent,
                check=False,
            )
            print("  commit hecho.")
        else:
            print("  sin cambios respecto al último snapshot; no se commitea.")


if __name__ == "__main__":
    main()
