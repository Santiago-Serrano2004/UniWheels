import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

/**
 * Última red de seguridad ante errores de render no controlados. Sin esto, un
 * componente que revienta (ej. datos inesperados del backend, un mapa de Leaflet
 * mal inicializado) tumba toda la SPA a pantalla blanca sin ningún mensaje.
 *
 * Se usa en dos niveles: uno global envolviendo <App /> (fallback de página
 * completa, único recurso es recargar) y uno por vista principal dentro del
 * switch de App.jsx (fallback contenido, con botón para volver a Inicio sin
 * perder el resto de la interfaz — header, bottom nav, isla de viaje activo).
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // El reporte a Sentry ya ocurre automáticamente vía el hook `onCaughtError`
    // configurado en createRoot (main.jsx) — no se llama a Sentry aquí para no
    // duplicar el evento. Esto solo deja rastro en consola para depuración local.
    console.error('[ErrorBoundary]', this.props.label || 'unlabeled', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.variant === 'silent') {
      // Widgets periféricos siempre visibles (header, isla de viaje activo): mejor
      // que desaparezcan sin ruido a que muestren una tarjeta de error en cada pantalla.
      return null;
    }

    const isDark =
      typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    if (this.props.variant === 'contained') {
      return (
        <div
          className={`h-full flex flex-col items-center justify-center text-center p-6 space-y-3 select-none ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-black">Algo salió mal en esta sección</p>
            <p className={`text-xs max-w-xs mx-auto mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Puedes intentarlo de nuevo o volver al inicio. El resto de la app sigue funcionando con normalidad.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={this.handleReset}
              className="py-2 px-4 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Intentar de nuevo</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`h-[100dvh] w-full flex flex-col items-center justify-center text-center p-6 space-y-4 select-none ${
          isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
        }`}
      >
        <div className="w-14 h-14 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div>
          <p className="text-base font-black">UniWheels tuvo un problema inesperado</p>
          <p className={`text-xs max-w-xs mx-auto mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Nuestro equipo ya quedó al tanto. Intenta recargar la aplicación.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="py-3 px-6 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 text-white text-sm font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-lochmara-600/25"
        >
          <Home className="w-4 h-4" />
          <span>Recargar Aplicación</span>
        </button>
      </div>
    );
  }
}
