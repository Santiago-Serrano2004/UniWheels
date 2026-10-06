import { tripLifecycleService, tripsService } from '@uniwheels/shared';

/**
 * Acciones del conductor sobre una ruta publicada. El servidor no tiene "viaje del
 * conductor": cada pasajero tiene su propio viaje (trip) dentro de la ruta, y finalizar,
 * cancelar o reportar el GPS se hace sobre cada uno de esos viajes, no sobre la ruta.
 */

const mensajeDe = (error: any, porDefecto: string) =>
  error?.message || error?.error || porDefecto;

/** Viajes de pasajeros todavía activos dentro de la ruta. */
export async function viajesActivosDeRuta(routeId: string): Promise<any[]> {
  const viajes = await tripsService.getActiveTripsForRoute(routeId);
  return Array.isArray(viajes) ? viajes : [];
}

/**
 * Completa los viajes de los pasajeros que ya abordaron. Los que nunca abordaron se
 * devuelven aparte para que el conductor decida (no se completan: no viajaron).
 * Lanza un Error con el mensaje del servidor si alguno falla.
 */
export async function completarViajesDeRuta(routeId: string) {
  const viajes = await viajesActivosDeRuta(routeId);
  const abordados = viajes.filter((v) => v.status === 'recogido');
  const sinAbordar = viajes.filter((v) => v.status !== 'recogido');

  const fallos: string[] = [];
  for (const v of abordados) {
    try {
      await tripLifecycleService.completeTrip(v.id);
    } catch (error) {
      fallos.push(`${v.passenger_name || 'Pasajero'}: ${mensajeDe(error, 'no se pudo completar.')}`);
    }
  }
  if (fallos.length) throw new Error(fallos.join('\n'));

  return { completados: abordados.length, sinAbordar };
}

/** Cancela, como conductor, todos los viajes activos de la ruta. Lanza si alguno falla. */
export async function cancelarViajesDeRuta(routeId: string, motivo: string) {
  const viajes = await viajesActivosDeRuta(routeId);
  const fallos: string[] = [];
  let ultimaRespuesta: any = null;
  for (const v of viajes) {
    try {
      ultimaRespuesta = await tripLifecycleService.cancelTrip(v.id, 'conductor', motivo);
    } catch (error: any) {
      fallos.push(`${v.passenger_name || 'Pasajero'}: ${mensajeDe(error?.response?.data ?? error, 'no se pudo cancelar.')}`);
    }
  }
  if (fallos.length) throw new Error(fallos.join('\n'));
  return { cancelados: viajes.length, respuesta: ultimaRespuesta };
}

// Aplica una transición a los viajes de la ruta que estén en alguno de los estados dados.
async function transicionar(routeId: string, estados: string[], accion: (id: string) => Promise<unknown>, error: string) {
  const viajes = (await viajesActivosDeRuta(routeId)).filter((v) => estados.includes(v.status));
  const fallos: string[] = [];
  for (const v of viajes) {
    try {
      await accion(v.id);
    } catch (e: any) {
      fallos.push(`${v.passenger_name || 'Pasajero'}: ${mensajeDe(e?.response?.data ?? e, error)}`);
    }
  }
  if (fallos.length) throw new Error(fallos.join('\n'));
  return viajes.length;
}

/** El conductor sale hacia los puntos de encuentro: los viajes confirmados pasan a "en camino". */
export const iniciarRecorridoDeRuta = (routeId: string) =>
  transicionar(routeId, ['confirmado'], (id) => tripLifecycleService.startDriving(id), 'no se pudo iniciar.');

/** El conductor llegó al punto de encuentro: los viajes en camino pasan a "en punto de encuentro". */
export const llegarAlPuntoDeRuta = (routeId: string) =>
  transicionar(routeId, ['en_camino'], (id) => tripLifecycleService.arriveAtMeetingPoint(id), 'no se pudo registrar la llegada.');
