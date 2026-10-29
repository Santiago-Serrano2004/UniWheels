import React, { useState } from 'react';
import { Reveal } from './Reveal';
import { BotonEnviar, campo, Consentimiento, ErrorCampo, Etiqueta, useEnvio } from './Formulario';
import { UNIVERSIDADES } from '../universidades';

const PLATAFORMAS = [
  { value: 'ios', label: 'iPhone' },
  { value: 'android', label: 'Android' },
];

const ROLES = [
  { value: 'pasajero', label: 'Viajar como pasajero' },
  { value: 'conductor', label: 'Llevar gente en mi carro o moto' },
  { value: 'ambos', label: 'Ambos' },
];

const INICIAL = { name: '', email: '', university: '', platform: '', role: '', consent: false };

export const Beta = ({ onOpenPrivacy }) => {
  const [form, setForm] = useState(INICIAL);
  const { errores, estado, errorGeneral, enviar } = useEnvio('/beta');

  const cambiar = (nombre) => (e) => {
    const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [nombre]: valor }));
  };

  const alEnviar = (e) => {
    e.preventDefault();
    enviar({ ...form, consent: Boolean(form.consent) });
  };

  return (
    <section id="beta" className="bg-[var(--color-niebla)] scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <Reveal as="h2" className="text-4xl sm:text-5xl font-bold tracking-[-0.025em] leading-[1.05]">
            Prueba la beta
          </Reveal>
          <p className="mt-5 max-w-sm text-lg leading-relaxed">
            Usa UniWheels antes del lanzamiento y ayúdanos a dejarla lista. Abrimos cupos por universidad y te
            escribimos con las instrucciones para instalarla.
          </p>
        </div>

        <div className="rounded-3xl bg-white border border-[var(--color-linea)] p-6 sm:p-8">
          {estado === 'ok' ? (
            <div role="status">
              <h3 className="text-2xl font-bold tracking-[-0.01em] text-[var(--color-tinta)]">Quedaste inscrito en la beta.</h3>
              <p className="mt-3 leading-relaxed">
                Te enviamos una confirmación a {form.email}. Cuando haya un cupo para tu universidad, te escribimos con
                los pasos para instalar la app.
              </p>
            </div>
          ) : (
            <form onSubmit={alEnviar} noValidate className="grid gap-5 sm:grid-cols-2">
              <div>
                <Etiqueta htmlFor="bt-name">Nombre</Etiqueta>
                <input id="bt-name" autoComplete="name" required maxLength={80} value={form.name}
                  onChange={cambiar('name')} aria-describedby="bt-name-err" className={campo} />
                <ErrorCampo id="bt-name-err" mensajes={errores.name} />
              </div>

              <div>
                <Etiqueta htmlFor="bt-email">Correo</Etiqueta>
                <input id="bt-email" type="email" autoComplete="email" required value={form.email}
                  onChange={cambiar('email')} aria-describedby="bt-email-err" className={campo} />
                <ErrorCampo id="bt-email-err" mensajes={errores.email} />
              </div>

              <div className="sm:col-span-2">
                <Etiqueta htmlFor="bt-university">Universidad</Etiqueta>
                <select id="bt-university" required value={form.university} onChange={cambiar('university')}
                  aria-describedby="bt-university-err" className={campo}>
                  <option value="">Selecciona tu universidad</option>
                  {UNIVERSIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <ErrorCampo id="bt-university-err" mensajes={errores.university} />
              </div>

              <div>
                <Etiqueta htmlFor="bt-platform">Tu teléfono</Etiqueta>
                <select id="bt-platform" required value={form.platform} onChange={cambiar('platform')}
                  aria-describedby="bt-platform-err" className={campo}>
                  <option value="">Selecciona una opción</option>
                  {PLATAFORMAS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <ErrorCampo id="bt-platform-err" mensajes={errores.platform} />
              </div>

              <div>
                <Etiqueta htmlFor="bt-role">Quiero</Etiqueta>
                <select id="bt-role" required value={form.role} onChange={cambiar('role')}
                  aria-describedby="bt-role-err" className={campo}>
                  <option value="">Selecciona una opción</option>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <ErrorCampo id="bt-role-err" mensajes={errores.role} />
              </div>

              <Consentimiento id="bt-consent" checked={form.consent} onChange={cambiar('consent')}
                onOpenPrivacy={onOpenPrivacy} errores={errores.consent}>
                Autorizo el tratamiento de estos datos para invitarme a la beta
              </Consentimiento>

              {errorGeneral && <p role="alert" className="sm:col-span-2 text-sm text-red-700">{errorGeneral}</p>}

              <div className="sm:col-span-2">
                <BotonEnviar enviando={estado === 'enviando'}>Inscribirme a la beta</BotonEnviar>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
