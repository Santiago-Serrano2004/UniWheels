import { forwardRef } from 'react';
import MapView, { Marker, UrlTile, type Region } from 'react-native-maps';
import { useColorScheme } from 'react-native';
import { getMapTileProvider } from '@uniwheels/shared';

export type AppMapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
};

/**
 * Envoltorio de react-native-maps con los mismos basemaps gratuitos (Esri/OSM)
 * que ya usa la web (ver AppMapTileLayer.jsx / packages/shared/mapTileProviders.js)
 * — equivalente RN de <AppMapTileLayer>.
 *
 * Nota real de plataforma (no estaba en el plan original, se descubrió al
 * implementar): en Android, react-native-maps está construido sobre el SDK de
 * Google Maps incluso cuando solo se muestran tiles personalizados — Android
 * exige una API key de Google Maps para que el mapa inicialice, así se oculten
 * los tiles nativos de Google. iOS no la necesita (usa Apple Maps). Es gratis
 * hasta $200 USD/mes de uso (mismo tier que ya se usó para TomTom), pero SÍ es
 * un paso de configuración pendiente en app.json (`android.config.googleMaps.apiKey`)
 * antes de correr esto en un dispositivo/emulador Android real.
 */
export const AppMapView = forwardRef<
  MapView,
  { initialRegion: Region; markers?: AppMapMarker[]; style?: object }
>(({ initialRegion, markers, style }, ref) => {
  const colorScheme = useColorScheme();
  const provider = getMapTileProvider(colorScheme === 'dark' ? 'dark' : 'light');

  return (
    <MapView
      ref={ref}
      style={style ?? { flex: 1 }}
      initialRegion={initialRegion}
      // Oculta el mapa base nativo (Google/Apple) — solo se ve la capa de
      // tiles de Esri de abajo, igual que en la web.
      mapType="none"
      showsUserLocation
      showsMyLocationButton
    >
      <UrlTile urlTemplate={provider.url} maximumZ={provider.maxZoom} flipY={false} />
      {markers?.map((m) => (
        <Marker
          key={m.id}
          coordinate={{ latitude: m.latitude, longitude: m.longitude }}
          title={m.title}
          description={m.description}
        />
      ))}
    </MapView>
  );
});
AppMapView.displayName = 'AppMapView';
