# Frontend SPA — UniWheels

Aplicacion Web de Pagina Unica (SPA) construida en React 18 con Vite, Tailwind CSS v4, Framer Motion y React-Leaflet para la plataforma de movilidad compartida UniWheels UNAB.

---

## 1. Stack Tecnologico
* **Framework:** React 18 + Vite
* **Estilos:** Tailwind CSS v4 con variables CSS nativas
* **Animaciones:** Framer Motion
* **Iconografia:** Lucide React
* **Mapas:** React-Leaflet + Leaflet
* **Estado Global:** Zustand
* **Notificaciones:** Sonner

---

## 2. Sistema de Diseno: Paleta Lochmara
El sistema de diseno implementa una escala cromatica de 11 pasos (Lochmara):

| Token | Hex | Rol Semantico en la Interfaz |
| :--- | :--- | :--- |
| `lochmara-50` | `#f0f9ff` | Superficies sutiles y fondos secundarios |
| `lochmara-100` | `#e0f2fe` | Badges suaves y estados hover ligeros |
| `lochmara-200` | `#bae6fd` | Bordes activos y chips seleccionados |
| `lochmara-300` | `#7dd3fc` | Lineas secundarias de conexion |
| `lochmara-400` | `#38bdf8` | Acento luminoso y resplandor de telemetria GPS |
| `lochmara-500` | `#0ea5e9` | Acciones interactivas y botones secundarios |
| `lochmara-600` | `#0284c7` | **Color de Marca Principal**, trazado de ruta activa y botones primarios |
| `lochmara-700` | `#0369a1` | Estado hover de botones primarios e iconos destacados |
| `lochmara-800` | `#075985` | Encabezados de seccion y textos de enfasis |
| `lochmara-900` | `#0c4a6e` | Barras de navegacion superior e inferior |
| `lochmara-950` | `#082f49` | Fondos de alto contraste y modo oscuro |

---

## 3. Comandos de Desarrollo
```bash
# Iniciar servidor de desarrollo en http://localhost:5173
npm run dev

# Compilar paquete de produccion
npm run build

# Previsualizar compilacion
npm run preview
```
