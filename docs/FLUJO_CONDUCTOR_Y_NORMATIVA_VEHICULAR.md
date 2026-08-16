# Especificación Técnica: Módulo de Conductor y Normativa Vehicular Colombiana

## 1. Visión General
El módulo de registro y verificación de conductores de **UniWheels** implementa un flujo paso a paso que conecta directamente con la base de datos oficial internacional de la **NHTSA vPIC API** e incorpora las validaciones legales de tránsito y transporte de la República de Colombia.

---

## 2. Integración con NHTSA vPIC API y Caché de 24 Horas
Para garantizar un catálogo de vehículos robusto, actualizado y sin costos recurrentes de API Keys:

* **Endpoint Oficial:** `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/{marca}?format=json`
* **Estrategia de Caché:** Los modelos consultados se almacenan localmente con un Time-To-Live (TTL) de **24 horas** (`86.400.000 ms`).
* **Selector Dinámico:** Al seleccionar la marca (Chevrolet, Renault, Mazda, Kia, Toyota, BYD, Yamaha, etc.), el campo de modelo se transforma en un menú desplegable con carga asíncrona.
* **Mecanismo de Respaldo (*Fallback*):** Ante interrupciones de conectividad con el servidor de la NHTSA, el servicio carga un catálogo local offline de los modelos más vendidos en Colombia.

---

## 3. Normativa Legal de Revisión Técnico-Mecánica (RTM)

El sistema evalúa en tiempo real si un vehículo está en la obligación de presentar el Certificado de Revisión Técnico-Mecánica según la legislación colombiana vigente:

### 3.1. Vehículos Particulares (Gasolina, Diésel, Híbridos y 100% Eléctricos EV)
* **Base Legal:** **Ley 2294 de 2023 (Plan Nacional de Desarrollo)**, que modificó el artículo 52 de la **Ley 769 de 2002** (Código Nacional de Tránsito), y la **Ley 1964 de 2019** (Régimen de Movilidad Eléctrica).
* **Período de Gracia:** Los vehículos particulares nuevos están exentos de RTM durante los primeros **cinco (5) años** contados a partir de la fecha de matrícula inicial.
* **Cálculo Dinámico:**
  $$\text{Antigüedad} = \text{Año Actual (2026)} - \text{Año Modelo}$$
  * **Modelos $\le 2021$ ($>5$ años):** El certificado de RTM es **OBLIGATORIO**. El formulario exige número de certificado, fecha de vencimiento mayor a la actual y foto del documento.
  * **Modelos $\ge 2022$ ($<5$ años):** El vehículo se clasifica como **EXENTO POR LEY** y el campo no se solicita, mostrando un distintivo informativo.

### 3.2. Motocicletas
* **Período de Gracia:** Las motocicletas cuentan con **dos (2) años** de gracia desde la fecha de matrícula.
  * **Modelos $\le 2024$:** RTM obligatoria.
  * **Modelos $2025$ y $2026$:** Exentas de RTM.

---

## 4. Validaciones de Documentos y Formatos Colombianos

| Documento / Campo | Expresión Regular / Regla | Condición de Aprobación |
| :--- | :--- | :--- |
| **Placa Automóvil** | `^[A-Z]{3}\d{3}$` | Exactamente 3 letras y 3 números (Ej: `KLU492`). |
| **Placa Motocicleta** | `^[A-Z]{3}\d{2}[A-Z]$` | 3 letras, 2 números y 1 letra (Ej: `WYX81D`). |
| **Póliza SOAT** | `^[A-Z0-9-]{6,20}$` | 6 a 20 caracteres alfanuméricos. Fecha de vencimiento $>$ Fecha Actual. |
| **Licencia de Conducción** | `^\d{6,12}$` | 6 a 12 dígitos numéricos (Cédula/RUNT). Fecha de vencimiento $>$ Fecha Actual. |
| **Categoría Licencia Auto** | `B1`, `B2`, `C1`, `C2` | Coherente con servicio particular / público. |
| **Categoría Licencia Moto** | `A1`, `A2` | Coherente con cilindraje hasta / mayor a 125 c.c. |

---

## 5. Custodia y Protección de Datos (Ley 1581 de 2012)
* Toda la documentación vehicular y fotos de licencias se procesan bajo consentimiento expreso del estudiante/docente.
* Los documentos se almacenan en almacenamiento privado con acceso mediante **URLs firmadas temporalmente** (máximo 10 minutos de vigencia) para auditorías internas de Bienestar Universitario.
