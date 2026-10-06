import { useCallback, useEffect } from 'react';
import { routesService, tripsService, useAppStore } from '@uniwheels/shared';

// Fecha local de Colombia (YYYY-MM-DD) de un instante ISO.
const fechaColombia = (iso?: string | null) =>
  iso ? new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date(iso)) : undefined;

/**
 * Trae del servidor las rutas publicadas del conductor y sus pasajeros activos, y las deja en
 * `publishedDriverTrips`. Antes esa lista vivía solo en memoria: se perdía al recargar la app
 * y podía mostrar rutas que ya no existen en el servidor.
 */
export function useDriverRoutesSync(activo: boolean) {
  const sincronizar = useCallback(async () => {
      const rutas: any[] = await routesService.getMyRoutes();
      const ahora = Date.now();
      const vigentes = rutas.filter(
        (r) => r.status === 'en_curso' || (r.status === 'publicada' && (!r.scheduled_departure_time || Date.parse(r.scheduled_departure_time) > ahora))
      );
      const conPasajeros = await Promise.all(
        vigentes.map(async (r) => {
          const viajes: any[] = await tripsService.getActiveTripsForRoute(r.id).catch(() => []);
          const pasajeros = viajes.map((t) => ({
            id: t.id,
            tripId: t.id,
            name: t.passenger_name,
            passengerName: t.passenger_name,
            status: t.status,
            pickup: t.pickup_address,
            boardingPin: t.boarding_pin,
          }));
          return {
            id: r.id,
            route_id: r.id,
            origin: r.origin_name || r.origin,
            destination: r.destination_campus_name || r.destination,
            date: fechaColombia(r.scheduled_departure_time),
            departure_date: fechaColombia(r.scheduled_departure_time),
            departure_time: r.departure_time,
            available_seats: r.available_seats,
            total_seats: Number(r.available_seats) + pasajeros.length,
            fare_cop: Number(r.base_contribution_cop ?? 0),
            fare: r.fare,
            distance_km: r.distance_km,
            status: 'publicado',
            passengers: pasajeros,
          };
        })
      );
      useAppStore.setState({ publishedDriverTrips: conPasajeros });
  }, []);

  useEffect(() => {
    if (activo) sincronizar();
  }, [activo, sincronizar]);

  return { sincronizar };
}
