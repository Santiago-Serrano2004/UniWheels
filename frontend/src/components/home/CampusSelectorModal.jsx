import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, MapPin, Check, X, Search, ShieldCheck } from 'lucide-react';

import jardinImg from '../../assets/institutions/campuses/el-jardin.webp';
import bosqueImg from '../../assets/institutions/campuses/el-bosque.webp';
import csuImg from '../../assets/institutions/campuses/csu.webp';
import casonaImg from '../../assets/institutions/campuses/la-casona.webp';

const CAMPUS_STATIC_IMAGES = {
  'JARDIN': jardinImg,
  'BOSQUE': bosqueImg,
  'CSU': csuImg,
  'CASONA': casonaImg,
  'Campus El Jardín': jardinImg,
  'Campus El Bosque': bosqueImg,
  'CSU — Centro de Servicios Universitarios': csuImg,
  'Campus La Casona': casonaImg,
};

export const CampusSelectorModal = ({
  isOpen,
  onClose,
  sedesDisponibles = [],
  selectedCampus,
  onSelectCampus,
  isDark,
  institutionName = 'Universidad Autónoma de Bucaramanga',
}) => {
  const [filtroTexto, setFiltroTexto] = useState('');

  if (!isOpen) return null;

  const sedesFiltradas = sedesDisponibles.filter((sede) => {
    const termino = filtroTexto.toLowerCase();
    return (
      sede.name?.toLowerCase().includes(termino) ||
      sede.address?.toLowerCase().includes(termino)
    );
  });

  const getCampusImage = (sede) => {
    return (
      CAMPUS_STATIC_IMAGES[sede.code] ||
      CAMPUS_STATIC_IMAGES[sede.name] ||
      sede.image_url ||
      jardinImg
    );
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs select-none">
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={`relative z-10 w-full max-w-[380px] max-h-[85vh] rounded-3xl p-5 border shadow-2xl flex flex-col overflow-hidden transition-colors ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Cabecera del Modal */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b dark:border-slate-800/80 border-slate-100">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-lochmara-500" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-lochmara-600 dark:text-lochmara-400">
                  Sedes Universitarias
                </span>
              </div>
              <h3 className="text-base font-black tracking-tight">
                Selecciona tu Campus
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[260px]">
                {institutionName}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors cursor-pointer shrink-0"
              title="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Buscador de Sedes (si hay más de 3 sedes) */}
          {sedesDisponibles.length > 3 && (
            <div className="pt-3 pb-1">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  placeholder="Buscar sede o dirección..."
                  className="w-full bg-transparent text-xs font-bold focus:outline-hidden"
                />
                {filtroTexto && (
                  <button type="button" onClick={() => setFiltroTexto('')}>
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Lista de Tarjetas de Sedes con Fotografía y Detalles Limpios */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-0.5">
            {sedesFiltradas.length > 0 ? (
              sedesFiltradas.map((sede) => {
                const isSelected = selectedCampus === sede.name;
                const imgSrc = getCampusImage(sede);

                return (
                  <motion.div
                    key={sede.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      onSelectCampus(sede);
                      onClose();
                    }}
                    className={`group relative rounded-2xl overflow-hidden border transition-all cursor-pointer text-left shadow-xs ${
                      isSelected
                        ? isDark
                          ? 'border-lochmara-500 ring-2 ring-lochmara-500/50 bg-slate-950'
                          : 'border-lochmara-600 ring-2 ring-lochmara-600/40 bg-lochmara-50/60'
                        : isDark
                        ? 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
                        : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    {/* Imagen de Portada de la Sede con Carga Directa */}
                    <div className="h-24 w-full overflow-hidden relative bg-slate-800">
                      <img
                        src={imgSrc}
                        alt={sede.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = jardinImg;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

                      {/* Insignia de Sede Principal (solo si aplica) */}
                      {sede.is_main_campus && (
                        <div className="absolute top-2 left-2">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/90 text-white shadow-xs">
                            Sede Principal
                          </span>
                        </div>
                      )}

                      {/* Checkmark de Selección */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-lochmara-500 text-white flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      {/* Nombre sobre la Imagen */}
                      <div className="absolute bottom-2 left-3 right-3">
                        <p className="text-xs font-black text-white line-clamp-1 drop-shadow-sm">
                          {sede.name}
                        </p>
                      </div>
                    </div>

                    {/* Dirección e Información */}
                    <div className="p-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate min-w-0">
                        <MapPin className="w-3 h-3 text-lochmara-500 shrink-0" />
                        <span className="truncate">{sede.address}</span>
                      </div>

                      {isSelected ? (
                        <span className="text-[10px] font-black text-lochmara-600 dark:text-lochmara-400 shrink-0">
                          Activa
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-lochmara-500 transition-colors shrink-0">
                          Elegir
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                <Building2 className="w-6 h-6 mx-auto text-slate-500" />
                <p className="font-bold">No se encontraron sedes con ese nombre.</p>
              </div>
            )}
          </div>

          {/* Pie del Modal con Garantía Institucional */}
          <div className="pt-2.5 border-t dark:border-slate-800/80 border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-lochmara-500" />
              <span>Sedes oficiales verificadas</span>
            </div>
            <span>{sedesDisponibles.length} sedes</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
