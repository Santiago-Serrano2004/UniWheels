import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
import { Home, Map, Route, User } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { InstitutionalWelcomeModal } from '@/components/InstitutionalWelcomeModal';
import { DriverInviteModal } from '@/components/DriverInviteModal';

/**
 * Mismos 4 tabs que la web para el rol pasajero (BottomNav.jsx):
 * Inicio / Ruta / Viajes / Perfil — SIN Billetera (esa es exclusiva del modo
 * conductor en la web, Fase 2 de este plan — no antes).
 */
export default function TabsLayout() {
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
            options={{ title: 'Inicio', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
          />
          <Tabs.Screen
            name="map"
            options={{ title: 'Ruta', tabBarIcon: ({ color, size }) => <Map color={color} size={size} /> }}
          />
          <Tabs.Screen
            name="history"
            options={{ title: 'Viajes', tabBarIcon: ({ color, size }) => <Route color={color} size={size} /> }}
          />
          <Tabs.Screen
            name="profile"
            options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
          />
          {/* wallet.tsx sigue existiendo como archivo (se reutiliza en la Fase 2,
              modo conductor) pero no se lista como tab aquí — no es alcanzable
              desde la navegación de pasajero, igual que en la web. */}
          <Tabs.Screen name="wallet" options={{ href: null }} />
        </Tabs>
      </View>

      <InstitutionalWelcomeModal />
      <DriverInviteModal />
    </SafeAreaView>
  );
}
