import React from 'react';
import { Sparkles, MapPin, Search, ChevronDown, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const HomeHeroRouteCard = ({
  user,
  isDark,
  directionFilter,
  setDirectionFilter,
  selectedCampus,
  setSelectedCampus,
  sedesDisponibles,
  editablePointName,
  _setEditablePointName,
  setIsSelectingPointOnMap,
  searchQuery,
  setSearchQuery,
  suggestions,
  isSearching,
  handleSelectSuggestion,
}) => {
  return (
    <section
      className={`rounded-3xl p-5 border shadow-sm relative overflow-hidden transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Saludo y Avatar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-lochmara-500" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-lochmara-600 dark:text-lochmara-400">
              Rutas Universitarias IA
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight truncate">
            ¡Hola, {user?.name?.split(' ')[0] || 'Estudiante'}! 👋
          </h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            ¿Cuál es tu trayecto universitario hoy?
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-lochmara-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md shadow-lochmara-600/20 overflow-hidden">
          {user?.profilePhoto ? (
            <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user?.name?.split(' ').map((n) => n[0]).join('') || 'UN'
          )}
        </div>
      </div>

      {/* Pill Toggle de Sentido: Hacia el Campus vs Desde el Campus */}
      <div className={`flex p-1 rounded-2xl border mb-4 relative ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
        <button
          type="button"
          onClick={() => setDirectionFilter('towards')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all relative z-10 cursor-pointer text-center ${
            directionFilter === 'towards'
              ? 'text-white'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {directionFilter === 'towards' && (
            <motion.div
              layoutId="direction-pill-home"
              className="absolute inset-0 bg-lochmara-600 rounded-xl shadow-md -z-10"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span>Hacia el Campus</span>
        </button>

        <button
          type="button"
          onClick={() => setDirectionFilter('from')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all relative z-10 cursor-pointer text-center ${
            directionFilter === 'from'
              ? 'text-white'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {directionFilter === 'from' && (
            <motion.div
              layoutId="direction-pill-home"
              className="absolute inset-0 bg-lochmara-600 rounded-xl shadow-md -z-10"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span>Desde el Campus</span>
        </button>
      </div>

      {/* CORREDOR ORIGEN / DESTINO CON CAMPUS BLOQUEADO SEGÚN SENTIDO */}
      <div className={`space-y-2 p-3.5 rounded-2xl border mb-3.5 ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
        {/* ORIGEN */}
        <div className="flex items-start gap-2.5">
          <div className="w-3 h-3 rounded-full bg-lochmara-500 mt-1 shrink-0 ring-4 ring-lochmara-500/20" />
          <div className="flex-1 min-w-0">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Punto de Origen
            </label>
            {directionFilter === 'from' ? (
              /* ORIGEN ES EL CAMPUS (BLOQUEADO EN SELECTOR) */
              <div className="relative mt-0.5">
                <select
                  value={selectedCampus}
                  onChange={(e) => setSelectedCampus(e.target.value)}
                  className={`w-full py-1.5 px-2.5 pr-8 rounded-xl text-xs font-bold appearance-none cursor-pointer border ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  {sedesDisponibles.map((sede) => (
                    <option key={sede.id} value={sede.name} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                      {sede.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            ) : (
              /* ORIGEN ES EDITABLE */
              <div
                onClick={() => setIsSelectingPointOnMap(true)}
                className={`mt-0.5 text-xs font-bold truncate cursor-pointer hover:underline flex items-center justify-between ${
                  editablePointName ? (isDark ? 'text-white' : 'text-slate-900') : 'text-slate-400'
                }`}
              >
                <span className="truncate">{editablePointName || 'Selecciona tu punto de salida...'}</span>
                <span className="text-[10px] font-normal text-lochmara-500 underline ml-1 shrink-0">Ajustar</span>
              </div>
            )}
          </div>
        </div>

        {/* Línea conectora */}
        <div className={`border-l-2 border-dashed h-3 ml-1.5 my-0.5 ${isDark ? 'border-slate-700' : 'border-slate-300'}`} />

        {/* DESTINO */}
        <div className="flex items-start gap-2.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1 shrink-0 ring-4 ring-emerald-500/20" />
          <div className="flex-1 min-w-0">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Punto de Destino
            </label>
            {directionFilter === 'towards' ? (
              /* DESTINO ES EL CAMPUS (BLOQUEADO EN SELECTOR) */
              <div className="relative mt-0.5">
                <select
                  value={selectedCampus}
                  onChange={(e) => setSelectedCampus(e.target.value)}
                  className={`w-full py-1.5 px-2.5 pr-8 rounded-xl text-xs font-bold appearance-none cursor-pointer border ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  {sedesDisponibles.map((sede) => (
                    <option key={sede.id} value={sede.name} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                      {sede.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            ) : (
              /* DESTINO ES EDITABLE */
              <div
                onClick={() => setIsSelectingPointOnMap(true)}
                className={`mt-0.5 text-xs font-bold truncate cursor-pointer hover:underline flex items-center justify-between ${
                  editablePointName ? (isDark ? 'text-white' : 'text-slate-900') : 'text-slate-400'
                }`}
              >
                <span className="truncate">{editablePointName || 'Selecciona tu punto de llegada...'}</span>
                <span className="text-[10px] font-normal text-lochmara-500 underline ml-1 shrink-0">Ajustar</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Buscador de Lugar con Autocompletado */}
      <div className="relative">
        <div
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border transition-all ${
            isDark
              ? 'bg-slate-950 border-slate-800 focus-within:border-lochmara-500'
              : 'bg-slate-50 border-slate-200 focus-within:border-lochmara-500'
          }`}
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              directionFilter === 'towards'
                ? '¿De dónde sales? (Barrio, calle, parque...)'
                : '¿A dónde vas? (Barrio, centro comercial...)'
            }
            className={`w-full bg-transparent text-xs font-medium focus:outline-hidden placeholder:text-slate-400 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          />
          {isSearching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-lochmara-500 shrink-0" />
          ) : searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>

        {/* Dropdown de Sugerencias */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className={`absolute top-full left-0 right-0 z-30 mt-1 rounded-2xl border shadow-xl overflow-hidden divide-y ${
                isDark
                  ? 'bg-slate-900 border-slate-800 divide-slate-800 text-white'
                  : 'bg-white border-slate-200 divide-slate-100 text-slate-900'
              }`}
            >
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className={`w-full p-2.5 text-left text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-lochmara-500 shrink-0" />
                  <div className="truncate">
                    <p className="font-bold truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{item.category}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
