import React from 'react';
import { LegalPage } from './LegalPage';

export const SupportPage = () => (
  <LegalPage title="Soporte" subtitle="Ayuda con UniWheels">
    <div className="space-y-6 text-sm leading-relaxed text-slate-600">
      <section>
        <h2 className="font-bold text-base text-slate-900">Contacto</h2>
        <p className="mt-1.5">
          Escríbenos a{' '}
          <a href="mailto:uniwheelscontact@gmail.com" className="text-lochmara-700 underline">
            uniwheelscontact@gmail.com
          </a>
          . Describe tu problema e indica el correo con el que te registraste.
        </p>
      </section>
      <section>
        <h2 className="font-bold text-base text-slate-900">Cómo eliminar tu cuenta</h2>
        <p className="mt-1.5">
          Abre la app y ve a <strong>Perfil &gt; Eliminar cuenta</strong>. También puedes
          solicitarlo por correo al contacto anterior.
        </p>
      </section>
      <section>
        <h2 className="font-bold text-base text-slate-900">Tus datos</h2>
        <p className="mt-1.5">
          Consulta cómo tratamos tus datos en la{' '}
          <a href="/privacidad" className="text-lochmara-700 underline">
            política de privacidad
          </a>
          .
        </p>
      </section>
    </div>
  </LegalPage>
);
