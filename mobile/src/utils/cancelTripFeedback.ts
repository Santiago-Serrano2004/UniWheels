import { Alert } from 'react-native';

/**
 * Procesa la respuesta de `tripLifecycleService.cancelTrip`: muestra el aviso
 * que manda el backend tal cual y, si la cuenta quedó suspendida, ejecuta
 * `onSuspended` (cierre de sesión) después de que el usuario lo vea.
 */
export function procesarRespuestaCancelacion(respuesta: any, onSuspended: () => void) {
  const data = respuesta?.data ?? {};
  const warning: string | null = data.warning ?? null;
  const suspended = data.suspended === true;

  let mensaje = warning;
  if (!mensaje && suspended) {
    const hasta = data.suspended_until ? new Date(data.suspended_until) : null;
    mensaje =
      hasta && !Number.isNaN(hasta.getTime())
        ? `Tu cuenta está suspendida hasta el ${hasta.toLocaleDateString('es-CO')}.`
        : 'Tu cuenta está suspendida.';
  }
  if (!mensaje) return;

  Alert.alert(
    suspended ? 'Cuenta suspendida' : 'Cancelación registrada',
    mensaje,
    [{ text: 'Entendido', onPress: () => suspended && onSuspended() }],
    { cancelable: false }
  );
}
