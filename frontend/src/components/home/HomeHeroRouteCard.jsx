import React from 'react';
import { MapPin, Search, ChevronRight, X, Loader2, Building2, Clock, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const HomeHeroRouteCard = ({
  user,
  isDark,
  directionFilter,
  setDirectionFilter,
  selectedCampus,
  selectedDestinationCampus,
  onOpenCampusModal,
  editablePointName,
  setIsSelectingPointOnMap,
  searchQuery,
  setSearchQuery,
  suggestions,
  isSearching,
  handleSelectSuggestion,
  passengerTimeFilter,
  setPassengerTimeFilter,
}) => {
  const placeholderText =
    directionFilter === 'towards'
      ? '¿Dónde te recogemos? Barrio, dirección...'
      : '¿A dónde te diriges? Barrio, dirección...';

  const timeLabel =
    directionFilter === 'towards' ? 'Llegada deseada:' : 'Salida deseada:';

  return (
    <section
      className={`rounded-3xl p-4 border shadow-sm relative overflow-hidden transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Saludo y Avatar */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-black tracking-tight truncate">
            Hola, {user?.name?.split(' ')[0] || 'Estudiante'}
          </h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            ¿Cuál es tu trayecto universitario hoy?
          </p>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-lochmara-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md shadow-lochmara-600/20 overflow-hidden">
          {user?.profilePhoto ? (
            <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user?.name?.split(' ').map((n) => n[0]).join('') || 'UN'
          )}
        </div>
      </div>

      {/* Pill Toggle de 3 Sentidos: Hacia Campus | Desde Campus | Entre Sedes */}
      <div className={`flex p-1 rounded-2xl border mb-3 relative ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
        <button
          type="button"
          onClick={() => setDirectionFilter('towards')}
          className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all relative z-10 cursor-pointer text-center ${
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
          <span>Hacia Campus</span>
        </button>

        <button
          type="button"
          onClick={() => setDirectionFilter('from')}
          className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all relative z-10 cursor-pointer text-center ${
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
          <span>Desde Campus</span>
        </button>

        <button
          type="button"
          onClick={() => setDirectionFilter('inter_campus')}
          className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all relative z-10 cursor-pointer text-center ${
            directionFilter === 'inter_campus'
              ? 'text-white'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {directionFilter === 'inter_campus' && (
            <motion.div
              layoutId="direction-pill-home"
              className="absolute inset-0 bg-lochmara-600 rounded-xl shadow-md -z-10"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span>Entre Sedes</span>
        </button>
      </div>

      {/* CORREDOR ORIGEN / DESTINO */}
      <div className={`p-3 rounded-2xl border relative ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
        {/* ORIGEN */}
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-lochmara-500 shrink-0 ring-4 ring-lochmara-500/20" />
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Origen
            </span>
            {(directionFilter === 'from' || directionFilter === 'inter_campus') ? (
              /* ORIGEN ES UN CAMPUS */
              <button
                type="button"
                onClick={() => onOpenCampusModal('origin')}
                className={`w-full mt-0.5 p-1.5 px-2.5 rounded-xl text-left flex items-center justify-between border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-white'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="w-3.5 h-3.5 text-lochmara-500 shrink-0" />
                  <span className="text-xs font-black truncate">{selectedCampus}</span>
                </div>
                <div className="flex items-center gap-0.5 text-lochmara-500 text-[10px] font-bold shrink-0">
                  <span>Cambiar</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            ) : (
              /* ORIGEN ES EDITABLE CON BÚSQUEDA INTEGRADA */
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="relative flex-1 flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery || editablePointName}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={placeholderText}
                    className={`w-full py-1 pl-7 pr-7 rounded-xl text-xs font-bold border transition-all focus:outline-hidden ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-lochmara-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-lochmara-500'
                    }`}
                  />
                  {isSearching ? (
                    <Loader2 className="w-3 h-3 animate-spin text-lochmara-500 absolute right-2" />
                  ) : (searchQuery || editablePointName) ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setIsSelectingPointOnMap(true)}
                  className="px-2 py-1 rounded-xl bg-lochmara-500/10 hover:bg-lochmara-500/20 text-lochmara-600 dark:text-lochmara-400 text-[10px] font-extrabold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  title="Seleccionar en el mapa"
                >
                  <MapPin className="w-3 h-3" />
                  <span>Mapa</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Línea conectora */}
        <div className={`border-l-2 border-dashed h-2.5 ml-1 my-1 ${isDark ? 'border-slate-700' : 'border-slate-300'}`} />

        {/* DESTINO */}
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 ring-4 ring-emerald-500/20" />
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Destino
            </span>
            {directionFilter === 'towards' ? (
              /* DESTINO ES EL CAMPUS */
              <button
                type="button"
                onClick={() => onOpenCampusModal('destination')}
                className={`w-full mt-0.5 p-1.5 px-2.5 rounded-xl text-left flex items-center justify-between border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-white'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="w-3.5 h-3.5 text-lochmara-500 shrink-0" />
                  <span className="text-xs font-black truncate">{selectedCampus}</span>
                </div>
                <div className="flex items-center gap-0.5 text-lochmara-500 text-[10px] font-bold shrink-0">
                  <span>Cambiar</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            ) : directionFilter === 'inter_campus' ? (
              /* DESTINO ES OTRO CAMPUS */
              <button
                type="button"
                onClick={() => onOpenCampusModal('destination')}
                className={`w-full mt-0.5 p-1.5 px-2.5 rounded-xl text-left flex items-center justify-between border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-white'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-xs font-black truncate">{selectedDestinationCampus}</span>
                </div>
                <div className="flex items-center gap-0.5 text-lochmara-500 text-[10px] font-bold shrink-0">
                  <span>Cambiar</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            ) : (
              /* DESTINO ES EDITABLE CON BÚSQUEDA */
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="relative flex-1 flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery || editablePointName}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={placeholderText}
                    className={`w-full py-1 pl-7 pr-7 rounded-xl text-xs font-bold border transition-all focus:outline-hidden ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-lochmara-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-lochmara-500'
                    }`}
                  />
                  {isSearching ? (
                    <Loader2 className="w-3 h-3 animate-spin text-lochmara-500 absolute right-2" />
                  ) : (searchQuery || editablePointName) ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setIsSelectingPointOnMap(true)}
                  className="px-2 py-1 rounded-xl bg-lochmara-500/10 hover:bg-lochmara-500/20 text-lochmara-600 dark:text-lochmara-400 text-[10px] font-extrabold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  title="Seleccionar en el mapa"
                >
                  <MapPin className="w-3 h-3" />
                  <span>Mapa</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dropdown flotante de sugerencias */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
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
                    <p className="text-[10px] text-slate-400 truncate">{item.category || item.address}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FILTRO DE HORARIO DEL PASAJERO (Ventana de menos de 1 hora) */}
      <div className="mt-3 pt-2.5 border-t dark:border-slate-800/80 border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-lochmara-500 shrink-0" />
          <span className="text-[11px] font-bold">{timeLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="time"
            value={passengerTimeFilter || ''}
            onChange={(e) => setPassengerTimeFilter(e.target.value)}
            className={`py-1 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              isDark
                ? 'bg-slate-950 border-slate-700 text-white focus:border-lochmara-500'
                : 'bg-white border-slate-300 text-slate-900 focus:border-lochmara-500 shadow-2xs'
            }`}
          />
          {passengerTimeFilter && (
            <button
              type="button"
              onClick={() => setPassengerTimeFilter('')}
              className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold cursor-pointer"
              title="Mostrar todas las horas"
            >
              Todas
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
