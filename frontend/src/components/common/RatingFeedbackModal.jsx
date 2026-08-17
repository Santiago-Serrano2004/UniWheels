import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { Star, X, CheckCircle2, ThumbsUp } from 'lucide-react';

export const RatingFeedbackModal = ({
  isOpen,
  onClose,
  targetType = 'passenger', // 'passenger' | 'driver'
  targetName = 'Estudiante',
  _targetRoleInfo = 'Ingeniería de Sistemas',
  onSubmitRating,
}) => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comentario, setComentario] = useState('');
  const [enviado, setEnviado] = useState(false);

  if (!isOpen) return null;

  const isRatingDriver = targetType === 'driver';

  const availableTags = isRatingDriver
    ? [
        'Manejo Prudente y Seguro',
        'Vehículo Limpio y Cómodo',
        'Puntualidad Perfecta',
        'Excelente Música y Charla',
        'Ruta Eficiente',
      ]
    : [
        'Puntual en el Punto de Abordaje',
        'Excelente Compañero de Viaje',
        'Amable y Respetuoso',
        'Pago Rápido y Exacto',
        'Comunicación Clara',
      ];

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const enviarCalificacion = (e) => {
    e.preventDefault();
    setEnviado(true);
    setTimeout(() => {
      if (onSubmitRating) {
        onSubmitRating({
          rating,
          tags: selectedTags,
          comment: comentario,
        });
      }
      setEnviado(false);
      onClose();
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={`w-full max-w-[340px] max-h-[85vh] rounded-3xl p-5 shadow-2xl border overflow-y-auto mx-auto space-y-4 transition-colors ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Cabecera */}
          <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <h3 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isRatingDriver ? 'Calificar Conductor' : 'Calificar Pasajero'}
                </h3>
                <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{targetName}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-1 rounded-full transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {enviado ? (
            <div className="py-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>¡Calificación Enviada!</p>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Gracias por contribuir a la reputación y confianza de tu comunidad universitaria.
              </p>
            </div>
          ) : (
            <form onSubmit={enviarCalificacion} className="space-y-4">
              {/* Estrellas Interactivas */}
              <div className="text-center space-y-1 py-1">
                <p className={`text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  ¿Cómo fue tu experiencia en este recorrido?
                </p>
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          (hoverRating || rating) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : isDark
                            ? 'text-slate-800'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-[11px] font-bold text-amber-500 block">
                  {rating === 5 && 'Excelente viaje'}
                  {rating === 4 && 'Muy buen servicio'}
                  {rating === 3 && 'Viaje promedio'}
                  {rating === 2 && 'Regular'}
                  {rating === 1 && 'Mala experiencia'}
                </span>
              </div>

              {/* Etiquetas de Cumplidos */}
              <div className="space-y-1.5">
                <label className={`text-[11px] font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  ¿Qué deseas destacar?
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-lochmara-600 text-white border-lochmara-600 shadow-xs'
                            : isDark
                            ? 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comentario Opcional */}
              <div className="space-y-1">
                <label className={`text-[11px] font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Comentario (Opcional):
                </label>
                <textarea
                  rows={2}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Escribe un breve mensaje..."
                  className={`w-full text-xs rounded-2xl p-2.5 border focus:outline-none focus:ring-2 focus:ring-lochmara-500 resize-none font-medium ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* Botón de Enviar */}
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-lochmara-600/20"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Enviar Calificación</span>
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
