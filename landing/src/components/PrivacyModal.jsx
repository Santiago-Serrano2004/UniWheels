import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, FileText, Lock, UserCheck } from 'lucide-react';

export const PrivacyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-lg max-h-[85vh] rounded-3xl p-6 shadow-2xl flex flex-col justify-between overflow-hidden border mx-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
        >
          {/* Cabecera del Modal */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-lochmara-50 dark:bg-lochmara-950 text-lochmara-600 dark:text-lochmara-400 border border-lochmara-200 dark:border-lochmara-800">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold leading-tight text-slate-900 dark:text-white">
                  Tratamiento de datos personales
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ley 1581 de 2012 y Decreto 1377 de 2013
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Cerrar modal de privacidad"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cuerpo con Scroll de la Política Legal Reutilizada */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs sm:text-sm leading-relaxed pr-1 text-slate-600 dark:text-slate-300">
            <div className="p-3.5 rounded-2xl bg-lochmara-50/70 dark:bg-slate-950 border border-lochmara-100 dark:border-slate-800 text-lochmara-900 dark:text-slate-300 font-medium">
              <span className="font-bold">Responsable del tratamiento.</span> UniWheels. Contacto: uniwheelscontact@gmail.com. La institución educativa que ofrece UniWheels a su comunidad accede a los datos necesarios para administrar el servicio desde su panel de Bienestar.
            </div>

            <div>
              <h4 className="font-bold mb-1.5 flex items-center gap-2 text-slate-900 dark:text-white">
                <FileText className="w-4 h-4 text-lochmara-500" />
                1. Qué datos tratamos
              </h4>
              <ul className="list-disc pl-5 mt-1.5 space-y-1 text-slate-600 dark:text-slate-400">
                <li>Nombre, correo institucional, código o rol en la universidad, sede y teléfono si lo registras.</li>
                <li>Rutas publicadas, reservas y ubicación durante los viajes activos.</li>
                <li>Si eres conductor: datos del vehículo y documentos (licencia de conducción, SOAT, revisión técnico-mecánica) y tu firma de autorización.</li>
                <li>Calificaciones, cancelaciones y reportes de seguridad (SOS).</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-1.5 flex items-center gap-2 text-slate-900 dark:text-white">
                <FileText className="w-4 h-4 text-lochmara-500" />
                2. Para qué los usamos
              </h4>
              <ul className="list-disc pl-5 mt-1.5 space-y-1 text-slate-600 dark:text-slate-400">
                <li>Verificar que perteneces a la comunidad universitaria.</li>
                <li>Conectar conductores y pasajeros con rutas compatibles.</li>
                <li>Permitir la revisión de los documentos del conductor por parte de Bienestar Universitario.</li>
                <li>Atender emergencias reportadas con el botón SOS y mejorar la seguridad de los viajes.</li>
                <li>Aplicar las reglas de uso, como las cancelaciones tardías y las suspensiones.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-1.5 flex items-center gap-2 text-slate-900 dark:text-white">
                <Lock className="w-4 h-4 text-lochmara-500" />
                3. Lo que no hacemos
              </h4>
              <ul className="list-disc pl-5 mt-1.5 space-y-1 text-slate-600 dark:text-slate-400">
                <li>No vendemos ni compartimos tus datos con terceros para publicidad.</li>
                <li>No procesamos pagos ni guardamos datos de tarjetas o cuentas bancarias: los aportes se pagan directamente entre usuarios.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-1.5 flex items-center gap-2 text-slate-900 dark:text-white">
                <Lock className="w-4 h-4 text-lochmara-500" />
                4. Seguridad y conservación
              </h4>
              <ul className="list-disc pl-5 mt-1.5 space-y-1 text-slate-600 dark:text-slate-400">
                <li>La comunicación entre la app y nuestros servidores viaja cifrada (HTTPS).</li>
                <li>El acceso a los documentos del conductor está restringido al personal autorizado de la institución.</li>
                <li>Los puntos de ubicación de los viajes se eliminan 7 días después de terminado el viaje.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-1.5 flex items-center gap-2 text-slate-900 dark:text-white">
                <UserCheck className="w-4 h-4 text-lochmara-500" />
                5. Tus derechos
              </h4>
              <p>
                Puedes conocer, actualizar y rectificar tus datos, solicitar prueba de la autorización, presentar quejas ante la Superintendencia de Industria y Comercio, y revocar la autorización o pedir que se eliminen tus datos. Para eliminarlos, usa <strong>Perfil &gt; Eliminar cuenta</strong> en la app, o escribe a uniwheelscontact@gmail.com. Respondemos en los plazos de ley: 10 días hábiles para consultas y 15 para reclamos.
              </p>
            </div>
          </div>

          {/* Pie de Acción */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
