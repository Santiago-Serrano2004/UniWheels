import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { config as loadDotenv } from 'dotenv';

// Convención de @sentry/vite-plugin: el token vive en .env.sentry-build-plugin
// (gitignored, nunca en .env de Vite — ese sí se embebe en el bundle público).
loadDotenv({ path: '.env.sentry-build-plugin' });

// Subida de source maps a Sentry — solo se activa si SENTRY_AUTH_TOKEN está en el
// entorno del build (variable de servidor/CI, nunca del bundle público, a diferencia
// del DSN). Sin token, `npm run build` sigue funcionando normal, solo sin subir nada:
// no falla el build local de nadie que no tenga el token configurado.
const sentryPlugins = process.env.SENTRY_AUTH_TOKEN
  ? [
      sentryVitePlugin({
        org: process.env.SENTRY_ORG || 'uniwheels',
        project: process.env.SENTRY_PROJECT || 'javascript-react',
        authToken: process.env.SENTRY_AUTH_TOKEN,
      }),
    ]
  : [];

// Configuracion de Vite con soporte para React, Tailwind CSS v4 y Code Splitting optimizado
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...sentryPlugins,
  ],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    // Necesario para que Sentry pueda de-minificar los stack traces reales — los
    // mapas se generan siempre, pero solo se suben a Sentry cuando hay authToken
    // (arriba); "hidden" los deja fuera de los <script> públicos del HTML.
    sourcemap: 'hidden',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('zustand') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            if (id.includes('leaflet')) {
              return 'vendor-leaflet';
            }
            if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) {
              return 'vendor-motion';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('axios')) {
              return 'vendor-axios';
            }
            return 'vendor-core';
          }
        },
      },
    },
  },
});
