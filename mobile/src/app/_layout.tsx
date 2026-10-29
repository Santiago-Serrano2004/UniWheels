import '@/global.css';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { authService, useAppStore } from '@uniwheels/shared';

import { BrandedSplash } from '@/components/BrandedSplash';
import { LiveTripIslandWidget } from '@/components/LiveTripIslandWidget';
import { bootstrapSdk } from '@/lib/sdk';
import { addNotificationResponseListener, registerForPushNotificationsAsync } from '@/services/pushNotificationService';

SplashScreen.preventAutoHideAsync();
// Al importar el módulo, no en un useEffect: la config de API y el storage
// tienen que estar listos antes de que cualquier pantalla llame al backend.
bootstrapSdk();

export default function RootLayout() {
  const router = useRouter();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const user = useAppStore((state) => state.user);
  const isHydrating = useAppStore((state) => state.isHydrating);
  const hydrateSession = useAppStore((state) => state.hydrateSession);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    hydrateSession().then(() => {
      if (useAppStore.getState().isAuthenticated) {
        authService.me().then((u: any) => u && useAppStore.getState().syncUserFromServer(u));
      }
    });
    // El splash nativo de Expo (pantalla en blanco con el ícono, previa a
    // cualquier JS) se oculta de inmediato — nuestro splash de marca
    // (BrandedSplash, mismo degradado/logo que la web) toma el control desde
    // ahí como una capa JS normal.
    SplashScreen.hideAsync();
  }, [hydrateSession]);

  // Inicializar notificaciones push cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      registerForPushNotificationsAsync().then((token) => {
        if (token) {
          (useAppStore.getState() as any).setPushDeviceToken?.(token);
        }
      });
    }
  }, [isAuthenticated, user]);

  // Listener de interacción al tocar una notificación push (enrutamiento profundo)
  useEffect(() => {
    return addNotificationResponseListener((data) => {
      if (!data) return;

      // Enrutamiento según el tipo de notificación
      switch (data.type) {
        case 'driver_arrived':
        case 'trip_started':
        case 'trip_tracking':
          router.push('/(tabs)/map');
          break;
        case 'trip_completed':
        case 'rating_pending':
          router.push('/(tabs)/history');
          break;
        case 'vehicle_approved':
        case 'vehicle_rejected':
          router.push('/(tabs)/profile');
          break;
        default:
          router.push('/(tabs)');
          break;
      }
    });
  }, [router]);

  // Se muestra hasta que se cumplan AMBAS condiciones: terminó su propia
  // animación Y ya se resolvió si hay sesión guardada — evita un parpadeo de
  // login/tabs equivocado si la hidratación de AsyncStorage tarda más que la
  // animación en sí.
  if (!splashDone || isHydrating) {
    return (
      <View style={{ flex: 1 }}>
        <BrandedSplash onFinish={() => setSplashDone(true)} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
        </Stack.Protected>

        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
      </Stack>
      {isAuthenticated && <LiveTripIslandWidget />}
    </View>
  );
}
