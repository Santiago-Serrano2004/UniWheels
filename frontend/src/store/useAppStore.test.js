import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';

const initialState = useAppStore.getState();

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState(initialState, true);
});

describe('autenticación', () => {
  it('login guarda al usuario y lo persiste en localStorage', () => {
    useAppStore.getState().login({
      id: 'u1',
      name: 'Ana',
      email: 'ana@unab.edu.co',
      isDriver: false,
      token: 'fake-jwt',
    });

    const state = useAppStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user.name).toBe('Ana');
    expect(state.activeRole).toBe('passenger');
    expect(JSON.parse(localStorage.getItem('uniwheels_session')).name).toBe('Ana');
  });

  it('un usuario no-conductor siempre queda como pasajero al iniciar sesión', () => {
    useAppStore.getState().login({ id: 'u2', name: 'Luis', isDriver: false });
    expect(useAppStore.getState().user.role).toBe('passenger');
    expect(useAppStore.getState().user.driverStatus).toBe('unregistered');
  });

  it('logout limpia la sesión y el localStorage', () => {
    useAppStore.getState().login({ id: 'u1', name: 'Ana', isDriver: false });
    useAppStore.getState().logout();

    const state = useAppStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(localStorage.getItem('uniwheels_session')).toBeNull();
  });
});

describe('toggleRole', () => {
  it('un usuario sin isDriver nunca puede pasar a modo conductor', () => {
    useAppStore.getState().login({ id: 'u1', name: 'Ana', isDriver: false });
    useAppStore.getState().toggleRole();
    expect(useAppStore.getState().activeRole).toBe('passenger');
  });

  it('un conductor verificado sí puede alternar entre pasajero y conductor', () => {
    useAppStore.getState().login({ id: 'u1', name: 'Carlos', isDriver: true, role: 'passenger' });
    useAppStore.getState().toggleRole();
    expect(useAppStore.getState().activeRole).toBe('driver');

    useAppStore.getState().toggleRole();
    expect(useAppStore.getState().activeRole).toBe('passenger');
  });
});

describe('ciclo de vida del viaje del conductor', () => {
  it('cancelDriverTrip sin penalización no toca el saldo de la billetera', () => {
    const saldoInicial = useAppStore.getState().driverWalletBalance;
    useAppStore.setState({ activeDriverTrip: { id: 'trip_1' } });

    useAppStore.getState().cancelDriverTrip(false);

    const state = useAppStore.getState();
    expect(state.activeDriverTrip).toBeNull();
    expect(state.driverWalletBalance).toBe(saldoInicial);
  });

  it('cancelDriverTrip con penalización descuenta el monto indicado de la billetera', () => {
    const saldoInicial = useAppStore.getState().driverWalletBalance;
    useAppStore.setState({ activeDriverTrip: { id: 'trip_1' } });

    useAppStore.getState().cancelDriverTrip(true, 3000);

    expect(useAppStore.getState().driverWalletBalance).toBe(saldoInicial - 3000);
  });

  it('la penalización nunca deja el saldo en negativo', () => {
    useAppStore.setState({ activeDriverTrip: { id: 'trip_1' }, driverWalletBalance: 1000 });

    useAppStore.getState().cancelDriverTrip(true, 3000);

    expect(useAppStore.getState().driverWalletBalance).toBe(0);
  });

  it('finishActiveDriverTrip limpia el viaje activo sin penalización', () => {
    const saldoInicial = useAppStore.getState().driverWalletBalance;
    useAppStore.setState({ activeDriverTrip: { id: 'trip_1' }, currentRoutePassengerTrips: [{ id: 'p1' }] });

    useAppStore.getState().finishActiveDriverTrip();

    const state = useAppStore.getState();
    expect(state.activeDriverTrip).toBeNull();
    expect(state.currentRoutePassengerTrips).toEqual([]);
    expect(state.driverWalletBalance).toBe(saldoInicial);
  });
});

describe('billetera', () => {
  it('rechargeDriverWallet suma el monto al saldo actual', () => {
    const saldoInicial = useAppStore.getState().driverWalletBalance;
    useAppStore.getState().rechargeDriverWallet(20000);
    expect(useAppStore.getState().driverWalletBalance).toBe(saldoInicial + 20000);
  });
});
