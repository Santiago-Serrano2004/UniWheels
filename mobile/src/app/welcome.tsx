import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LogIn, ShieldCheck, UserPlus } from 'lucide-react-native';
import { Emblem } from '@/components/Emblem';

/**
 * Equivalente a frontend/src/components/auth/AuthGatewayView.jsx — la
 * pantalla de bienvenida real que se muestra ANTES de login/registro
 * (emblema + título + 2 botones), que faltaba por completo en mobile (se
 * saltaba directo a /login desde el splash).
 */
export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-100 dark:bg-slate-950">
      <View className="flex-1 justify-between p-5">
        <View className="pt-4" />

        <View className="items-center gap-6 w-full max-w-md mx-auto px-2">
          <Emblem size={112} />
          <View className="items-center gap-2">
            <Text className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">UniWheels</Text>
            <Text className="text-sm font-semibold text-lochmara-500">Movilidad Inteligente</Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 pt-0.5">Comparte tus rutas universitarias.</Text>
          </View>
        </View>

        <View className="gap-4 w-full max-w-md mx-auto pb-4 px-2">
          <View className="gap-3">
            <Pressable
              onPress={() => router.push('/login')}
              className="py-3.5 rounded-2xl bg-lochmara-600 flex-row items-center justify-center gap-2"
            >
              <LogIn size={16} color="#ffffff" />
              <Text className="text-white text-xs font-bold">Iniciar Sesión</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/register')}
              className="py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-row items-center justify-center gap-2"
            >
              <UserPlus size={16} color="#0284c7" />
              <Text className="text-slate-800 dark:text-white text-xs font-bold">Registrarse</Text>
            </Pressable>
          </View>

          <View className="flex-row items-center justify-center gap-1.5">
            <ShieldCheck size={14} color="#0284c7" />
            <Text className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
              Acceso exclusivo para comunidad universitaria
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
