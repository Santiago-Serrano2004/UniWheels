import React from 'react';
import { Building2, Check } from 'lucide-react';

export const CampusQuickSelectorGrid = ({
  sedesDisponibles,
  selectedCampus,
  handleSelectCampusCard,
  isDark,
}) => {
  return (
    <section className="space-y-1.5">
      <div className="flex items-center justify-between px-1">
        <h3 className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <Building2 className="w-3 h-3 text-lochmara-500" />
          <span>Sedes Universitarias</span>
        </h3>
        <span className="text-[9px] text-slate-400 font-medium">Sede activa</span>
      </div>

      {/* Chips horizontales compactos con scroll suave */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {sedesDisponibles.map((sede) => {
          const isSelected = selectedCampus === sede.name;
          return (
            <button
              key={sede.id}
              type="button"
              onClick={() => handleSelectCampusCard(sede)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border shadow-2xs ${
                isSelected
                  ? 'bg-lochmara-600 border-lochmara-600 text-white shadow-xs'
                  : isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              <span>{sede.name.replace('Campus ', '')}</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                  isSelected
                    ? 'bg-lochmara-700 text-white'
                    : isDark
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {sede.code}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
