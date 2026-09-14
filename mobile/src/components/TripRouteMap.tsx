import { useColorScheme } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { getMapTileProvider } from '@uniwheels/shared';

export type TripRouteMapProps = {
  originCoord: [number, number];
  destinationCoord: [number, number];
  routeCoords: [number, number][];
  style?: object;
};

/**
 * Mapa dedicado a la vista previa de reserva (equivalente recortado del
 * MapContainer de frontend/src/components/map/TripMapView.jsx): marcador de
 * origen del conductor, marcador de destino (campus) y la polilínea real
 * calle por calle de OSRM. Separado de AppMapView porque su contrato de
 * marcadores es distinto (tipos/colores fijos + polilínea) — mismo motivo por
 * el que react-native-maps siempre vive detrás de un wrapper con split de
 * plataforma (ver AppMapView.web.tsx).
 */
export function TripRouteMap({ originCoord, destinationCoord, routeCoords, style }: TripRouteMapProps) {
  const colorScheme = useColorScheme();
  const provider = getMapTileProvider(colorScheme === 'dark' ? 'dark' : 'light');
  const lineColor = colorScheme === 'dark' ? '#38bdf8' : '#0284c7';

  const latitudes = [originCoord[0], destinationCoord[0]];
  const longitudes = [originCoord[1], destinationCoord[1]];
  const midLat = (Math.min(...latitudes) + Math.max(...latitudes)) / 2;
  const midLng = (Math.min(...longitudes) + Math.max(...longitudes)) / 2;
  const latDelta = Math.max(Math.abs(latitudes[0] - latitudes[1]) * 1.8, 0.025);
  const lngDelta = Math.max(Math.abs(longitudes[0] - longitudes[1]) * 1.8, 0.025);

  return (
    <MapView
      style={style ?? { flex: 1 }}
      mapType="none"
      initialRegion={{ latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: lngDelta }}
    >
      <UrlTile urlTemplate={provider.url} maximumZ={provider.maxZoom} flipY={false} />

      {routeCoords.length > 1 && (
        <Polyline
          coordinates={routeCoords.map(([lat, lng]) => ({ latitude: lat, longitude: lng }))}
          strokeColor={lineColor}
          strokeWidth={5}
        />
      )}

      <Marker
        coordinate={{ latitude: originCoord[0], longitude: originCoord[1] }}
        pinColor="#0284c7"
        title="Origen del conductor"
      />
      <Marker
        coordinate={{ latitude: destinationCoord[0], longitude: destinationCoord[1] }}
        pinColor="#10b981"
        title="Campus destino"
      />
    </MapView>
  );
}
