// Umbrales de alerta del piloto (criterios de abandono, negocio/reporte-viabilidad-pesimista.md §12).
export const PILOT_THRESHOLDS = {
  activeUsers: 30,
  publishingDrivers: 8,
  hitRatePct: 25,
  repeat14dPct: 20,
};

const pct = (fraction) => (fraction === null || fraction === undefined ? null : fraction * 100);

/**
 * Une por semana lo que responde trip-service y route-matching-service.
 * Si una fuente no respondió, sus columnas quedan en null y `partial` se activa.
 */
export const mergeWeeklyMetrics = (trip, matching) => {
  const tripRows = trip?.data || [];
  const matchingByWeek = new Map((matching?.data || []).map((r) => [r.week_start, r]));

  const rows = tripRows.map((t) => {
    const m = matchingByWeek.get(t.week_start);
    return {
      week_start: t.week_start,
      weekly_active_users: t.weekly_active_users,
      publishing_drivers: m ? m.publishing_drivers : null,
      searches: m ? m.searches : null,
      hit_rate_pct: m ? pct(m.hit_rate) : null,
      completed_trips: t.completed_trips,
      late_cancellations: t.late_cancellations,
      repeat_14d_pct: pct(t.repeat_14d_rate),
      repeat_14d_cohort: t.repeat_14d_cohort,
      repeat_14d_immature: Boolean(t.repeat_14d_immature),
    };
  });

  return {
    rows,
    partial: !trip || !matching || Boolean(trip.partial) || Boolean(matching.partial),
  };
};

/** Estado de una tarjeta: null (sin dato), true (en meta) o false (bajo el umbral). */
export const isOnTarget = (value, threshold) => (value === null || value === undefined ? null : value >= threshold);

const fmtInt = (v) => (v === null || v === undefined ? '' : String(v));
const fmtPct = (v) => (v === null || v === undefined ? '' : v.toFixed(1));

const CSV_COLUMNS = [
  ['Semana (lunes)', (r) => r.week_start],
  ['Usuarios activos', (r) => fmtInt(r.weekly_active_users)],
  ['Conductores que publicaron', (r) => fmtInt(r.publishing_drivers)],
  ['Búsquedas', (r) => fmtInt(r.searches)],
  ['% búsquedas con resultado', (r) => fmtPct(r.hit_rate_pct)],
  ['Viajes completados', (r) => fmtInt(r.completed_trips)],
  ['Cancelaciones tardías', (r) => fmtInt(r.late_cancellations)],
  ['% repetición a 14 días', (r) => fmtPct(r.repeat_14d_pct)],
  ['Pasajeros en la cohorte', (r) => fmtInt(r.repeat_14d_cohort)],
];

const csvCell = (value) => {
  const text = String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const buildPilotCsv = (rows) =>
  [CSV_COLUMNS.map(([header]) => csvCell(header)), ...rows.map((r) => CSV_COLUMNS.map(([, get]) => csvCell(get(r))))]
    .map((line) => line.join(','))
    .join('\r\n');

export const downloadCsv = (filename, csv) => {
  // BOM para que Excel lea bien las tildes.
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
