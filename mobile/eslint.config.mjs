import expo from 'eslint-config-expo/flat.js';

export default [
  ...expo,
  {
    ignores: ['dist/**', '.expo/**', 'node_modules/**'],
  },
  {
    // Reglas del React Compiler que trajo eslint-config-expo 57 (react-hooks 7.x).
    // Marcan patrones preexistentes en 12 archivos (GPS, cockpit, wizard); en
    // runtime no rompen nada, el compilador solo omite optimizar esos
    // componentes. Pendiente de refactor en specs/mobile-sdk-57-migracion.md.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
];
