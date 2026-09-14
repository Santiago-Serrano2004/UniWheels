import * as Sentry from '@sentry/react';

// Debe importarse como lo PRIMERO en main.jsx, antes que cualquier otro módulo.
// Sin VITE_SENTRY_DSN (entornos donde no se configuró), el propio SDK se
// autodesactiva — comportamiento oficial documentado, no una guarda nuestra —
// así que esto nunca sale a la red cuando no hay un DSN real.
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  // 100% en desarrollo para depurar; bajo en producción para no acumular
  // volumen de traces que nadie va a revisar a ese nivel de detalle.
  tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
});
