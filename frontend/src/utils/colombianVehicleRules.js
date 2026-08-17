/**
 * @file colombianVehicleRules.js
 * @description Reglas legales y normativas del Código Nacional de Tránsito de Colombia (Ley 769/2002, Ley 2294/2023).
 */

export const COLORES_VEHICULOS = [
  'Gris / Plata',
  'Blanco',
  'Negro',
  'Rojo',
  'Azul',
  'Verde',
  'Amarillo',
  'Otro',
];

export const ANOS_VEHICULOS = Array.from({ length: 15 }, (_, i) => String(2026 - i));

/**
 * Validación de obligatoriedad de Revisión Técnico-Mecánica (RTM) en Colombia
 * - Carros particulares: Primera RTM a los 5 años desde matrícula (Ley 2294 de 2023).
 * - Motocicletas: Primera RTM a los 2 años desde matrícula.
 */
export function requiereTecnomecanica(tipoVehiculo, ano, anioActual = 2026) {
  const anioVehiculo = Number(ano);
  if (isNaN(anioVehiculo)) return false;

  if (tipoVehiculo === 'carro') {
    return anioActual - anioVehiculo >= 5;
  } else {
    return anioActual - anioVehiculo >= 2;
  }
}

/**
 * Validar si una fecha de vencimiento ya expiró con respecto al día de hoy
 */
export function haExpiradoFecha(fechaVencimiento, fechaHoy = new Date().toISOString().split('T')[0]) {
  if (!fechaVencimiento) return false;
  return fechaVencimiento < fechaHoy;
}
