import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { ArrowRight, ShieldCheck, MapPin } from 'lucide-react';

export const InstitutionalWelcomeModal = ({ isOpen, onClose }) => {
  const { user, theme } = useAppStore();
  const isDark = theme === 'dark';

  if (!isOpen || !user) return null;

  const imagenBienvenida =
    user?.institutionWelcomeImage ||
    user?.institution?.welcome_image_url ||
    '/assets/institutions/unab-mascot.png';

  const nombreInstitucion =
    user?.institution?.name || user?.institution || 'Universidad Autónoma de Bucaramanga';

  const nombreSede = user?.campus?.name || user?.campus || 'Campus El Jardín';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 20 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full max-w-[340px] max-h-[85vh] rounded-3xl p-5 shadow-2xl border flex flex-col items-center text-center overflow-y-auto mx-auto transition-colors ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Resplandor decorativo de fondo */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-lochmara-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Imagen de la Mascota Institucional con Proporciones Preservadas */}
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="my-3 relative z-10 flex items-center justify-center h-48 w-full"
          >
            <img
              src={imagenBienvenida}
              alt="Mascota Institucional"
              className="max-h-48 max-w-[200px] w-auto h-auto object-contain drop-shadow-xl select-none pointer-events-none"
            />
          </motion.div>

          {/* Saludo y Mensaje */}
          <div className="space-y-1.5 z-10 mb-5">
            <h3 className={`text-xl font-extrabold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              ¡Hola, {user?.name ? user.name.split(' ')[0] : 'Estudiante'}!
            </h3>
            <p className="text-xs font-semibold text-lochmara-400">
              {nombreInstitucion}
            </p>
            <div className={`inline-flex items-center gap-1 text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <MapPin className="w-3 h-3 text-lochmara-500" />
              <span>{nombreSede}</span>
            </div>
            <p className={`text-xs pt-1 leading-relaxed max-w-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Tu cuenta universitaria ha sido validada. Ya puedes compartir y solicitar rutas diarias seguras con compañeros de tu comunidad.
            </p>
          </div>

          {/* Botón de Entrada */}
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-lochmara-600/25 z-10"
          >
            <span>Comenzar a Viajar</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Sello */}
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 pt-3 z-10">
            <ShieldCheck className="w-3.5 h-3.5 text-lochmara-500" />
            <span>Movilidad Universitaria Segura</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
