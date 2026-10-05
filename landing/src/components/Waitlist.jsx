import React, { useEffect, useMemo, useState } from 'react';
import { Reveal } from './Reveal';

const API = '/api/v1';

const BARRIOS = [
  'Cabecera del Llano', 'Sotomayor', 'Bolarquí', 'La Aurora', 'Mutis', 'San Francisco', 'Alarcón',
  'García Rovira', 'Ciudadela Real de Minas', 'Provenza', 'Mejoras Públicas', 'Cañaveral',
  'Lagos del Cacique', 'Floridablanca Centro', 'Ruitoque', 'Piedecuesta Centro', 'Girón Centro',
  'San Alonso', 'Álvarez', 'Kennedy', 'La Concordia', 'Los Pinos', 'Conucos', 'Terrazas',
];

const ROLES = [
  { value: 'pasajero', label: 'Viajar como pasajero' },
  { value: 'conductor', label: 'Llevar gente en mi carro o moto' },
  { value: 'ambos', label: 'Ambos' },
];

const FRANJAS = ['06-08', '08-10', '10-12', '12-14', '14-16', '16-18', '18-20', '20-22'];

const SENTIDOS = [
  { value: 'hacia_campus', label: 'Hacia la universidad' },
  { value: 'desde_campus', label: 'Desde la universidad' },
  { value: 'ambas', label: 'Ambos sentidos' },
];

const INICIAL = {
  email: '', role: '', neighborhood: '', campus_id: '', usual_time: '', direction: '', consent: false,
};

const campo =
  'mt-1.5 w-full rounded-xl border border-[var(--color-linea)] bg-white px-4 py-3 text-base text-[var(--color-tinta)] focus:border-lochmara-600 focus:outline-none focus:ring-2 focus:ring-lochmara-200';

const Etiqueta = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-sm font-semibold text-[var(--color-tinta)]">
    {children}
  </label>
);

const ErrorCampo = ({ id, mensajes }) =>
  mensajes?.length ? (
    <p id={id} role="alert" className="mt-1.5 text-sm text-red-700">
      {mensajes.join(' ')}
    </p>
  ) : null;

export const Waitlist = ({ onOpenPrivacy }) => {
  const [form, setForm] = useState(INICIAL);
  const [instituciones, setInstituciones] = useState([]);
  const [errores, setErrores] = useState({});
  const [estado, setEstado] = useState('idle'); // idle | enviando | ok
  const [errorGeneral, setErrorGeneral] = useState('');

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`${API}/institutions`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('institutions'))))
      .then((json) => setInstituciones(json.data ?? []))
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  const sedes = useMemo(() => {
    const dominio = form.email.split('@')[1]?.trim().toLowerCase();
    if (!dominio) return [];
    return instituciones.find((i) => i.domain === dominio)?.campuses ?? [];
  }, [form.email, instituciones]);

  const cambiar = (nombre) => (e) => {
    const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [nombre]: valor, ...(nombre === 'email' ? { campus_id: '' } : {}) }));
  };

  const enviar = async (e) => {
    e.preventDefault();
    setEstado('enviando');
    setErrores({});
    setErrorGeneral('');
    try {
      const res = await fetch(`${API}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...form,
          campus_id: form.campus_id ? Number(form.campus_id) : null,
          consent: form.consent ? true : false,
        }),
      });
      if (res.ok) {
        setEstado('ok');
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (res.status === 422 && json.errors) setErrores(json.errors);
      else if (res.status === 429) setErrorGeneral('Demasiados intentos. Inténtalo de nuevo en unos minutos.');
      else setErrorGeneral('No pudimos registrar tu correo. Inténtalo de nuevo.');
    } catch {
      setErrorGeneral('No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.');
    }
    setEstado('idle');
  };

  return (
    <section id="lista-espera" className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 scroll-mt-16">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <Reveal as="h2" className="text-4xl sm:text-5xl font-bold tracking-[-0.025em] leading-[1.05]">
            Avísame cuando lancemos
          </Reveal>
          <p className="mt-5 max-w-sm text-lg leading-relaxed">
            Déjanos tu correo institucional y cuéntanos por dónde te mueves. Usaremos esa información para
            abrir primero los corredores con más demanda.
          </p>
        </div>

        <div className="rounded-3xl bg-[var(--color-niebla)] border border-[var(--color-linea)] p-6 sm:p-8">
          {estado === 'ok' ? (
            <div role="status">
              <h3 className="text-2xl font-bold tracking-[-0.01em] text-[var(--color-tinta)]">
                Listo. Te avisaremos cuando UniWheels llegue a tu universidad.
              </h3>
              <p className="mt-3 leading-relaxed">
                Usaremos tu correo solo para avisarte del lanzamiento. Si quieres que lo borremos, escríbenos a{' '}
                <a
                  href="mailto:uniwheelscontact@gmail.com"
                  className="font-semibold text-lochmara-700 underline decoration-lochmara-300 underline-offset-4"
                >
                  uniwheelscontact@gmail.com
                </a>
                .
              </p>
            </div>
          ) : (
            <form onSubmit={enviar} noValidate className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Etiqueta htmlFor="wl-email">Correo institucional</Etiqueta>
                <input id="wl-email" type="email" autoComplete="email" required value={form.email}
                  onChange={cambiar('email')} aria-describedby="wl-email-err" className={campo} />
                <ErrorCampo id="wl-email-err" mensajes={errores.email} />
              </div>

              <div className="sm:col-span-2">
                <Etiqueta htmlFor="wl-role">Quiero</Etiqueta>
                <select id="wl-role" required value={form.role} onChange={cambiar('role')}
                  aria-describedby="wl-role-err" className={campo}>
                  <option value="">Selecciona una opción</option>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <ErrorCampo id="wl-role-err" mensajes={errores.role} />
              </div>

              <div>
                <Etiqueta htmlFor="wl-barrio">Barrio</Etiqueta>
                <input id="wl-barrio" type="text" list="wl-barrios" maxLength={80} required
                  value={form.neighborhood} onChange={cambiar('neighborhood')}
                  aria-describedby="wl-barrio-err" className={campo} />
                <datalist id="wl-barrios">
                  {BARRIOS.map((b) => <option key={b} value={b} />)}
                </datalist>
                <ErrorCampo id="wl-barrio-err" mensajes={errores.neighborhood} />
              </div>

              <div>
                <Etiqueta htmlFor="wl-sede">Sede</Etiqueta>
                <select id="wl-sede" value={form.campus_id} onChange={cambiar('campus_id')}
                  disabled={sedes.length === 0} aria-describedby="wl-sede-err" className={`${campo} disabled:opacity-60`}>
                  <option value="">
                    {sedes.length === 0 ? 'Escribe tu correo para ver las sedes' : 'Selecciona tu sede'}
                  </option>
                  {sedes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ErrorCampo id="wl-sede-err" mensajes={errores.campus_id} />
              </div>

              <div>
                <Etiqueta htmlFor="wl-franja">Franja horaria habitual</Etiqueta>
                <select id="wl-franja" required value={form.usual_time} onChange={cambiar('usual_time')}
                  aria-describedby="wl-franja-err" className={campo}>
                  <option value="">Selecciona una franja</option>
                  {FRANJAS.map((f) => <option key={f} value={f}>{`${f.slice(0, 2)}:00 a ${f.slice(3)}:00`}</option>)}
                </select>
                <ErrorCampo id="wl-franja-err" mensajes={errores.usual_time} />
              </div>

              <div>
                <Etiqueta htmlFor="wl-sentido">Sentido</Etiqueta>
                <select id="wl-sentido" required value={form.direction} onChange={cambiar('direction')}
                  aria-describedby="wl-sentido-err" className={campo}>
                  <option value="">Selecciona el sentido</option>
                  {SENTIDOS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <ErrorCampo id="wl-sentido-err" mensajes={errores.direction} />
              </div>

              <div className="sm:col-span-2">
                <label className="flex items-start gap-3 text-sm leading-relaxed">
                  <input type="checkbox" checked={form.consent} onChange={cambiar('consent')}
                    aria-describedby="wl-consent-err" className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-tinta)]" />
                  <span>
                    Autorizo el tratamiento de mi correo solo para avisarme del lanzamiento, según la{' '}
                    <button type="button" onClick={onOpenPrivacy}
                      className="font-semibold text-lochmara-700 underline decoration-lochmara-300 underline-offset-4 hover:decoration-lochmara-700">
                      política de datos
                    </button>
                    .
                  </span>
                </label>
                <ErrorCampo id="wl-consent-err" mensajes={errores.consent} />
              </div>

              {errorGeneral && (
                <p role="alert" className="sm:col-span-2 text-sm text-red-700">{errorGeneral}</p>
              )}

              <div className="sm:col-span-2">
                <button type="submit" disabled={estado === 'enviando'}
                  className="inline-flex items-center justify-center rounded-full bg-[var(--color-tinta)] px-6 py-3 text-sm font-semibold text-white hover:bg-lochmara-700 transition-colors disabled:opacity-60">
                  {estado === 'enviando' ? 'Enviando...' : 'Avísame'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
