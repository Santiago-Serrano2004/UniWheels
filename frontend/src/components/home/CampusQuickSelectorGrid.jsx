import React from 'react';
import { Building2, Check, MapPin } from 'lucide-react';

export const CampusQuickSelectorGrid = ({
  sedesDisponibles,
  selectedCampus,
  handleSelectCampusCard,
  isDark,
}) => {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <Building2 className="w-3.5 h-3.5 text-lochmara-500" />
          <span>Sedes Universitarias UNAB</span>
        </h3>
        <span className="text-[10px] text-slate-400 font-medium">Toca para seleccionar</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {sedesDisponibles.map((sede) => {
          const isSelected = selectedCampus === sede.name;
          return (
            <div
              key={sede.id}
              onClick={() => handleSelectCampusCard(sede)}
              className={`group relative rounded-2xl overflow-hidden border transition-all cursor-pointer text-left shadow-2xs hover:shadow-md ${
                isSelected
                  ? isDark
                    ? 'border-lochmara-500 ring-2 ring-lochmara-500/50 bg-slate-900'
                    : 'border-lochmara-600 ring-2 ring-lochmara-600/40 bg-lochmara-50/50'
                  : isDark
                  ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {/* Imagen del Campus */}
              <div className="h-20 w-full overflow-hidden relative bg-slate-200 dark:bg-slate-800">
                <img
                  src={sede.image_url}
                  alt={sede.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/institutions/campuses/el-jardin.webp';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-lochmara-500 text-white flex items-center justify-center shadow-md">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                <div className="absolute bottom-1.5 left-2 right-2">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900/80 backdrop-blur-xs text-lochmara-300 border border-slate-700/50">
                    {sede.code}
                  </span>
                </div>
              </div>

              {/* Info de la Sede */}
              <div className="p-2.5 space-y-0.5">
                <p className={`text-xs font-black line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {sede.name}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
                  <MapPin className="w-2.5 h-2.5 text-lochmara-500 shrink-0" />
                  <span className="truncate">{sede.address}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
