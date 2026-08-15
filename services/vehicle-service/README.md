# Microservicio de Vehículos, Documentación y Habeas Data (vehicle-service)

Microservicio en Laravel 13 responsable de la gestión de parque automotor, integración con la API de la NHTSA y auditoría estricta de documentos conforme a la Ley 1581 de 2012.

---

## 1. Responsabilidades
* Registro y homologación de automóviles (1 a 6 cupos) y motocicletas (1 cupo con verificación de casco).
* Catálogo híbrido de marcas y líneas vehiculares en tiempo real con NHTSA vPIC API y marcas colombianas locales (AKT, Bajaj, Auteco) con caché en Redis 7.
* Almacenamiento seguro en disco privado de SOAT, Licencia de Conducción, Tarjeta de Propiedad y RTM.
* Generación de URLs firmadas temporales (10 minutos) para descarga segura.
* Auditoría obligatoria e inmutable de accesos en `document_access_logs`.
* Verificación y aprobación administrativa por parte de Bienestar Universitario.

---

## 2. Endpoints Principales

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/v1/vehicles/catalog/brands?type=carro\|moto` | Listado estandarizado de marcas de vehículos. |
| `GET` | `/api/v1/vehicles/catalog/models?brand={marca}` | Listado de modelos por marca en tiempo real. |
| `GET` | `/api/v1/vehicles` | Listado de vehículos registrados. |
| `POST` | `/api/v1/vehicles` | Registro de nuevo automóvil o motocicleta con placa colombiana. |
| `GET` | `/api/v1/vehicles/{id}` | Detalle de vehículo y cumplimiento normativo. |
| `POST` | `/api/v1/vehicles/{id}/documents` | Carga de documento digital en disco privado seguro. |
| `GET` | `/api/v1/vehicles/{id}/documents/{docId}/download` | Descarga segura con URL firmada y registro Habeas Data. |
| `PATCH` | `/api/v1/vehicles/{id}/documents/{docId}/verify` | Validación administrativa de documento por Bienestar. |

---

## 3. Pruebas Automatizadas
```bash
./vendor/bin/pest
```
Cobertura: 9 pruebas unitarias y de integración sobre PostgreSQL `vehicle_db`.
