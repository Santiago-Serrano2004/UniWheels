import React, { useState } from 'react';

// Piezas comunes de los formularios de la landing (lista de espera, beta, universidades).
export const API = '/api/v1';

export const campo =
  'mt-1.5 w-full rounded-xl border border-[var(--color-linea)] bg-white px-4 py-3 text-base text-[var(--color-tinta)] focus:border-lochmara-600 focus:outline-none focus:ring-2 focus:ring-lochmara-200';

export const Etiqueta = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-sm font-semibold text-[var(--color-tinta)]">
    {children}
  </label>
);

export const ErrorCampo = ({ id, mensajes }) =>
  mensajes?.length ? (
    <p id={id} role="alert" className="mt-1.5 text-sm text-red-700">
      {mensajes.join(' ')}
    </p>
  ) : null;

export const BotonEnviar = ({ enviando, children }) => (
  <button
    type="submit"
    disabled={enviando}
    className="inline-flex items-center justify-center rounded-full bg-[var(--color-tinta)] px-6 py-3 text-sm font-semibold text-white hover:bg-lochmara-700 transition-colors disabled:opacity-60"
  >
    {enviando ? 'Enviando...' : children}
  </button>
);

// Envía un formulario JSON y traduce las respuestas de la API a estados de la interfaz.
export const useEnvio = (ruta) => {
  const [errores, setErrores] = useState({});
  const [estado, setEstado] = useState('idle'); // idle | enviando | ok
  const [errorGeneral, setErrorGeneral] = useState('');

  const enviar = async (cuerpo) => {
    setEstado('enviando');
    setErrores({});
    setErrorGeneral('');
    try {
      const res = await fetch(`${API}${ruta}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(cuerpo),
      });
      if (res.ok) {
        setEstado('ok');
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (res.status === 422 && json.errors) setErrores(json.errors);
      else if (res.status === 429) setErrorGeneral('Demasiados intentos. Inténtalo de nuevo en unos minutos.');
      else setErrorGeneral('No pudimos enviar el formulario. Inténtalo de nuevo.');
    } catch {
      setErrorGeneral('No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.');
    }
    setEstado('idle');
  };

  return { errores, estado, errorGeneral, enviar };
};

export const Consentimiento = ({ id, checked, onChange, onOpenPrivacy, errores, children }) => (
  <div className="sm:col-span-2">
    <label className="flex items-start gap-3 text-sm leading-relaxed">
      <input type="checkbox" checked={checked} onChange={onChange} aria-describedby={`${id}-err`}
        className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-tinta)]" />
      <span>
        {children}, según la{' '}
        <button type="button" onClick={onOpenPrivacy}
          className="font-semibold text-lochmara-700 underline decoration-lochmara-300 underline-offset-4 hover:decoration-lochmara-700">
          política de datos
        </button>
        .
      </span>
    </label>
    <ErrorCampo id={`${id}-err`} mensajes={errores} />
  </div>
);
