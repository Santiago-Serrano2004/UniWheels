import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { routesService, tripLifecycleService } from '../../services/api';
import { MapContainer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AppMapTileLayer } from './AppMapTileLayer';
import {
  createPickupMarker,
  createDirectPickupMarker,
  createCampusMarker,
  createTeardropPin,
} from './mapIcons';
import { createCarVehicleMarker, createMotoVehicleMarker } from './VehicleGpsMarker';
import { fetchRoadGeometry, lerpAngle, getPlaceCoordinates } from '../../hooks/useOsrmRoute';
import { TripMapOverlayControls } from './TripMapOverlayControls';
import { Route, Search, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const pickupIcon = createPickupMarker('Punto de recogida');
const directPickupIcon = createDirectPickupMarker('En ruta');
const campusIcon = createCampusMarker('Campus');

// Componente para auto-ajustar el zoom y encuadre del mapa de forma dinámica con auto-reset
function MapAutoBounds({ routeCoords, origin, destination, isExpanded }) {
  const map = useMap();
  const resetTimerRef = useRef(null);
  const isProgrammaticMoveRef = useRef(false);

  const getRouteBounds = () => {
    const points = [];
    if (origin && Array.isArray(origin) && origin.length >= 2) points.push(origin);
    if (destination && Array.isArray(destination) && destination.length >= 2) points.push(destination);
    if (routeCoords && Array.isArray(routeCoords) && routeCoords.length > 0) {
      routeCoords.forEach((p) => {
        if (Array.isArray(p) && p.length >= 2) points.push(p);
      });
    }
    return points.length >= 2 ? L.latLngBounds(points) : null;
  };

  const fitRouteToScreen = (duration = 0.5) => {
    if (!map) return;
    const bounds = getRouteBounds();
    if (bounds) {
      try {
        const paddingBottom = isExpanded ? 360 : 230;
        const paddingTop = 70;
        const paddingSide = 35;

        isProgrammaticMoveRef.current = true;
        map.fitBounds(bounds, {
          paddingTopLeft: [paddingSide, paddingTop],
          paddingBottomRight: [paddingSide, paddingBottom],
          maxZoom: 16,
          animate: true,
          duration,
        });

        setTimeout(() => {
          isProgrammaticMoveRef.current = false;
        }, duration * 1000 + 100);
      } catch (err) {
        console.warn('Ajuste de bounds:', err);
      }
    } else if (origin) {
      isProgrammaticMoveRef.current = true;
      map.setView(origin, 14, { animate: true });
      setTimeout(() => {
        isProgrammaticMoveRef.current = false;
      }, 500);
    }
  };

  // Auto-fit inicial y cuando cambia la ruta o expansión de la tarjeta
  useEffect(() => {
    if (!map) return;
    map.invalidateSize();
    fitRouteToScreen(0.45);
  }, [map, routeCoords, origin, destination, isExpanded]);

  // Si el usuario hace zoom o mueve el mapa, esperar 4.5 segundos de inactividad y resetear a la vista normal
  useEffect(() => {
    if (!map) return;

    const handleUserInteraction = () => {
      if (isProgrammaticMoveRef.current) return;

      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }

      resetTimerRef.current = setTimeout(() => {
        fitRouteToScreen(0.65);
      }, 4500);
    };

    map.on('dragstart', handleUserInteraction);
    map.on('zoomstart', handleUserInteraction);
    map.on('movestart', handleUserInteraction);

    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
      map.off('dragstart', handleUserInteraction);
      map.off('zoomstart', handleUserInteraction);
      map.off('movestart', handleUserInteraction);
    };
  }, [map, routeCoords, origin, destination, isExpanded]);

  return null;
}

export const TripMapView = () => {
  const {
    user,
    activePassengerBooking,
    bookPassengerTrip,
    cancelPassengerBooking,
    startPassengerTrip,
    setActiveTab,
    selectedSearchRoute,
    clearSelectedSearchRoute,
    theme,
  } = useAppStore();

  const isDark = theme === 'dark';
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const hasRouteToDisplay = Boolean(selectedSearchRoute || activePassengerBooking);

  const isBooked = Boolean(activePassengerBooking);
  const campusName = user?.campus?.name || user?.campus || 'Campus El Jardín';

  const initialDirection = selectedSearchRoute
    ? selectedSearchRoute.destination?.toLowerCase().includes('campus') ||
      selectedSearchRoute.destination?.toLowerCase().includes('unab')
      ? 'towards_campus'
      : 'from_campus'
    : 'towards_campus';

  const tripDirection = initialDirection;
  const isTowardsCampus = tripDirection === 'towards_campus';

  const driverOrigin = useMemo(() => {
    return selectedSearchRoute
      ? getPlaceCoordinates(selectedSearchRoute.origin, false)
      : isTowardsCampus
      ? [7.0678, -73.1066]
      : [7.1193, -73.1042];
  }, [selectedSearchRoute, isTowardsCampus]);

  const campusDestination = useMemo(() => {
    return selectedSearchRoute
      ? getPlaceCoordinates(selectedSearchRoute.destination, true)
      : isTowardsCampus
      ? [7.1193, -73.1042]
      : [7.0678, -73.1066];
  }, [selectedSearchRoute, isTowardsCampus]);

  const initialVehicle = selectedSearchRoute
    ? selectedSearchRoute.vehicle?.toLowerCase().includes('moto') ||
      selectedSearchRoute.vehicle?.toLowerCase().includes('yamaha') ||
      selectedSearchRoute.vehicle?.toLowerCase().includes('mt-03')
      ? 'motorcycle'
      : 'car'
    : 'car';

  const [vehicleType, setVehicleType] = useState(initialVehicle);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('nequi_direct');

  const [pickupMode, setPickupMode] = useState('on_route');
  const [selectedPickup, setSelectedPickup] = useState(
    selectedSearchRoute ? getPlaceCoordinates(selectedSearchRoute.origin, false) : [7.1186, -73.1102]
  );
  const [pickupName, setPickupName] = useState(
    selectedSearchRoute
      ? selectedSearchRoute.origin
      : isTowardsCampus
      ? 'Parque San Pío (Cabecera)'
      : 'Retorno San Pío (Cabecera)'
  );
  const [mainRouteCoords, setMainRouteCoords] = useState([]);
  const [detourRouteCoords, setDetourRouteCoords] = useState([]);

  const parseFareNumber = (fareStr) => {
    if (!fareStr) return 4500;
    const num = Number(String(fareStr).replace(/[^0-9]/g, ''));
    return num > 0 ? num : 4500;
  };

  const baseFare = selectedSearchRoute
    ? parseFareNumber(selectedSearchRoute.fare)
    : vehicleType === 'motorcycle'
    ? 3500
    : 4500;

  const detourFare = baseFare + (vehicleType === 'motorcycle' ? 1000 : 1300);
  const activeFare = pickupMode === 'on_route' ? baseFare : detourFare;

  const [matchingData, setMatchingData] = useState({
    modality: 'modalidad_1_directa',
    detour_minutes: 0.0,
    suggested_fare_cop: baseFare,
    traffic_status: 'Tráfico fluido en tiempo real',
    traffic_source: 'tomtom_live',
    is_viable: true,
    estimated_arrival_time: selectedSearchRoute?.arrivalTime || (isTowardsCampus ? '07:15 AM' : '06:30 PM'),
  });
  const [isLoadingEvaluation, setIsLoadingEvaluation] = useState(false);

  const [isSimulatingGps, setIsSimulatingGps] = useState(false);
  const [vehiclePos, setVehiclePos] = useState(driverOrigin);
  const [vehicleHeading, setVehicleHeading] = useState(0);

  const animStateRef = useRef({
    progressIndex: 0,
    subT: 0,
    currentHeading: 0,
    targetHeading: 0,
    animFrameId: null,
  });

  const quickPoints = isTowardsCampus
    ? [
        { name: 'Parque San Pío (Desvío)', coords: [7.1186, -73.1102] },
        { name: 'Provenza (En Ruta)', coords: [7.0856, -73.1142] },
        { name: 'C.C. Cuarta Etapa', coords: [7.1215, -73.1125] },
      ]
    : [
        { name: 'Cañaveral (En Ruta)', coords: [7.0678, -73.1066] },
        { name: 'Parque Turbay', coords: [7.1145, -73.1205] },
        { name: 'Piedecuesta Centro', coords: [7.0012, -73.0489] },
      ];

  const handleSelectPickup = (coords, name) => {
    setSelectedPickup(coords);
    setPickupName(name);
  };

  useEffect(() => {
    let isMounted = true;
    async function loadGeometries() {
      if (!hasRouteToDisplay) return;
      const main = await fetchRoadGeometry([driverOrigin, campusDestination]);
      if (isMounted) setMainRouteCoords(main);

      const detour1 = await fetchRoadGeometry([driverOrigin, selectedPickup]);
      const detour2 = await fetchRoadGeometry([selectedPickup, campusDestination]);
      if (isMounted) setDetourRouteCoords([...detour1, ...detour2.slice(1)]);
    }
    loadGeometries();
    return () => {
      isMounted = false;
    };
  }, [hasRouteToDisplay, driverOrigin, campusDestination, selectedPickup]);

  useEffect(() => {
    let isMounted = true;
    async function evaluateDetour() {
      if (!hasRouteToDisplay) return;
      setIsLoadingEvaluation(true);
      try {
        const response = await routesService.evaluateDetourWithAI({
          driver_origin: driverOrigin,
          campus_destination: campusDestination,
          passenger_pickup: selectedPickup,
          vehicle_type: vehicleType,
        });
        if (isMounted && response?.data) {
          setMatchingData(response.data);
        }
      } catch (e) {
        console.warn('Evaluación de IA con fallback:', e);
      } finally {
        if (isMounted) setIsLoadingEvaluation(false);
      }
    }
    evaluateDetour();
    return () => {
      isMounted = false;
    };
  }, [hasRouteToDisplay, driverOrigin, campusDestination, selectedPickup, vehicleType]);

  const activePath = pickupMode === 'on_route' ? mainRouteCoords : detourRouteCoords;

  useEffect(() => {
    if (!isSimulatingGps || !activePath || activePath.length < 2) {
      if (animStateRef.current.animFrameId) {
        cancelAnimationFrame(animStateRef.current.animFrameId);
      }
      return;
    }

    const state = animStateRef.current;
    let lastTimestamp = performance.now();

    const animateGpsStep = (timestamp) => {
      const deltaMs = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      const speedFactor = 0.00045 * Math.min(deltaMs, 32);
      state.subT += speedFactor;

      while (state.subT >= 1.0) {
        state.subT -= 1.0;
        state.progressIndex = (state.progressIndex + 1) % (activePath.length - 1);
      }

      const p1 = activePath[state.progressIndex];
      const p2 = activePath[state.progressIndex + 1] || activePath[0];

      if (p1 && p2) {
        const lat = p1[0] + (p2[0] - p1[0]) * state.subT;
        const lng = p1[1] + (p2[1] - p1[1]) * state.subT;
        setVehiclePos([lat, lng]);

        const dy = p2[0] - p1[0];
        const dx = (p2[1] - p1[1]) * Math.cos((p1[0] * Math.PI) / 180);
        const rad = Math.atan2(dx, dy);
        state.targetHeading = (rad * 180) / Math.PI;

        state.currentHeading = lerpAngle(state.currentHeading, state.targetHeading, 0.15);
        setVehicleHeading(state.currentHeading);
      }

      state.animFrameId = requestAnimationFrame(animateGpsStep);
    };

    state.animFrameId = requestAnimationFrame(animateGpsStep);

    return () => {
      if (state.animFrameId) {
        cancelAnimationFrame(state.animFrameId);
      }
    };
  }, [isSimulatingGps, activePath]);

  const toggleGpsSimulation = () => {
    setIsSimulatingGps((prev) => !prev);
  };

  const manejarReserva = async () => {
    try {
      const pinReserva = String(Math.floor(1000 + Math.random() * 9000));
      bookPassengerTrip({
        id: selectedSearchRoute?.id || 'trip_' + Date.now(),
        driverName: selectedSearchRoute?.driverName || (vehicleType === 'motorcycle' ? 'Mateo Silva' : 'Carlos Mendoza'),
        vehicle: selectedSearchRoute?.vehicle || (vehicleType === 'motorcycle' ? 'Yamaha MT-03' : 'Mazda 3 (Rojo)'),
        plate: selectedSearchRoute?.plate || (vehicleType === 'motorcycle' ? 'WTR-82F' : 'KLU-492'),
        departureTime: selectedSearchRoute?.departureTime || '06:45 AM',
        origin: pickupMode === 'on_route' ? (selectedSearchRoute?.origin || pickupName) : pickupName,
        destination: isTowardsCampus ? campusName : 'Cañaveral / Florida',
        fare: activeFare,
        boardingPin: pinReserva,
        paymentMethod: selectedPaymentMethod,
      });

      await tripLifecycleService.createTrip({
        driver_id: '0198cd6b-3cb8-7201-8b9f-092bf22d4801',
        passenger_id: user?.id,
        origin_lat: selectedPickup[0],
        origin_lng: selectedPickup[1],
        destination_lat: campusDestination[0],
        destination_lng: campusDestination[1],
        fare_cop: activeFare,
        vehicle_type: vehicleType,
        boarding_pin: pinReserva,
      });
    } catch (e) {
      console.warn('Reserva guardada en frontend local:', e);
    }
  };

  // SI NO HAY RUTA QUE MOSTRAR (Se retorna DESPUÉS de declarar todos los hooks)
  if (!hasRouteToDisplay) {
    return (
      <div className="h-full min-h-[460px] flex flex-col items-center justify-center p-4 text-center select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`w-full max-w-sm p-6 rounded-3xl border shadow-xl space-y-5 ${
            isDark
              ? 'bg-slate-900/90 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}
        >
          {/* Icono con resplandor */}
          <div className="w-16 h-16 rounded-3xl bg-lochmara-500/10 border border-lochmara-500/20 text-lochmara-500 flex items-center justify-center mx-auto shadow-inner">
            <Route className="w-8 h-8" />
          </div>

          {/* Textos */}
          <div className="space-y-1.5">
            <h3 className="text-base font-black tracking-tight">
              No tienes ninguna ruta activa
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Aún no has seleccionado una ruta para explorar ni tienes un viaje en curso. Elige un trayecto en el inicio para ver el mapa y la navegación GPS en vivo.
            </p>
          </div>

          {/* Acciones */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="w-full py-3.5 px-4 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-lochmara-600/30 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Explorar Viajes en Inicio</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`w-full py-3 px-4 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Ver Mis Rutinas Semanales</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden select-none">
      {/* MAPA LEAFLET A PANTALLA COMPLETA */}
      <MapContainer
        center={driverOrigin}
        zoom={13}
        zoomControl={false}
        attributionControl={false}
        className="absolute inset-0 w-full h-full z-0"
      >
        <AppMapTileLayer isDark={isDark} />

        {/* Dynamic Auto-Fit Bounds Handler con Auto-Recenter */}
        <MapAutoBounds
          routeCoords={activePath}
          origin={driverOrigin}
          destination={campusDestination}
          isExpanded={isCardExpanded}
        />

        <Marker position={driverOrigin} icon={createTeardropPin(isTowardsCampus ? 'Origen Conductor' : campusName, '#0284c7')}>
          <Popup>Punto de partida del conductor</Popup>
        </Marker>

        <Marker position={campusDestination} icon={campusIcon}>
          <Popup>{campusName}</Popup>
        </Marker>

        <Marker
          position={selectedPickup}
          icon={pickupMode === 'on_route' ? directPickupIcon : pickupIcon}
        >
          <Popup>{pickupName}</Popup>
        </Marker>

        <Marker
          position={vehiclePos}
          icon={
            vehicleType === 'motorcycle'
              ? createMotoVehicleMarker(vehicleHeading, isSimulatingGps)
              : createCarVehicleMarker(vehicleHeading, isSimulatingGps)
          }
        />

        {mainRouteCoords.length > 1 && (
          <Polyline
            positions={mainRouteCoords}
            pathOptions={{
              color: isDark ? '#38bdf8' : '#0284c7',
              weight: pickupMode === 'on_route' ? 5 : 3,
              opacity: pickupMode === 'on_route' ? 0.9 : 0.4,
              dashArray: pickupMode === 'on_route' ? null : '6, 8',
            }}
          />
        )}

        {pickupMode === 'with_detour' && detourRouteCoords.length > 1 && (
          <Polyline
            positions={detourRouteCoords}
            pathOptions={{
              color: '#f59e0b',
              weight: 5,
              opacity: 0.95,
            }}
          />
        )}
      </MapContainer>

      {/* CONTROLES Y DRAWER INFERIOR FLOTANTE */}
      <TripMapOverlayControls
        isDark={isDark}
        isBooked={isBooked}
        activePassengerBooking={activePassengerBooking}
        setActiveTab={setActiveTab}
        cancelPassengerBooking={cancelPassengerBooking}
        startPassengerTrip={startPassengerTrip}
        selectedSearchRoute={selectedSearchRoute}
        clearSelectedSearchRoute={clearSelectedSearchRoute}
        vehicleType={vehicleType}
        setVehicleType={setVehicleType}
        quickPoints={quickPoints}
        pickupName={pickupName}
        handleSelectPickup={handleSelectPickup}
        isSimulatingGps={isSimulatingGps}
        toggleGpsSimulation={toggleGpsSimulation}
        activeFare={activeFare}
        baseFare={baseFare}
        detourFare={detourFare}
        pickupMode={pickupMode}
        setPickupMode={setPickupMode}
        matchingData={matchingData}
        campusName={campusName}
        isTowardsCampus={isTowardsCampus}
        showPaymentModal={showPaymentModal}
        setShowPaymentModal={setShowPaymentModal}
        selectedPaymentMethod={selectedPaymentMethod}
        setSelectedPaymentMethod={setSelectedPaymentMethod}
        manejarReserva={manejarReserva}
        isLoadingEvaluation={isLoadingEvaluation}
        isCardExpanded={isCardExpanded}
        setIsCardExpanded={setIsCardExpanded}
      />
    </div>
  );
};
