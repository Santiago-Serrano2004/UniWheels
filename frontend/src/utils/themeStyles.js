/**
 * UniWheels Centralized Theme Design System
 * Proporciona clases de utilidad y tokens consistentes para tarjetas,
 * modales, cajas internas, inputs y botones en Light y Dark Mode.
 */

export const themeClasses = {
  // 1. Tarjeta / Contenedor Principal
  card: (isDark) =>
    `rounded-3xl border transition-colors ${
      isDark
        ? 'bg-slate-900 border-slate-800 text-white shadow-md'
        : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }`,

  // 2. Modal Contenedor Flotante
  modal: (isDark) =>
    `rounded-3xl border shadow-2xl transition-colors ${
      isDark
        ? 'bg-slate-900 border-slate-800 text-white'
        : 'bg-white border-slate-200 text-slate-900'
    }`,

  // 3. Caja Interna / Sección Anidada
  innerBox: (isDark) =>
    `rounded-2xl border transition-colors ${
      isDark
        ? 'bg-slate-950 border-slate-800 text-slate-200'
        : 'bg-slate-50 border-slate-200 text-slate-800'
    }`,

  // 4. Input / Textarea / Select
  input: (isDark) =>
    `w-full text-xs rounded-2xl px-3.5 py-3 border focus:outline-none focus:ring-2 focus:ring-lochmara-500 transition-colors ${
      isDark
        ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
    }`,

  // 5. Botón Secundario / Item de Lista
  listItem: (isDark) =>
    `transition-colors cursor-pointer ${
      isDark
        ? 'hover:bg-slate-800/70 text-slate-300'
        : 'hover:bg-slate-50 text-slate-700'
    }`,

  // 6. Badge / Icono Lochmara
  lochmaraBadge: (isDark) =>
    `border ${
      isDark
        ? 'bg-slate-800 border-slate-700 text-lochmara-400'
        : 'bg-lochmara-50 border-lochmara-200 text-lochmara-700'
    }`,

  // 7. Divider / Separador
  divider: (isDark) => (isDark ? 'border-slate-800' : 'border-slate-100'),

  // 8. Texto Secundario y Encabezado
  textMuted: (isDark) => (isDark ? 'text-slate-400' : 'text-slate-500'),
  textHeading: (isDark) => (isDark ? 'text-white' : 'text-slate-900'),
};
