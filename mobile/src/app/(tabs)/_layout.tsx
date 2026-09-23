import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
import { Home, Map, Route, User, Wallet } from 'lucide-react-native';
import { useAppStore } from '@uniwheels/shared';
import { AppHeader } from '@/components/AppHeader';
import { InstitutionalWelcomeModal } from '@/components/InstitutionalWelcomeModal';
import { DriverInviteModal } from '@/components/DriverInviteModal';

/**
 * Pestañas adaptativas según el rol activo (paridad con BottomNav.jsx de la web):
 * - Pasajero: Inicio / Ruta / Viajes / Perfil (Billetera oculta).
 * - Conductor: Mi Panel / Historial / Billetera / Perfil (Ruta oculta).
 */
export default function TabsLayout() {
  const activeRole = useAppStore((state) => state.activeRole);
  const isDriver = activeRole === 'driver';

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white dark:bg-slate-950">
      <AppHeader />
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#0284c7',
            tabBarInactiveTintColor: '#94a3b8',
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: isDriver ? 'Mi Panel' : 'Inicio',
              tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="map"
            options={{
              title: 'Ruta',
              tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
              href: isDriver ? null : '/(tabs)/map',
            }}
          />
          <Tabs.Screen
            name="history"
            options={{
              title: isDriver ? 'Historial' : 'Viajes',
              tabBarIcon: ({ color, size }) => <Route color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="wallet"
            options={{
              title: 'Billetera',
              tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
              href: isDriver ? '/(tabs)/wallet' : null,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Perfil',
              tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
            }}
          />
        </Tabs>
      </View>

      <InstitutionalWelcomeModal />
      <DriverInviteModal />
    </SafeAreaView>
  );
}
