import L from 'leaflet';
import { createVehicleMarker } from './mapIcons';

/**
 * Modelo Vectorial SVG Superior de Carro (Alta Definición)
 */
export const createCarVehicleMarker = (heading = 0, isMoving = false, color = '#0284c7') =>
  createVehicleMarker(heading, color);

/**
 * Modelo Vectorial SVG Superior de Motocicleta (Alta Definición)
 */
export const createMotoVehicleMarker = (heading = 0, isMoving = false, color = '#f59e0b') =>
  L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); transition: transform 0.08s linear;">
        ${isMoving ? '<div class="gps-beacon-ring" style="background: rgba(245, 158, 11, 0.45);"></div>' : ''}
        <svg width="42" height="42" viewBox="0 0 100 100" fill="none" style="filter: drop-shadow(0 6px 12px rgba(0,0,0,0.45));">
          <!-- Haz de luz del faro -->
          ${isMoving ? '<polygon points="50,14 24,-12 76,-12" fill="rgba(254,240,138,0.42)"/>' : ''}
          <!-- Rueda delantera -->
          <rect x="46" y="8" width="8" height="22" rx="3.5" fill="#0f172a" stroke="#64748b" stroke-width="1"/>
          <!-- Manubrio y Espejos -->
          <rect x="27" y="25" width="46" height="4.5" rx="2" fill="#334155" stroke="#ffffff" stroke-width="1"/>
          <circle cx="27" cy="27" r="3.5" fill="${color}"/>
          <circle cx="73" cy="27" r="3.5" fill="${color}"/>
          <!-- Tanque de combustible y chasis -->
          <path d="M 43 32 Q 50 26 57 32 L 60 48 Q 50 53 40 48 Z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
          <!-- Casco del Piloto con Visor -->
          <circle cx="50" cy="52" r="10.5" fill="#0f172a" stroke="#ffffff" stroke-width="1.8"/>
          <path d="M 43 49 Q 50 45 57 49 L 56 53 Q 50 50 44 53 Z" fill="#38bdf8"/>
          <!-- Chaqueta / Torso del conductor -->
          <path d="M 37 61 Q 50 57 63 61 L 59 71 Q 50 68 41 71 Z" fill="#1e293b"/>
          <!-- Rueda trasera y escape -->
          <rect x="46" y="70" width="8" height="24" rx="3.5" fill="#0f172a" stroke="#64748b" stroke-width="1"/>
          <rect x="56" y="72" width="3.5" height="15" rx="1.5" fill="#94a3b8"/>
          <!-- Luz stop trasera -->
          <circle cx="50" cy="92" r="3" fill="#ef4444"/>
        </svg>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
