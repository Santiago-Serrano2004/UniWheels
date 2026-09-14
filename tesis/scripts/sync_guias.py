#!/usr/bin/env python3
"""
sync_guias.py — descarga la carpeta 'guias' de Drive a tesis/guias/.
Guias institucionales (plantilla, normas APA, etc.). Solo lectura, una direccion.

Uso:  python sync_guias.py
Config: usa el mismo config.json / sa-key.json que snapshot.py.
Requiere 'guias_folder_id' en config.json (o lo busca por nombre dentro de folder_id).
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
DEST = HERE.parent / "guias"
CFG = json.loads((HERE / "config.json").read_text())

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import io

creds = service_account.Credentials.from_service_account_file(
    str(HERE / CFG.get("sa_key_path", "sa-key.json")),
    scopes=["https://www.googleapis.com/auth/drive"],
)
drive = build("drive", "v3", credentials=creds, cache_discovery=False)

# mimeType Google -> (extension, mimeType de exportacion)
EXPORT = {
    "application/vnd.google-apps.document": (
        ".docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ),
    "application/vnd.google-apps.spreadsheet": (
        ".xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ),
    "application/vnd.google-apps.presentation": (".pdf", "application/pdf"),
}


def find_guias_folder() -> str:
    if CFG.get("guias_folder_id"):
        return CFG["guias_folder_id"]
    parent = CFG["folder_id"]
    r = drive.files().list(
        q=f"'{parent}' in parents and name='guias' and mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields="files(id)", supportsAllDrives=True, includeItemsFromAllDrives=True,
    ).execute()
    if not r.get("files"):
        sys.exit("No encuentro la carpeta 'guias' dentro de folder_id.")
    return r["files"][0]["id"]


def download(file_id: str) -> bytes:
    buf = io.BytesIO()
    dl = MediaIoBaseDownload(buf, drive.files().get_media(fileId=file_id))
    done = False
    while not done:
        _, done = dl.next_chunk()
    return buf.getvalue()


def export(file_id: str, mime: str) -> bytes:
    buf = io.BytesIO()
    dl = MediaIoBaseDownload(buf, drive.files().export_media(fileId=file_id, mimeType=mime))
    done = False
    while not done:
        _, done = dl.next_chunk()
    return buf.getvalue()


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    gid = find_guias_folder()
    r = drive.files().list(
        q=f"'{gid}' in parents and trashed=false",
        fields="files(id,name,mimeType)", pageSize=200,
        supportsAllDrives=True, includeItemsFromAllDrives=True,
    ).execute()
    files = r.get("files", [])
    if not files:
        sys.exit("La carpeta 'guias' esta vacia.")
    for f in files:
        name, mt = f["name"], f["mimeType"]
        if mt in EXPORT:
            ext, xmime = EXPORT[mt]
            data = export(f["id"], xmime)
            out = DEST / (Path(name).stem + ext)
        else:
            data = download(f["id"])
            out = DEST / name
        out.write_bytes(data)
        print(f"  {out.name}  ({len(data)//1024} KB)")
    print(f"\n{len(files)} guias en {DEST.relative_to(HERE.parent.parent)}")


if __name__ == "__main__":
    main()
