import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { setStorageAdapter, setApiConfig, setOnSessionExpired, useAppStore } from '@uniwheels/shared';
import { apiConfig } from './env';

let bootstrapped = false;

/**
 * Cumple el contrato de inicialización de @uniwheels/shared (ver su README) —
 * se llama una sola vez, antes de renderizar cualquier pantalla. Se hace
 * idempotente a propósito porque el layout raíz de Expo Router puede volver a
 * montarse en fast refresh durante desarrollo.
 */
export function bootstrapSdk() {
  if (bootstrapped) return;
  bootstrapped = true;

  setStorageAdapter({
    getItem: (key: string) => AsyncStorage.getItem(key),
    setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
    removeItem: (key: string) => AsyncStorage.removeItem(key),
  });

  setApiConfig(apiConfig);

  // El refresh de token falló de verdad (sin forma de renovar la sesión) —
  // limpiar el store y mandar al usuario de vuelta al login.
  setOnSessionExpired(() => {
    useAppStore.getState().logout();
    router.replace('/login');
  });
}
