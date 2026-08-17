# 🚗 Frontend SPA — UniWheels UNAB

Aplicación Web Progresiva (PWA / SPA) construida en **React 18** con **Vite**, **Tailwind CSS v4**, **Framer Motion**, **Zustand** y **React-Leaflet** para la plataforma de movilidad compartida y carpooling universitario UniWheels.

---

## 1. 🛠️ Stack Tecnológico

* **Core & Bundler:** React 18 + Vite 8.2 (Compilación modular con Rollup/Vite en $\sim 1.0\text{s}$)
* **Motor de Estilos:** Tailwind CSS v4 con variables CSS nativas y soporte dinámico de temas (*Dark Mode* / *Light Mode*)
* **Gestión de Estado:** Zustand con persistencia en `localStorage`
* **Microinteracciones y Animaciones:** Framer Motion (Transiciones de pantalla, layout springs y Dynamic Island)
* **Iconografía:** Lucide React (100% libre de emojis, íconos semánticos)
* **Visualización Cartográfica:** React-Leaflet + Leaflet con capas personalizables (Positron, Dark Matter, Voyager, Satellite)
* **Optimización de Assets:** Módulos estáticos WebP para sedes universitarias con hash garantizado

---

## 2. 📱 Arquitectura de Interfaz y Experiencia de Usuario (UX/UI)

### 2.1 Layout Fijo $100\text{dvh}$ (Viewport Mobile-First)
* **TopBar Fijo ([`Header.jsx`](file:///home/santiago/Desktop/proyecto_backend/UniWheels/frontend/src/components/common/Header.jsx)):** Header permanente con isotipo institucional, alternador global de tema (Dark/Light), selector de rol (Pasajero/Conductor), botón de emergencia SOS y notificaciones.
* **BottomBar Fijo ([`BottomNav.jsx`](file:///home/santiago/Desktop/proyecto_backend/UniWheels/frontend/src/components/common/BottomNav.jsx)):** Barra de navegación anclada permanentemente al alcance ergonómico del pulgar.
* **Área Central con Momentum Scroll:** Contenedor `<main>` con `overscroll-contain` para un desplazamiento suave que previene saltos o desbordamientos en navegadores móviles (Safari/Chrome).

### 2.2 Modalidades de Trayecto Universitarias (3 Sentidos)
1. **Hacia Campus (`towards`):** Punto de partida del pasajero en el AMB $\rightarrow$ Sede universitaria seleccionada (con horario de llegada deseada).
2. **Desde Campus (`from`):** Sede universitaria $\rightarrow$ Punto de llegada en el AMB (con horario de salida y punto de encuentro).
3. **Entre Sedes (`inter_campus`):** Sede universitaria de salida $\rightarrow$ Sede universitaria de llegada (conexión inter-campus con punto de encuentro en la sede de origen).

### 2.3 Punto de Encuentro en Campus
* Al publicar viajes saliendo de un campus (`desde_campus` o `entre_campus`), el conductor define textualmente el punto exacto de abordaje (*ej: "Portería Principal Calle 48"*, *"Bahía Parqueadero Edificio Central"*), el cual se visualiza en todas las tarjetas de viaje, mapas y banners de reserva activa.

### 2.4 Poda Espacial y Filtro Temporal (< 1 Hora)
* **Poda por Proximidad:** Evaluación del punto de partida del pasajero contra el corredor de la ruta del conductor.
* **Filtro de Horario:** Selector de hora deseada con ventana de coincidencia temporal de menos de 1 hora ($\pm 60\text{ min}$).
* **Insignias del Modelo de IA:**
  * 🟢 `Ruta directa`
  * 🟡 `Desvío viable (+X min)`
  * ⚪ `Desvío no disponible`

---

## 3. 🎨 Sistema de Diseño: Paleta Lochmara

| Token | Hex | Rol Semántico en la Interfaz |
| :--- | :--- | :--- |
| `lochmara-50` | `#f0f9ff` | Superficies sutiles y fondos secundarios en modo claro |
| `lochmara-100` | `#e0f2fe` | Badges suaves y estados hover ligeros |
| `lochmara-200` | `#bae6fd` | Bordes activos y chips seleccionados |
| `lochmara-300` | `#7dd3fc` | Líneas secundarias de conexión |
| `lochmara-400` | `#38bdf8` | Acento luminoso y telemetría GPS |
| `lochmara-500` | `#0ea5e9` | Acciones interactivas y botones secundarios |
| `lochmara-600` | `#0284c7` | **Color de Marca Principal**, trazado de ruta activa y botones primarios |
| `lochmara-700` | `#0369a1` | Estado hover de botones primarios e íconos destacados |
| `lochmara-800` | `#075985` | Encabezados de sección y textos de énfasis |
| `lochmara-900` | `#0c4a6e` | Superficies de modo oscuro |
| `lochmara-950` | `#082f49` | Fondos de alto contraste |

---

## 4. 🚀 Comandos de Desarrollo y Pruebas

```bash
# Iniciar servidor de desarrollo en red local (accesible en celular vía WiFi)
npm run dev

# Compilar paquete de producción optimizado
npm run build

# Previsualizar compilación de producción
npm run preview
```

### Probar en Dispositivos Móviles Reales:
1. Conecta tu celular a la misma red WiFi del equipo de desarrollo.
2. Abre en el navegador del teléfono: `http://<TU_IP_LOCAL>:5173` (ej. `http://192.168.1.2:5173`).
