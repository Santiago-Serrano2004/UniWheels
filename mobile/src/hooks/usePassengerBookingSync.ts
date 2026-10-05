import { useEffect } from 'react';
import { tripLifecycleService, useAppStore } from '@uniwheels/shared';

/**
 * Trae del servidor la reserva activa del pasajero y la deja en `activePassengerBooking`.
 * Antes la reserva vivía solo en memoria: al recargar la app el viaje desaparecía.
 */
export function usePassengerBookingSync(activo: boolean) {
  useEffect(() => {
    if (!activo) return undefined;
    let vigente = true;
    tripLifecycleService.getActivePassengerTrip().then((t: any) => {
      if (!vigente) return;
      if (!t) {
        useAppStore.setState({ activePassengerBooking: null });
        return;
      }
      const previa = useAppStore.getState().activePassengerBooking;
      useAppStore.setState({
        activePassengerBooking: {
          ...(previa?.id === t.trip_id ? previa : {}),
          id: t.trip_id,
          status: t.status,
          isStarted: Boolean(t.is_pin_verified),
          boarding_pin: t.boarding_pin,
          boardingPin: t.boarding_pin,
          driver_name: t.driver_name,
          driverName: t.driver_name,
          vehicle_plate: t.vehicle_plate,
          plate: t.vehicle_plate,
          vehicle_model: t.vehicle_model,
          vehicle: t.vehicle_model,
          pickup: t.pickup_address,
          origin: previa?.id === t.trip_id ? previa.origin : t.pickup_address,
          destination: previa?.id === t.trip_id ? previa.destination : t.dropoff_address,
          fare_cop: t.total_fare_cop,
          departure_time: t.scheduled_pickup_time,
        },
      });
    });
    return () => {
      vigente = false;
    };
  }, [activo]);
}
