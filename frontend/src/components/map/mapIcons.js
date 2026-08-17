import L from 'leaflet';

/**
 * Generador de Marcador Vectorial de Vehículo con orientación (Heading) y luces
 */
export const createVehicleMarker = (heading = 0, color = '#0284c7') =>
  L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); transition: transform 0.12s linear;">
        <div class="gps-beacon-ring"></div>
        <svg width="42" height="42" viewBox="0 0 100 100" fill="none" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35));">
          <polygon points="50,15 18,-15 82,-15" fill="rgba(254,240,138,0.45)" />
          <rect x="22" y="24" width="9" height="18" rx="3.5" fill="#0f172a" />
          <rect x="69" y="24" width="9" height="18" rx="3.5" fill="#0f172a" />
          <rect x="22" y="62" width="9" height="18" rx="3.5" fill="#0f172a" />
          <rect x="69" y="62" width="9" height="18" rx="3.5" fill="#0f172a" />
          <rect x="27" y="14" width="46" height="74" rx="15" fill="${color}" stroke="#ffffff" stroke-width="2.8" />
          <path d="M 33 34 Q 50 28 67 34 L 64 45 Q 50 41 36 45 Z" fill="#e0f2fe" opacity="0.95" />
          <rect x="34" y="45" width="32" height="22" rx="6" fill="rgba(0,0,0,0.2)" />
          <path d="M 36 69 Q 50 66 64 69 L 62 75 Q 50 73 38 75 Z" fill="#bae6fd" opacity="0.9" />
          <circle cx="34" cy="18" r="3.5" fill="#fef08a" />
          <circle cx="66" cy="18" r="3.5" fill="#fef08a" />
          <rect x="32" y="84" width="8" height="3" rx="1.5" fill="#ef4444" />
          <rect x="60" y="84" width="8" height="3" rx="1.5" fill="#ef4444" />
        </svg>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });

/**
 * Validador estricto para determinar si una ubicación o etiqueta corresponde a una Sede/Campus Universitario
 */
export const isUniversityCampusLocation = (location) => {
  if (!location) return false;
  if (typeof location === 'object') {
    if (location.isCampus || location.type === 'campus') return true;
    if (location.name) return isUniversityCampusLocation(location.name);
    if (location.destination) return isUniversityCampusLocation(location.destination);
    if (location.origin) return isUniversityCampusLocation(location.origin);
    return false;
  }
  const str = String(location).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return (
    str.includes('campus') ||
    str.includes('universidad') ||
    str.includes('unab') ||
    str.includes('jardin') ||
    str.includes('bosque') ||
    str.includes('csu') ||
    str.includes('casona') ||
    str.includes('sede ') ||
    str.includes('facultad') ||
    str.includes('rectoria') ||
    str.includes('uis') ||
    str.includes('upb') ||
    str.includes('usta')
  );
};

/**
 * Generador Universal de Marcador Pin Teardrop Geométrico con Anclaje Exacto
 * Opcionalmente incluye un Birrete Académico Vectorial sobre la corona del pin si es Campus Universitario
 */
export const createTeardropPin = (
  color = '#0284c7',
  dotColor = '#ffffff',
  label = '',
  isPulse = false,
  forceBirrete = false
) => {
  const isCampus = forceBirrete || isUniversityCampusLocation(label);

  const birreteHtml = isCampus
    ? `
      <div style="position: absolute; top: -16px; left: 50%; transform: translateX(-50%); width: 30px; height: 20px; pointer-events: none; z-index: 30;">
        <svg viewBox="0 0 32 24" fill="none" style="width: 100%; height: 100%; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.6));">
          <!-- Casquete inferior del birrete -->
          <path d="M 8 10.5 L 8 15.5 C 8 19 24 19 24 15.5 L 24 10.5" fill="#0f172a" stroke="#ffffff" stroke-width="1.3"/>
          <!-- Tapa superior en rombo -->
          <polygon points="16,2 31,8.5 16,15 1,8.5" fill="#0f172a" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
          <!-- Botón central -->
          <circle cx="16" cy="8.5" r="1.6" fill="#f59e0b"/>
          <!-- Borla colgante dorada con pompón -->
          <path d="M 16 8.5 Q 25 9.5 27 14.5" stroke="#f59e0b" stroke-width="1.6" stroke-linecap="round"/>
          <circle cx="27" cy="15.5" r="2" fill="#f59e0b"/>
        </svg>
      </div>
    `
    : '';

  return L.divIcon({
    className: 'custom-teardrop-pin',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        ${isPulse ? '<div class="gps-beacon-ring" style="inset: -4px;"></div>' : ''}
        
        <!-- Pin Teardrop Base -->
        <div style="width: 36px; height: 36px; background: ${color}; border: 3px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 5px 14px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; position: relative; z-index: 10;">
          <div style="width: 11px; height: 11px; background: ${dotColor}; border-radius: 50%; transform: rotate(45deg);"></div>
        </div>

        <!-- Birrete colocado por encima del Pin -->
        ${birreteHtml}

        ${
          label
            ? `<span style="position: absolute; bottom: ${isCampus ? '48px' : '42px'}; left: 50%; transform: translateX(-50%); background: #0f172a; color: #ffffff; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 9999px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.25); pointer-events: none; z-index: 40;">${label}</span>`
            : ''
        }
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

/**
 * Generador de Marcador de Ubicación del Usuario (Pasajero con Faro de Pulsación)
 */
export const createUserLocationMarker = (isLive = true, label = '') =>
  createTeardropPin('#0284c7', '#ffffff', label, isLive, false);

/**
 * Generador de Pin de Parada / Recogida (Ámbar con punto blanco)
 */
export const createPickupMarker = (label = 'Punto de recogida') =>
  createTeardropPin('#f59e0b', '#ffffff', label, false, isUniversityCampusLocation(label));

/**
 * Generador de Pin de Parada Directa / En Ruta (Esmeralda con punto blanco)
 */
export const createDirectPickupMarker = (label = 'En ruta') =>
  createTeardropPin('#10b981', '#ffffff', label, false, isUniversityCampusLocation(label));

/**
 * Generador de Pin de Campus / Destino Universitario (Azul institucional con birrete)
 */
export const createCampusMarker = (label = 'Campus') =>
  createTeardropPin('#0284c7', '#ffffff', label, false, true);

/**
 * Generador de Pin Genérico con Color Personalizado
 */
export const createCustomPin = (color = '#0284c7', label = '', forceBirrete = false) =>
  createTeardropPin(color, '#ffffff', label, false, forceBirrete || isUniversityCampusLocation(label));


