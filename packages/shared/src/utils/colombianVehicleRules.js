/**
 * @file colombianVehicleRules.js
 * @description Reglas legales y normativas del Código Nacional de Tránsito de Colombia (Ley 769/2002, Ley 2294/2023).
 */

import { fechaColombiaStr } from './fechas.js';

export const FORMATO_PLACA_CARRO = /^[A-Z]{3}\d{3}$/;
export const FORMATO_PLACA_MOTO = /^[A-Z]{3}\d{2}[A-Z]$/;

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
 * Valida si una placa cumple con el formato oficial colombiano según el tipo de vehículo.
 * @param {string} placa
 * @param {'car' | 'motorcycle' | 'carro' | 'moto'} tipoVehiculo
 * @returns {{ valida: boolean, error?: string }}
 */
export function validarPlacaColombiana(placa = '', tipoVehiculo = 'car') {
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

/**
 * Formato visual con separación para la placa física (ej. KLU · 492 o UAB 12D).
 * @param {string} placa
 * @param {'car' | 'motorcycle' | 'carro' | 'moto'} tipoVehiculo
 * @returns {string}
 */
export function formatearPlacaVisual(placa = '', tipoVehiculo = 'car') {
  const limpia = String(placa).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  const esCarro = tipoVehiculo === 'car' || tipoVehiculo === 'carro';

  if (!limpia) {
    return esCarro ? 'ABC · 123' : 'ABC 12D';
  }

  if (esCarro && limpia.length >= 4) {
    return `${limpia.slice(0, 3)} · ${limpia.slice(3)}`;
  }

  if (!esCarro && limpia.length >= 4) {
    return `${limpia.slice(0, 3)} ${limpia.slice(3)}`;
  }

  return limpia;
}

/**
 * Validación de obligatoriedad de Revisión Técnico-Mecánica (RTM) en Colombia
 * - Carros particulares: Primera RTM a los 5 años desde matrícula (Ley 2294 de 2023).
 * - Motocicletas: Primera RTM a los 2 años desde matrícula.
 */
export function requiereTecnomecanica(tipoVehiculo, ano, anioActual = 2026) {
  const anioVehiculo = Number(ano);
  if (isNaN(anioVehiculo)) return false;

  const esCarro = tipoVehiculo === 'car' || tipoVehiculo === 'carro';
  if (esCarro) {
    return anioActual - anioVehiculo >= 5;
  } else {
    return anioActual - anioVehiculo >= 2;
  }
}

/**
 * Validar si una fecha de vencimiento ya expiró con respecto al día de hoy
 */
export function haExpiradoFecha(fechaVencimiento, fechaHoy = fechaColombiaStr()) {
  if (!fechaVencimiento) return false;
  return fechaVencimiento < fechaHoy;
}
