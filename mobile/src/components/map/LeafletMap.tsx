import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import {
  StyleSheet,
  View,
  useColorScheme,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { getMapTileProvider } from '@uniwheels/shared';
import { generateLeafletHtml } from './leafletHtml';

export type LeafletMarkerKind =
  | 'origin'
  | 'destination'
  | 'pickup'
  | 'user'
  | 'vehicle-car'
  | 'vehicle-moto'
  | 'pin'
  | 'campus';

export interface LeafletMarker {
  id: string;
  coordinate: [number, number];
  kind: LeafletMarkerKind;
  label?: string;
  rotation?: number;
  isMoving?: boolean;
  isLive?: boolean;
  isPulse?: boolean;
  color?: string;
  dotColor?: string;
  forceBirrete?: boolean;
  draggable?: boolean;
}

export interface LeafletPolyline {
  id: string;
  coordinates: [number, number][];
  color: string;
  weight?: number;
  opacity?: number;
  dashArray?: string;
}

export interface LeafletPadding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  paddingSide?: number;
}

export interface LeafletMapRef {
  animateTo: (center: [number, number], zoom?: number, duration?: number) => void;
  fitToCoordinates: (
    coords: [number, number][],
    paddingPx?: number | LeafletPadding,
    duration?: number
  ) => void;
  setCenter: (center: [number, number], zoom?: number) => void;
  invalidateSize: () => void;
}

export interface LeafletMapProps {
  tileProvider?: {
    url: string;
    maxZoom?: number;
    attribution?: string;
  };
  initialCenter?: [number, number];
  initialZoom?: number;
  markers?: LeafletMarker[];
  polylines?: LeafletPolyline[];
  onMapPress?: (coordinate: [number, number]) => void;
  onRegionChangeComplete?: (center: [number, number], zoom: number) => void;
  onMarkerDragEnd?: (id: string, coordinate: [number, number]) => void;
  onReady?: () => void;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

const DEFAULT_CENTER: [number, number] = [7.1193, -73.1042];

export const LeafletMap = forwardRef<LeafletMapRef, LeafletMapProps>(
  (
    {
      tileProvider: customTileProvider,
      initialCenter = DEFAULT_CENTER,
      initialZoom = 13,
      markers = [],
      polylines = [],
      onMapPress,
      onRegionChangeComplete,
      onMarkerDragEnd,
      onReady,
      style,
      containerStyle,
    },
    ref
  ) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const fallbackTileProvider = useMemo(
      () => getMapTileProvider(isDark ? 'dark' : 'light'),
      [isDark]
    );
    const tileProvider = customTileProvider || fallbackTileProvider;

    const webViewRef = useRef<WebView>(null);
    const isReadyRef = useRef(false);
    const pendingInjectionsRef = useRef<string[]>([]);

    const executeJs = useCallback((code: string) => {
      if (isReadyRef.current && webViewRef.current) {
        webViewRef.current.injectJavaScript(`${code}; true;`);
      } else {
        pendingInjectionsRef.current.push(code);
      }
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        animateTo: (center, zoom, duration) => {
          executeJs(
            `window.__uniwheelsMap && window.__uniwheelsMap.animateTo(${JSON.stringify(
              center
            )}, ${zoom ?? 'undefined'}, ${duration ?? 'undefined'})`
          );
        },
        fitToCoordinates: (coords, paddingPx, duration) => {
          executeJs(
            `window.__uniwheelsMap && window.__uniwheelsMap.fitToCoordinates(${JSON.stringify(
              coords
            )}, ${JSON.stringify(paddingPx)}, ${duration ?? 'undefined'})`
          );
        },
        setCenter: (center, zoom) => {
          executeJs(
            `window.__uniwheelsMap && window.__uniwheelsMap.setCenter(${JSON.stringify(
              center
            )}, ${zoom ?? 'undefined'})`
          );
        },
        invalidateSize: () => {
          executeJs(`window.__uniwheelsMap && window.__uniwheelsMap.invalidateSize()`);
        },
      }),
      [executeJs]
    );

    // Sincronización incremental de marcadores
    const prevMarkersRef = useRef<LeafletMarker[]>([]);
    useEffect(() => {
      prevMarkersRef.current = markers;
      executeJs(
        `window.__uniwheelsMap && window.__uniwheelsMap.updateMarkers(${JSON.stringify(
          markers
        )})`
      );
    }, [markers, executeJs]);

    // Sincronización incremental de polilíneas
    const prevPolylinesRef = useRef<LeafletPolyline[]>([]);
    useEffect(() => {
      prevPolylinesRef.current = polylines;
      executeJs(
        `window.__uniwheelsMap && window.__uniwheelsMap.updatePolylines(${JSON.stringify(
          polylines
        )})`
      );
    }, [polylines, executeJs]);

    // Actualización de tiles al cambiar de proveedor o tema
    useEffect(() => {
      executeJs(
        `window.__uniwheelsMap && window.__uniwheelsMap.setTileProvider(${JSON.stringify(
          tileProvider.url
        )}, ${tileProvider.maxZoom || 19})`
      );
    }, [tileProvider, executeJs]);

    const handleMessage = useCallback(
      (event: WebViewMessageEvent) => {
        try {
          const data = JSON.parse(event.nativeEvent.data);
          if (!data || !data.type) return;

          switch (data.type) {
            case 'onReady': {
              isReadyRef.current = true;
              // Ejecutar inicialización de marcadores y polilíneas
              if (prevMarkersRef.current.length > 0) {
                webViewRef.current?.injectJavaScript(
                  `window.__uniwheelsMap && window.__uniwheelsMap.updateMarkers(${JSON.stringify(
                    prevMarkersRef.current
                  )}); true;`
                );
              }
              if (prevPolylinesRef.current.length > 0) {
                webViewRef.current?.injectJavaScript(
                  `window.__uniwheelsMap && window.__uniwheelsMap.updatePolylines(${JSON.stringify(
                    prevPolylinesRef.current
                  )}); true;`
                );
              }
              // Vaciar inyecciones pendientes
              while (pendingInjectionsRef.current.length > 0) {
                const nextCode = pendingInjectionsRef.current.shift();
                if (nextCode) {
                  webViewRef.current?.injectJavaScript(`${nextCode}; true;`);
                }
              }
              onReady?.();
              break;
            }
            case 'onMapPress':
              onMapPress?.(data.coordinate);
              break;
            case 'onRegionChangeComplete':
              onRegionChangeComplete?.(data.center, data.zoom);
              break;
            case 'onMarkerDragEnd':
              onMarkerDragEnd?.(data.id, data.coordinate);
              break;
          }
        } catch {
          // Ignorar mensajes no JSON
        }
      },
      [onMapPress, onRegionChangeComplete, onMarkerDragEnd, onReady]
    );

    const htmlContent = useMemo(() => {
      return generateLeafletHtml({
        tileUrl: tileProvider.url,
        maxZoom: tileProvider.maxZoom || 19,
        initialCenter,
        initialZoom,
        isDark,
      });
      // Solo recrear HTML si cambia el tema, evitando reloads innecesarios
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDark]);

    const bgThemeColor = isDark ? '#020617' : '#f8fafc';

    return (
      <View style={[styles.container, { backgroundColor: bgThemeColor }, containerStyle]}>
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          onMessage={handleMessage}
          onLoadStart={() => {
            // Al recargar (cambio de tema) el mapa anterior deja de existir:
            // encolar las inyecciones hasta el próximo 'onReady'.
            isReadyRef.current = false;
          }}
          style={[styles.webview, style]}
          containerStyle={{ backgroundColor: bgThemeColor }}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          scalesPageToFit={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
        />
      </View>
    );
  }
);

LeafletMap.displayName = 'LeafletMap';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
