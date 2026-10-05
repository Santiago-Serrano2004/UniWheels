import React from 'react';
import { FileText, Lock, UserCheck } from 'lucide-react';

/** Texto de la política de tratamiento de datos, compartido por el modal y la página /privacidad. */
export const PrivacyContent = () => (
  <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-600">
      <div className="p-3.5 rounded-2xl bg-lochmara-50/70 border border-lochmara-100 text-lochmara-900 font-medium">
        <span className="font-bold">Responsable del tratamiento.</span> UniWheels. Contacto: uniwheelscontact@gmail.com. La institución educativa que ofrece UniWheels a su comunidad accede a los datos necesarios para administrar el servicio desde su panel de Bienestar.
      </div>

      <div>
        <h4 className="font-bold mb-1.5 flex items-center gap-2 text-slate-900">
          <FileText className="w-4 h-4 text-lochmara-500" />
          1. Qué datos tratamos
        </h4>
        <ul className="list-disc pl-5 mt-1.5 space-y-1 text-slate-600">
          <li>Nombre, correo institucional, código o rol en la universidad, sede y teléfono si lo registras.</li>
          <li>Rutas publicadas, reservas y ubicación durante los viajes activos.</li>
          <li>Si eres conductor: datos del vehículo y documentos (licencia de conducción, SOAT, revisión técnico-mecánica) y tu firma de autorización.</li>
          <li>Calificaciones, cancelaciones y reportes de seguridad (SOS).</li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold mb-1.5 flex items-center gap-2 text-slate-900">
          <FileText className="w-4 h-4 text-lochmara-500" />
          2. Para qué los usamos
        </h4>
        <ul className="list-disc pl-5 mt-1.5 space-y-1 text-slate-600">
          <li>Verificar que perteneces a la comunidad universitaria.</li>
          <li>Conectar conductores y pasajeros con rutas compatibles.</li>
          <li>Permitir la revisión de los documentos del conductor por parte de Bienestar Universitario.</li>
          <li>Atender emergencias reportadas con el botón SOS y mejorar la seguridad de los viajes.</li>
          <li>Aplicar las reglas de uso, como las cancelaciones tardías y las suspensiones.</li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold mb-1.5 flex items-center gap-2 text-slate-900">
          <Lock className="w-4 h-4 text-lochmara-500" />
          3. Lo que no hacemos
        </h4>
        <ul className="list-disc pl-5 mt-1.5 space-y-1 text-slate-600">
          <li>No vendemos ni compartimos tus datos con terceros para publicidad.</li>
          <li>No procesamos pagos ni guardamos datos de tarjetas o cuentas bancarias: los aportes se pagan directamente entre usuarios.</li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold mb-1.5 flex items-center gap-2 text-slate-900">
          <Lock className="w-4 h-4 text-lochmara-500" />
          4. Seguridad y conservación
        </h4>
        <ul className="list-disc pl-5 mt-1.5 space-y-1 text-slate-600">
          <li>La comunicación entre la app y nuestros servidores viaja cifrada (HTTPS).</li>
          <li>El acceso a los documentos del conductor está restringido al personal autorizado de la institución.</li>
          <li>Los puntos de ubicación de los viajes se eliminan 7 días después de terminado el viaje.</li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold mb-1.5 flex items-center gap-2 text-slate-900">
          <UserCheck className="w-4 h-4 text-lochmara-500" />
          5. Tus derechos
        </h4>
        <p>
          Puedes conocer, actualizar y rectificar tus datos, solicitar prueba de la autorización, presentar quejas ante la Superintendencia de Industria y Comercio, y revocar la autorización o pedir que se eliminen tus datos. Para eliminarlos, usa <strong>Perfil &gt; Eliminar cuenta</strong> en la app, o escribe a uniwheelscontact@gmail.com. Respondemos en los plazos de ley: 10 días hábiles para consultas y 15 para reclamos.
        </p>
      </div>
  </div>
);
