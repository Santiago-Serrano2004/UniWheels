import React from 'react';
import {
  Car,
  MapPin,
  Clock,
  Search,
  CheckCircle2,
  Loader2,
  Building2,
  ChevronRight,
  Navigation,
} from 'lucide-react';
import { FormSelect } from '../common/FormSelect';

export const DriverRoutePublishForm = ({
  sedesInstitucion,
  sedeSeleccionada,
  setSedeSeleccionada,
  sedeDestinoSeleccionada,
  setSedeDestinoSeleccionada,
  puntoEncuentroCampus,
  setPuntoEncuentroCampus,
  sentidoViaje,
  direccionLugar,
  busquedaTexto,
  setBusquedaTexto,
  sugerencias,
  mostrandoSugerencias,
  cargandoGeocodificacion,
  seleccionarLugarSugerido,
  usarUbicacionActual,
  setShowDriverMapModal,
  buscadorRef,
  horaSalida,
  setHoraSalida,
  cupos,
  setCupos,
  tarifa,
  setTarifa,
  manejarPublicarTrayecto,
  isDark,
}) => {
  const opcionesSedes = sedesInstitucion.map((sede) => ({
    value: sede.name,
    label: `${sede.name} ${sede.is_main_campus ? '(Principal)' : ''}`,
  }));

  return (
    <form onSubmit={manejarPublicarTrayecto} className="space-y-4">
      {/* 1. SELECCIÓN DE SEDES / TRAYECTO */}
      {sentidoViaje === 'entre_campus' ? (
        /* MODALIDAD ENTRE CAMPUS */
        <section
          className={`rounded-3xl p-4 border shadow-sm space-y-3 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-lochmara-500" />
            <h3 className="text-xs font-black">Conexión Inter-Campus (Entre Sedes)</h3>
          </div>

          <div className="space-y-2.5">
            <FormSelect
              label="Sede Universitaria de Salida (Origen):"
              value={sedeSeleccionada}
              onChange={(e) => setSedeSeleccionada(e.target.value)}
              options={opcionesSedes}
            />

            <FormSelect
              label="Sede Universitaria de Llegada (Destino):"
              value={sedeDestinoSeleccionada}
              onChange={(e) => setSedeDestinoSeleccionada(e.target.value)}
              options={opcionesSedes.filter((s) => s.value !== sedeSeleccionada)}
            />
          </div>
        </section>
      ) : (
        /* MODALIDAD HACIA / DESDE CAMPUS */
        <section
          className={`rounded-3xl p-4 border shadow-sm space-y-2.5 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-lochmara-500" />
            <h3 className="text-xs font-black">
              {sentidoViaje === 'hacia_campus' ? 'Sede Universitaria de Destino' : 'Sede Universitaria de Salida'}
            </h3>
          </div>

          <FormSelect
            value={sedeSeleccionada}
            onChange={(e) => setSedeSeleccionada(e.target.value)}
            options={opcionesSedes}
          />
        </section>
      )}

      {/* 2. PUNTO DE ENCUENTRO EN EL CAMPUS (Requerido cuando se sale de un campus) */}
      {(sentidoViaje === 'desde_campus' || sentidoViaje === 'entre_campus') && (
        <section
          className={`rounded-3xl p-4 border shadow-sm space-y-2 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-lochmara-500" />
            <h3 className="text-xs font-black">Punto de Encuentro en el Campus</h3>
          </div>
          <p className="text-[10px] text-slate-400">
            Indica a los pasajeros dónde los esperarás dentro o en los accesos de la sede.
          </p>

          <input
            type="text"
            required
            value={puntoEncuentroCampus}
            onChange={(e) => setPuntoEncuentroCampus(e.target.value)}
            placeholder="Ej: Portería Principal Calle 48, Bahía Parqueadero Edificio Central..."
            className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition-colors focus:outline-hidden ${
              isDark
                ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-lochmara-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-lochmara-500'
            }`}
          />
        </section>
      )}

      {/* 3. PUNTO PERSONALIZADO EN EL AMB (Solo para Hacia Campus o Desde Campus) */}
      {sentidoViaje !== 'entre_campus' && (
        <section
          className={`rounded-3xl p-4 border shadow-sm space-y-3 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-black">
                {sentidoViaje === 'hacia_campus' ? '¿Desde dónde sales? (Punto de Partida)' : '¿Hacia dónde te diriges? (Punto de Llegada)'}
              </h3>
            </div>
            <button
              type="button"
              onClick={usarUbicacionActual}
              className="text-[11px] font-bold text-lochmara-500 hover:text-lochmara-400 cursor-pointer"
            >
              Mi GPS Actual
            </button>
          </div>

          {/* Buscador y dropdown de sugerencias */}
          <div ref={buscadorRef} className="relative">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-2xl border ${
                isDark
                  ? 'bg-slate-950 border-slate-800 focus-within:border-lochmara-500'
                  : 'bg-slate-50 border-slate-200 focus-within:border-lochmara-500'
              }`}
            >
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={busquedaTexto}
                onChange={(e) => setBusquedaTexto(e.target.value)}
                placeholder="Buscar barrio, conjunto o sector..."
                className={`w-full bg-transparent text-xs font-bold focus:outline-hidden ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              />
              {cargandoGeocodificacion && <Loader2 className="w-3.5 h-3.5 animate-spin text-lochmara-500" />}
            </div>

            {/* Sugerencias */}
            {mostrandoSugerencias && sugerencias.length > 0 && (
              <div
                className={`absolute top-full left-0 right-0 z-30 mt-1 rounded-2xl border shadow-xl overflow-hidden divide-y ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 divide-slate-800 text-white'
                    : 'bg-white border-slate-200 divide-slate-100 text-slate-900'
                }`}
              >
                {sugerencias.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => seleccionarLugarSugerido(sug)}
                    className={`w-full p-2.5 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="truncate">
                      <p className="font-bold truncate">{sug.nombre}</p>
                      <p className="text-[10px] text-slate-400 truncate">{sug.direccion}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Punto actual confirmado y botón de ajustar en mapa */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800/80">
            <div className="flex items-center gap-2 truncate min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-xs font-bold truncate">{direccionLugar}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowDriverMapModal(true)}
              className="text-[11px] font-bold text-lochmara-500 hover:text-lochmara-400 px-2 py-1 rounded-lg hover:bg-lochmara-500/10 cursor-pointer shrink-0"
            >
              Ajustar en Mapa
            </button>
          </div>
        </section>
      )}

      {/* 4. PARÁMETROS DEL VIAJE: HORA, CUPOS Y TARIFA */}
      <section
        className={`rounded-3xl p-4 border shadow-sm space-y-3 transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-lochmara-500" />
          <h3 className="text-xs font-black">Detalles del Trayecto</h3>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {/* Hora de Salida */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 block">Hora de Salida:</label>
            <input
              type="time"
              value={horaSalida}
              onChange={(e) => setHoraSalida(e.target.value)}
              className={`w-full py-2 px-2.5 rounded-xl text-xs font-bold border cursor-pointer ${
                isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* Cupos */}
          <FormSelect
            label="Cupos Libres:"
            value={cupos}
            onChange={(e) => setCupos(Number(e.target.value))}
            options={[
              { value: 1, label: '1 Cupo' },
              { value: 2, label: '2 Cupos' },
              { value: 3, label: '3 Cupos' },
              { value: 4, label: '4 Cupos' },
            ]}
          />

          {/* Tarifa Sugerida */}
          <FormSelect
            label="Aporte sugerido:"
            value={tarifa}
            onChange={(e) => setTarifa(e.target.value)}
            options={[
              { value: '3000', label: '$ 3.000' },
              { value: '3500', label: '$ 3.500' },
              { value: '4000', label: '$ 4.000' },
              { value: '4500', label: '$ 4.500' },
              { value: '5000', label: '$ 5.000' },
            ]}
          />
        </div>
      </section>

      {/* 5. BOTÓN DE PUBLICAR TRAYECTO */}
      <button
        type="submit"
        className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 cursor-pointer"
      >
        <Car className="w-4 h-4" />
        <span>Publicar Trayecto Universitario</span>
      </button>
    </form>
  );
};
