/** @type {import('tailwindcss').Config} */
// Paleta copiada literal de frontend/src/styles/tokens.css (Tailwind v4 ahí,
// v3 aquí vía NativeWind — misma fuente de verdad de color, mecanismo de
// definición distinto entre ambos proyectos). Actualizar ambos archivos juntos
// si la paleta cambia.
module.exports = {
  content: ['./src/app/**/*.{js,jsx,ts,tsx}', './src/components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        lochmara: {
          50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc',
          400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1',
          800: '#075985', 900: '#0c4a6e', 950: '#082f49',
        },
        brand: {
          primary: '#0284c7', hover: '#0369a1', active: '#075985',
          light: '#f0f9ff', glow: '#38bdf8', dark: '#082f49',
        },
        surface: {
          base: '#ffffff', muted: '#f8fafc', border: '#e2e8f0', 'border-subtle': '#f1f5f9',
        },
        status: {
          success: '#10b981', warning: '#f59e0b', danger: '#ef4444', info: '#0ea5e9',
        },
        // rose/amber/emerald: Tailwind v3 (aquí, vía NativeWind) y v4 (frontend/)
        // migraron la paleta *default* a OKLCH y varios tonos cambiaron de hex
        // real. Se fijan explícitos con el valor que compila Tailwind v4, para
        // que SOS, estados de viaje y advertencias se vean idénticos en ambas
        // plataformas pese a la diferencia de versión (no se puede subir mobile
        // a v4 todavía, NativeWind/Expo SDK 54 no lo soporta). Calculado desde
        // las variables OKLCH reales de frontend/node_modules/tailwindcss/theme.css
        // con conversión sRGB gamut-correct (culori `toGamut('rgb','oklch')`,
        // el mismo algoritmo que usa un navegador) — no adivinado a mano.
        rose: {
          50: '#fff1f2', 100: '#ffe4e6', 200: '#ffccd3', 300: '#ffa1ad',
          400: '#ff637e', 500: '#ff2056', 600: '#ec003f', 700: '#c70036',
          800: '#a50036', 900: '#8b0836', 950: '#4d0218',
        },
        amber: {
          50: '#fffbeb', 100: '#fef3c6', 200: '#fee685', 300: '#ffd230',
          400: '#ffba00', 500: '#fd9a00', 600: '#e17100', 700: '#bb4d00',
          800: '#973c00', 900: '#7b3306', 950: '#461901',
        },
        emerald: {
          50: '#ecfdf5', 100: '#d0fae5', 200: '#a4f4cf', 300: '#5ee9b5',
          400: '#00d492', 500: '#00bc7d', 600: '#009966', 700: '#007a55',
          800: '#006045', 900: '#004f3b', 950: '#002c22',
        },
      },
    },
  },
  plugins: [],
};
