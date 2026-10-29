import React, { useEffect, useMemo, useState } from 'react';
import { Reveal } from './Reveal';
import { API, BotonEnviar, campo, Consentimiento, ErrorCampo, Etiqueta, useEnvio } from './Formulario';
import { nombreSinSigla, UNIVERSIDADES } from '../universidades';

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
  email: '', university: '', role: '', neighborhood: '', campus_id: '', usual_time: '', direction: '', consent: false,
};

export const Waitlist = ({ onOpenPrivacy }) => {
  const [form, setForm] = useState(INICIAL);
  const [instituciones, setInstituciones] = useState([]);
  const { errores, estado, errorGeneral, enviar: enviarDatos } = useEnvio('/waitlist');

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`${API}/institutions`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('institutions'))))
      .then((json) => setInstituciones(json.data ?? []))
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  // Solo se muestran sedes si la universidad elegida tiene sedes cargadas en UniWheels.
  const sedes = useMemo(() => {
    if (!form.university) return [];
    const nombre = nombreSinSigla(form.university);
    return instituciones.find((i) => i.name === nombre)?.campuses ?? [];
  }, [form.university, instituciones]);

  const cambiar = (nombre) => (e) => {
    const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [nombre]: valor, ...(nombre === 'university' ? { campus_id: '' } : {}) }));
  };

  const enviar = (e) => {
    e.preventDefault();
    enviarDatos({ ...form, campus_id: form.campus_id ? Number(form.campus_id) : null, consent: Boolean(form.consent) });
  };

  return (
    <section id="lista-espera" className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 scroll-mt-16">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <Reveal as="h2" className="text-4xl sm:text-5xl font-bold tracking-[-0.025em] leading-[1.05]">
            Avísame cuando lancemos
          </Reveal>
          <p className="mt-5 max-w-sm text-lg leading-relaxed">
            Elige tu universidad, déjanos tu correo y cuéntanos por dónde te mueves. Usaremos esa información para
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
                Te enviamos un correo de confirmación. Usaremos tu correo solo para avisarte del lanzamiento. Si quieres que lo borremos, escríbenos a{' '}
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
                <Etiqueta htmlFor="wl-university">Universidad</Etiqueta>
                <select id="wl-university" required value={form.university} onChange={cambiar('university')}
                  aria-describedby="wl-university-err" className={campo}>
                  <option value="">Selecciona tu universidad</option>
                  {UNIVERSIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <ErrorCampo id="wl-university-err" mensajes={errores.university} />
              </div>

              {sedes.length > 0 && (
                <div className="sm:col-span-2">
                  <Etiqueta htmlFor="wl-sede">Sede</Etiqueta>
                  <select id="wl-sede" value={form.campus_id} onChange={cambiar('campus_id')}
                    aria-describedby="wl-sede-err" className={campo}>
                    <option value="">Selecciona tu sede</option>
                    {sedes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <ErrorCampo id="wl-sede-err" mensajes={errores.campus_id} />
                </div>
              )}

              <div className="sm:col-span-2">
                <Etiqueta htmlFor="wl-email">Correo (mejor el de tu universidad)</Etiqueta>
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

              <div className="sm:col-span-2">
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

              <Consentimiento id="wl-consent" checked={form.consent} onChange={cambiar('consent')}
                onOpenPrivacy={onOpenPrivacy} errores={errores.consent}>
                Autorizo el tratamiento de mi correo solo para avisarme del lanzamiento
              </Consentimiento>

              {errorGeneral && (
                <p role="alert" className="sm:col-span-2 text-sm text-red-700">{errorGeneral}</p>
              )}

              <div className="sm:col-span-2">
                <BotonEnviar enviando={estado === 'enviando'}>Avísame</BotonEnviar>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
