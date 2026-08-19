import React, { useState, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { SetHomeLocationModal } from '../common/SetHomeLocationModal';
import { MapPin, Search, ChevronRight, X, Loader2, Building2, Clock, Calendar, Home } from 'lucide-react';
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
  selectedDate,
  setSelectedDate,
  todayStr,
  tomorrowStr,
}) => {
  const { savedHomeLocation } = useAppStore();
  const [modalConfigurarCasa, setModalConfigurarCasa] = useState(false);
  const timeInputRef = useRef(null);
  const dateInputRef = useRef(null);

  const usarCasa = () => {
    if (savedHomeLocation && handleSelectSuggestion) {
      handleSelectSuggestion({
        nombre: savedHomeLocation.name,
        direccion: savedHomeLocation.address,
        coords: savedHomeLocation.coords,
      });
    } else {
      setModalConfigurarCasa(true);
    }
  };

  const placeholderText =
    directionFilter === 'towards'
      ? '¿Dónde te recogemos? Barrio, dirección...'
      : '¿A dónde te diriges? Barrio, dirección...';

  const isToday = selectedDate === todayStr || !selectedDate;
  const isTomorrow = selectedDate === tomorrowStr;
  const isCustomDate = !isToday && !isTomorrow;

  // Formatear fecha personalizada de forma compacta (ej: "21 Ago")
  const formatCustomDateLabel = (dateStr) => {
    if (!dateStr) return 'Fecha';
    try {
      const [year, month, day] = dateStr.split('-');
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', '');
    } catch {
      return dateStr;
    }
  };

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
            ¿Cuál es tu trayecto universitario?
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
                  onClick={usarCasa}
                  className={`px-2 py-1 rounded-xl text-[10px] font-extrabold transition-colors cursor-pointer flex items-center gap-1 shrink-0 border ${
                    savedHomeLocation
                      ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      : 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-500 dark:text-slate-400 border-slate-500/20'
                  }`}
                  title={savedHomeLocation ? `Usar ${savedHomeLocation.address}` : 'Configurar dirección de Casa'}
                >
                  <Home className="w-3 h-3" />
                  <span>Casa</span>
                </button>
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
                  onClick={usarCasa}
                  className={`px-2 py-1 rounded-xl text-[10px] font-extrabold transition-colors cursor-pointer flex items-center gap-1 shrink-0 border ${
                    savedHomeLocation
                      ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      : 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-500 dark:text-slate-400 border-slate-500/20'
                  }`}
                  title={savedHomeLocation ? `Usar ${savedHomeLocation.address}` : 'Configurar dirección de Casa'}
                >
                  <Home className="w-3 h-3" />
                  <span>Casa</span>
                </button>
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
                  <div className="truncate min-w-0">
                    <p className="font-bold truncate">{item.nombre || item.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{item.direccion || item.address || item.category || 'Área Metropolitana'}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. BARRA DE CONTROL DE FECHA Y HORARIO (AJUSTE COMPACTO CON ANIMACIÓN FLUIDA SPRING) */}
      <div className="mt-3 pt-2.5 border-t dark:border-slate-800/80 border-slate-100 flex items-center justify-between gap-2">
        {/* Selector de Día con Animación Deslizante */}
        <div
          className={`flex-1 p-1 rounded-2xl border flex items-center justify-between relative transition-colors ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all text-center cursor-pointer relative z-10 ${
              isToday
                ? 'text-white'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isToday && (
              <motion.div
                layoutId="date-pill-home"
                className="absolute inset-0 bg-lochmara-600 rounded-xl shadow-xs -z-10"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span>Hoy</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedDate(tomorrowStr)}
            className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all text-center cursor-pointer relative z-10 ${
              isTomorrow
                ? 'text-white'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isTomorrow && (
              <motion.div
                layoutId="date-pill-home"
                className="absolute inset-0 bg-lochmara-600 rounded-xl shadow-xs -z-10"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span>Mañana</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (dateInputRef.current) {
                try {
                  dateInputRef.current.showPicker();
                } catch {
                  dateInputRef.current.focus();
                }
              }
            }}
            className={`relative flex-1 py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-0.5 z-10 ${
              isCustomDate
                ? 'text-white'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isCustomDate && (
              <motion.div
                layoutId="date-pill-home"
                className="absolute inset-0 bg-lochmara-600 rounded-xl shadow-xs -z-10"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Calendar className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{isCustomDate ? formatCustomDateLabel(selectedDate) : 'Fecha'}</span>
            <input
              ref={dateInputRef}
              type="date"
              min={todayStr}
              value={isCustomDate ? selectedDate : ''}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              className="sr-only"
              tabIndex={-1}
            />
          </button>
        </div>

        {/* Selector de Hora (Compacto, ajustado a 72px exactos) */}
        <div
          onClick={() => timeInputRef.current?.showPicker?.()}
          className={`shrink-0 p-1 px-2 rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer ${
            isDark
              ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-lochmara-500 shrink-0" />

          <input
            ref={timeInputRef}
            type="time"
            step="60"
            value={passengerTimeFilter || ''}
            onChange={(e) => setPassengerTimeFilter(e.target.value)}
            className={`w-[70px] py-0.5 px-0.5 rounded-lg text-xs font-black border transition-colors cursor-pointer text-center tracking-tight [color-scheme:dark] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none ${
              isDark
                ? 'bg-slate-900 border-slate-700 text-white focus:border-lochmara-500'
                : 'bg-white border-slate-300 text-slate-900 focus:border-lochmara-500 shadow-2xs'
            }`}
          />

          {passengerTimeFilter && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPassengerTimeFilter('');
              }}
              className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 text-[10px] font-bold flex items-center justify-center cursor-pointer transition-colors shrink-0"
              title="Limpiar filtro de hora"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* Modal para configurar ubicación de casa si el usuario aún no la tiene */}
      <SetHomeLocationModal
        isOpen={modalConfigurarCasa}
        onClose={() => setModalConfigurarCasa(false)}
        onLocationSaved={(loc) => {
          if (handleSelectSuggestion) {
            handleSelectSuggestion({
              nombre: loc.name,
              direccion: loc.address,
              coords: loc.coords,
            });
          }
        }}
      />
    </section>
  );
};
