const ZONA_COLOMBIA = 'America/Bogota';
const formateadorColombia = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_COLOMBIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Fecha YYYY-MM-DD en America/Bogota (Colombia no tiene horario de verano).
 * Evita `toISOString()`, que devuelve la fecha UTC: despues de las 19:00 en
 * Colombia "hoy" pasaria a ser manana.
 */
export function fechaColombiaStr(fecha = new Date()) {
  return formateadorColombia.format(fecha);
}

/** Fecha YYYY-MM-DD de un Date segun la zona horaria del dispositivo. */
export function fechaLocalStr(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
