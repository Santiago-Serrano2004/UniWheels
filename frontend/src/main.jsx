import './instrument.js' // MUST be first — Sentry.init() antes que cualquier otro módulo

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx'

// React 19: estos tres hooks son la red global de reporte a Sentry — cubren
// cualquier error capturado por CUALQUIER ErrorBoundary del árbol (incluido
// el nuestro, más abajo) sin que cada boundary tenga que reportar a mano.
createRoot(document.getElementById('root'), {
  onUncaughtError: Sentry.reactErrorHandler(),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <StrictMode>
    <ErrorBoundary label="app-root">
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
