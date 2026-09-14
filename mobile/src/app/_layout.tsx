import '@/global.css';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAppStore } from '@uniwheels/shared';

import { BrandedSplash } from '@/components/BrandedSplash';
import { bootstrapSdk } from '@/lib/sdk';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const isHydrating = useAppStore((state) => state.isHydrating);
  const hydrateSession = useAppStore((state) => state.hydrateSession);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    bootstrapSdk();
    hydrateSession();
    // El splash nativo de Expo (pantalla en blanco con el ícono, previa a
    // cualquier JS) se oculta de inmediato — nuestro splash de marca
    // (BrandedSplash, mismo degradado/logo que la web) toma el control desde
    // ahí como una capa JS normal.
    SplashScreen.hideAsync();
  }, [hydrateSession]);

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
  );
}
