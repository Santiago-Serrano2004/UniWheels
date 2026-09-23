import React, { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type {
  LeafletMapProps,
  LeafletMapRef,
  LeafletMarker,
  LeafletPolyline,
  LeafletMarkerKind,
  LeafletPadding,
} from './LeafletMap';

export type {
  LeafletMapProps,
  LeafletMapRef,
  LeafletMarker,
  LeafletPolyline,
  LeafletMarkerKind,
  LeafletPadding,
};

export const LeafletMap = forwardRef<LeafletMapRef, LeafletMapProps>(
  ({ style, containerStyle }, ref) => {
    useImperativeHandle(ref, () => ({
      animateTo: () => {},
      fitToCoordinates: () => {},
      setCenter: () => {},
      invalidateSize: () => {},
    }));

    return (
      <View style={[styles.container, containerStyle, style]}>
        <Text style={styles.text}>
          El mapa interactivo Leaflet está optimizado para la app móvil (iOS/Android).
        </Text>
      </View>
    );
  }
);

LeafletMap.displayName = 'LeafletMap';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#0f172a',
  },
  text: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
