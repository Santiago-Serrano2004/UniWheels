import React from 'react';
import { LegalPage } from './LegalPage';

// Texto aprobado por el usuario el 2026-10-05 (docs/TIENDAS.md §7). Pendiente de revisión legal.
const SECCIONES = [
  {
    titulo: '1. Qué es UniWheels',
    texto:
      'Una herramienta para que miembros verificados de una comunidad universitaria coordinen viajes compartidos. UniWheels no presta servicios de transporte ni es empleador de los conductores.',
  },
  {
    titulo: '2. Quién puede usarla',
    texto: 'Mayores de edad con correo institucional vigente de una institución aliada.',
  },
  {
    titulo: '3. Aporte de gastos',
    texto:
      'El conductor indica un aporte por cupo que no puede superar el valor sugerido por la app. El aporte se paga directamente entre usuarios, fuera de la app. UniWheels no cobra comisión, no procesa pagos y no media en disputas de dinero.',
  },
  {
    titulo: '4. Obligaciones del conductor',
    texto:
      'Tener licencia vigente, SOAT y revisión técnico-mecánica al día, mantener el vehículo en buen estado y cumplir las normas de tránsito. Bienestar Universitario verifica los documentos, pero la responsabilidad sobre el vehículo y la conducción es del conductor.',
  },
  {
    titulo: '5. Conducta',
    texto:
      'Se espera respeto, puntualidad y el uso del PIN de abordaje. Está prohibido el acoso, la discriminación y el uso comercial (transportar personas ajenas a la comunidad o cobrar por encima del aporte).',
  },
  {
    titulo: '6. Cancelaciones',
    texto:
      'Las cancelaciones tardías quedan registradas. Al acumular 3 en 30 días, la cuenta se suspende por 30 días.',
  },
  {
    titulo: '7. Seguridad',
    texto:
      'El botón SOS avisa a tus contactos y a la institución, pero no reemplaza a las líneas de emergencia (123).',
  },
  {
    titulo: '8. Suspensión',
    texto: 'La institución o UniWheels pueden suspender cuentas que incumplan estos términos.',
  },
  {
    titulo: '9. Datos personales',
    texto: 'Se tratan según la política de privacidad.',
    enlacePrivacidad: true,
  },
  {
    titulo: '10. Limitación de responsabilidad',
    texto:
      'UniWheels no responde por los actos de los usuarios ni por los accidentes durante los viajes, en la medida permitida por la ley colombiana.',
  },
  {
    titulo: '11. Cambios',
    texto: 'Estos términos pueden cambiar. Si el cambio es importante, se avisará en la app.',
  },
  {
    titulo: '12. Ley aplicable y contacto',
    texto: 'Se rigen por las leyes de Colombia. Contacto: uniwheelscontact@gmail.com.',
  },
];

export const TermsPage = () => (
  <LegalPage title="Términos de uso" subtitle="Condiciones para usar UniWheels">
    <div className="space-y-6 text-sm leading-relaxed text-slate-600">
      {SECCIONES.map((s) => (
        <section key={s.titulo}>
          <h2 className="font-bold text-base text-slate-900">{s.titulo}</h2>
          <p className="mt-1.5">
            {s.texto}
            {s.enlacePrivacidad && (
              <>
                {' '}
                <a href="/privacidad" className="text-lochmara-700 underline">
                  Ver la política de privacidad
                </a>
                .
              </>
            )}
          </p>
        </section>
      ))}
    </div>
  </LegalPage>
);
