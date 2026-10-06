import React, { useState } from 'react';
import { Reveal } from './Reveal';
import { BotonEnviar, campo, Consentimiento, ErrorCampo, Etiqueta, useEnvio } from './Formulario';
import { UNIVERSIDADES } from '../universidades';

const PUNTOS = [
  {
    titulo: 'Panel de Bienestar',
    texto: 'Revisa los documentos de los conductores, atiende las alertas SOS y gestiona suspensiones.',
  },
  {
    titulo: 'Comunidad verificada',
    texto: 'Solo entran personas con correo de tu institución. Nadie de afuera ve las rutas.',
  },
];

const INICIAL = { name: '', position: '', university: '', email: '', phone: '', message: '', consent: false };

export const ForUniversities = ({ onOpenPrivacy }) => {
  const [form, setForm] = useState(INICIAL);
  const { errores, estado, errorGeneral, enviar } = useEnvio('/university-contact');

  const cambiar = (nombre) => (e) => {
    const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [nombre]: valor }));
  };

  const alEnviar = (e) => {
    e.preventDefault();
    enviar({ ...form, phone: form.phone || null, consent: Boolean(form.consent) });
  };

  return (
    <section id="universidades" className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 scroll-mt-16">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <Reveal as="h2" className="max-w-2xl text-4xl sm:text-5xl font-bold tracking-[-0.025em] leading-[1.05]">
            Para universidades
          </Reveal>
          <p className="mt-5 max-w-xl text-lg leading-relaxed">
            UniWheels es una plataforma de viajes compartidos solo para tu comunidad: cada persona se verifica con su
            correo institucional y cada conductor, con sus documentos.
          </p>

          <ul className="mt-10 grid gap-4">
            {PUNTOS.map((p) => (
              <li key={p.titulo} className="rounded-3xl bg-[var(--color-niebla)] p-6">
                <h3 className="text-xl font-bold tracking-[-0.015em]">{p.titulo}</h3>
                <p className="mt-2 leading-relaxed">{p.texto}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl bg-[var(--color-niebla)] border border-[var(--color-linea)] p-6 sm:p-8">
          {estado === 'ok' ? (
            <div role="status">
              <h3 className="text-2xl font-bold tracking-[-0.01em] text-[var(--color-tinta)]">Recibimos tu mensaje.</h3>
              <p className="mt-3 leading-relaxed">
                Te enviamos una confirmación a {form.email} y te responderemos en un plazo de dos días hábiles.
              </p>
            </div>
          ) : (
            <form onSubmit={alEnviar} noValidate className="grid gap-5 sm:grid-cols-2">
              <h3 className="sm:col-span-2 text-2xl font-bold tracking-[-0.01em] text-[var(--color-tinta)]">Escríbenos</h3>

              <div>
                <Etiqueta htmlFor="un-name">Nombre</Etiqueta>
                <input id="un-name" autoComplete="name" required maxLength={80} value={form.name}
                  onChange={cambiar('name')} aria-describedby="un-name-err" className={campo} />
                <ErrorCampo id="un-name-err" mensajes={errores.name} />
              </div>

              <div>
                <Etiqueta htmlFor="un-position">Cargo</Etiqueta>
                <input id="un-position" autoComplete="organization-title" required maxLength={80} value={form.position}
                  onChange={cambiar('position')} aria-describedby="un-position-err" className={campo} />
                <ErrorCampo id="un-position-err" mensajes={errores.position} />
              </div>

              <div className="sm:col-span-2">
                <Etiqueta htmlFor="un-university">Universidad</Etiqueta>
                <select id="un-university" required value={form.university} onChange={cambiar('university')}
                  aria-describedby="un-university-err" className={campo}>
                  <option value="">Selecciona la universidad</option>
                  {UNIVERSIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <ErrorCampo id="un-university-err" mensajes={errores.university} />
              </div>

              <div>
                <Etiqueta htmlFor="un-email">Correo</Etiqueta>
                <input id="un-email" type="email" autoComplete="email" required value={form.email}
                  onChange={cambiar('email')} aria-describedby="un-email-err" className={campo} />
                <ErrorCampo id="un-email-err" mensajes={errores.email} />
              </div>

              <div>
                <Etiqueta htmlFor="un-phone">Teléfono (opcional)</Etiqueta>
                <input id="un-phone" type="tel" autoComplete="tel" maxLength={30} value={form.phone}
                  onChange={cambiar('phone')} aria-describedby="un-phone-err" className={campo} />
                <ErrorCampo id="un-phone-err" mensajes={errores.phone} />
              </div>

              <div className="sm:col-span-2">
                <Etiqueta htmlFor="un-message">Mensaje</Etiqueta>
                <textarea id="un-message" required rows={4} maxLength={2000} value={form.message}
                  onChange={cambiar('message')} aria-describedby="un-message-err" className={campo} />
                <ErrorCampo id="un-message-err" mensajes={errores.message} />
              </div>

              <Consentimiento id="un-consent" checked={form.consent} onChange={cambiar('consent')}
                onOpenPrivacy={onOpenPrivacy} errores={errores.consent}>
                Autorizo el tratamiento de estos datos para responder mi mensaje
              </Consentimiento>

              {errorGeneral && <p role="alert" className="sm:col-span-2 text-sm text-red-700">{errorGeneral}</p>}

              <div className="sm:col-span-2">
                <BotonEnviar enviando={estado === 'enviando'}>Enviar mensaje</BotonEnviar>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
