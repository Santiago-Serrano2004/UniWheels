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
      },
    },
  },
  plugins: [],
};
