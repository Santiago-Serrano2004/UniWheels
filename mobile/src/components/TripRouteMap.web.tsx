import { Text, View } from 'react-native';
import type { TripRouteMapProps } from './TripRouteMap';

/** Fallback web para TripRouteMap en entorno web. */
export function TripRouteMap({ style }: TripRouteMapProps) {
  return (
    <View style={style ?? { flex: 1 }} className="items-center justify-center bg-slate-100 dark:bg-slate-950">
      <Text className="text-xs text-slate-400">Mapa no disponible en web</Text>
    </View>
  );
}
