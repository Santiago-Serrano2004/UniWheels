import { Text, View } from 'react-native';
import type { AppMapMarker } from './AppMapView';

/**
 * react-native-maps no tiene una implementación web funcional out-of-the-box.
 * La app es mobile-first (Expo Router elige este archivo automáticamente para
 * `expo start --web`/`expo export --platform web`) — el target real es
 * iOS/Android. Un mapa web real (con react-leaflet, como la SPA) queda fuera
 * de alcance de esta fase; esto solo evita que el build de web se rompa.
 */
export const AppMapView = (_props: { initialRegion: unknown; markers?: AppMapMarker[]; style?: object }) => (
  <View className="flex-1 items-center justify-center bg-slate-100 dark:bg-slate-900 p-6">
    <Text className="text-sm text-slate-500 dark:text-slate-400 text-center">
      El mapa interactivo solo está disponible en la app móvil (iOS/Android),
      no en la vista web de desarrollo.
    </Text>
  </View>
);
