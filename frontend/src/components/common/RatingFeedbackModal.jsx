import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, CheckCircle2, ThumbsUp, ShieldCheck } from 'lucide-react';

export const RatingFeedbackModal = ({
  isOpen,
  onClose,
  targetType = 'passenger', // 'passenger' | 'driver'
  targetName = 'Estudiante',
  targetRoleInfo = 'Ingeniería de Sistemas',
  onSubmitRating,
}) => {
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
          className="w-full max-w-[340px] max-h-[85vh] bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 overflow-y-auto text-slate-900 mx-auto space-y-4"
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  {isRatingDriver ? 'Calificar Conductor' : 'Calificar Pasajero'}
                </h3>
                <p className="text-[10px] text-slate-500">{targetName}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {enviado ? (
            <div className="py-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-900">¡Calificación Enviada!</p>
              <p className="text-[11px] text-slate-500">
                Gracias por contribuir a la reputación y confianza de tu comunidad universitaria.
              </p>
            </div>
          ) : (
            <form onSubmit={enviarCalificacion} className="space-y-4">
              {/* Estrellas Interactivas */}
              <div className="text-center space-y-1 py-1">
                <p className="text-[11px] font-semibold text-slate-600">
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
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-[11px] font-bold text-amber-700 block">
                  {rating === 5 && '🌟 ¡Excelente viaje!'}
                  {rating === 4 && '👍 Muy buen servicio'}
                  {rating === 3 && '🙂 Viaje promedio'}
                  {rating === 2 && '😕 Regular'}
                  {rating === 1 && '⚠️ Mala experiencia'}
                </span>
              </div>

              {/* Etiquetas de Cumplidos */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">
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
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
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
                <label className="text-[11px] font-bold text-slate-700 block">
                  Comentario (Opcional):
                </label>
                <textarea
                  rows={2}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Escribe un breve mensaje..."
                  className="w-full bg-slate-50 text-xs rounded-2xl p-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none font-medium"
                />
              </div>

              {/* Botón de Enviar */}
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
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
