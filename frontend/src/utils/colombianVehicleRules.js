/**
 * @file colombianVehicleRules.js
 * @description Reglas legales y normativas del Código Nacional de Tránsito de Colombia (Ley 769/2002, Ley 2294/2023).
 */

export const FORMATO_PLACA_CARRO = /^[A-Z]{3}\d{3}$/;
export const FORMATO_PLACA_MOTO = /^[A-Z]{3}\d{2}[A-Z]$/;

/**
 * Valida si una placa cumple con el formato oficial colombiano según el tipo de vehículo.
 * @param {string} placa
 * @param {'car' | 'motorcycle' | 'carro' | 'moto'} tipoVehiculo
 * @returns {{ valida: boolean, error?: string }}
 */
export function validarPlacaColombiana(placa = '', tipoVehiculo = 'carro') {
  const placaNorm = String(placa).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const esCarro = tipoVehiculo === 'car' || tipoVehiculo === 'carro';

  if (!placaNorm) {
    return { valida: false, error: 'Ingresa la placa vehicular.' };
  }

  if (placaNorm.length !== 6) {
    return {
      valida: false,
      error: `La placa debe tener exactamente 6 caracteres (${placaNorm.length}/6).`,
    };
  }

  if (esCarro) {
    const valida = FORMATO_PLACA_CARRO.test(placaNorm);
    return {
      valida,
      error: valida
        ? undefined
        : 'La placa de carro debe tener 3 letras seguidas de 3 números (ej: KLU492).',
    };
  } else {
    const valida = FORMATO_PLACA_MOTO.test(placaNorm);
    return {
      valida,
      error: valida
        ? undefined
        : 'La placa de moto debe tener 3 letras, 2 números y 1 letra (ej: UAB12D).',
    };
  }
}

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
