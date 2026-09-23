import React, { useEffect, useMemo, useRef } from 'react';
import { useColorScheme, type StyleProp, type ViewStyle } from 'react-native';
import { LeafletMap, type LeafletMapRef, type LeafletMarker, type LeafletPolyline } from './map/LeafletMap';

export type TripRouteMapProps = {
  originCoord: [number, number];
  destinationCoord: [number, number];
  routeCoords: [number, number][];
  style?: StyleProp<ViewStyle>;
};

/**
 * Mapa dedicado a la vista previa de reserva: marcador de origen del
 * conductor, marcador de destino (campus) y la polilínea real de la ruta.
 * Construido con Leaflet 1.9.4 en WebView (paridad 1:1 con frontend).
 */
export function TripRouteMap({ originCoord, destinationCoord, routeCoords, style }: TripRouteMapProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const lineColor = isDark ? '#38bdf8' : '#0284c7';
  const mapRef = useRef<LeafletMapRef>(null);

  const midLat = (originCoord[0] + destinationCoord[0]) / 2;
  const midLng = (originCoord[1] + destinationCoord[1]) / 2;

  const markers: LeafletMarker[] = useMemo(
    () => [
      {
        id: 'origin',
        coordinate: originCoord,
        kind: 'origin',
        label: 'Origen del conductor',
        color: '#0284c7',
      },
      {
        id: 'destination',
        coordinate: destinationCoord,
        kind: 'campus',
        label: 'Campus destino',
        color: '#10b981',
        forceBirrete: true,
      },
    ],
    [originCoord, destinationCoord]
  );

  const polylines: LeafletPolyline[] = useMemo(() => {
    if (routeCoords && routeCoords.length > 1) {
      return [
        {
          id: 'route-polyline',
          coordinates: routeCoords,
          color: lineColor,
          weight: 5,
          opacity: 0.9,
        },
      ];
    }
    return [];
  }, [routeCoords, lineColor]);

  const fitBounds = () => {
    const points = routeCoords && routeCoords.length > 1 ? routeCoords : [originCoord, destinationCoord];
    mapRef.current?.fitToCoordinates(points, { top: 70, bottom: 230, left: 35, right: 35 });
  };

  useEffect(() => {
    fitBounds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeCoords, originCoord, destinationCoord]);

  return (
    <LeafletMap
      ref={mapRef}
      initialCenter={[midLat, midLng]}
      initialZoom={13}
      markers={markers}
      polylines={polylines}
      onReady={fitBounds}
      style={style}
    />
  );
}
