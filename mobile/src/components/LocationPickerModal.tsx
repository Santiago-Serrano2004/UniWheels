import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, useColorScheme, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { CheckCircle2, MapPin, Sparkles, X } from 'lucide-react-native';
import { getMapTileProvider, placesApiService } from '@uniwheels/shared';

export type PickedLocation = { coords: [number, number]; address: string };

const CENTRO_BUCARAMANGA: [number, number] = [7.1193, -73.1042];

/**
 * Equivalente FUNCIONAL a frontend/src/components/map/LocationPickerModal.jsx
 * (pin arrastrable + geocodificación inversa real vía placesApiService), pero
 * como tarjeta centrada — igual que el resto de los popups de la app
 * (CampusSelectorModal, SetHomeLocationModal, etc.) en vez de pantalla
 * completa, por pedido explícito: el mapa vive embebido y acotado dentro de
 * la tarjeta, no de borde a borde.
 */
export function LocationPickerModal({
  isOpen,
  onClose,
  initialCoords,
  initialPlaceName = '',
  title = 'Ajustar Punto en el Mapa',
  confirmButtonText = 'Confirmar ubicación',
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialCoords?: [number, number] | null;
  initialPlaceName?: string;
  title?: string;
  confirmButtonText?: string;
  onConfirm: (loc: PickedLocation) => void;
}) {
  const colorScheme = useColorScheme();
  const provider = getMapTileProvider(colorScheme === 'dark' ? 'dark' : 'light');
  const mapRef = useRef<MapView>(null);

  const [coords, setCoords] = useState<[number, number]>(initialCoords || CENTRO_BUCARAMANGA);
  const [placeName, setPlaceName] = useState(initialPlaceName);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const fresh = initialCoords || CENTRO_BUCARAMANGA;
    setCoords(fresh);
    setPlaceName(initialPlaceName);
    setShowHint(true);

    if (!initialPlaceName) {
      placesApiService.reverseGeocode(fresh[0], fresh[1]).then((name: string) => {
        if (name) setPlaceName(name);
      });
    }

    const timer = setTimeout(() => setShowHint(false), 3500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleCoordsChange = async (lat: number, lng: number) => {
    setCoords([lat, lng]);
    setIsGeocoding(true);
    try {
      const name = await placesApiService.reverseGeocode(lat, lng);
      if (name) setPlaceName(name);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleConfirm = () => {
    const resolvedName = placeName || `Sector (${coords[0].toFixed(4)}, ${coords[1].toFixed(4)})`;
    onConfirm({ coords, address: resolvedName });
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/80 items-center justify-center p-4" onPress={onClose}>
        <Pressable
          className="w-full max-w-[380px] bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 gap-3"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Cabecera — mismo patrón que el resto de los modales */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2 flex-1 min-w-0">
              <View className="w-8 h-8 rounded-xl bg-lochmara-50 dark:bg-slate-800 items-center justify-center shrink-0">
                <MapPin size={16} color="#0284c7" />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-xs font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                  {title}
                </Text>
                <View className="flex-row items-center gap-1">
                  {isGeocoding && <ActivityIndicator size="small" color="#0284c7" />}
                  <Text className="text-[10px] font-bold text-lochmara-600 dark:text-lochmara-400" numberOfLines={1}>
                    {isGeocoding ? 'Detectando dirección...' : placeName || 'Punto fijado'}
                  </Text>
                </View>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={8} className="p-1">
              <X size={16} color="#94a3b8" />
            </Pressable>
          </View>

          {/* Mapa acotado dentro de la tarjeta */}
          <View className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800" style={{ height: 260 }}>
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              mapType="none"
              initialRegion={{ latitude: coords[0], longitude: coords[1], latitudeDelta: 0.01, longitudeDelta: 0.01 }}
              onPress={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                handleCoordsChange(latitude, longitude);
              }}
            >
              <UrlTile urlTemplate={provider.url} maximumZ={provider.maxZoom} flipY={false} />
              <Marker
                coordinate={{ latitude: coords[0], longitude: coords[1] }}
                draggable
                onDragEnd={(e) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  handleCoordsChange(latitude, longitude);
                }}
              />
            </MapView>

            {showHint && (
              <View className="absolute top-2 self-center px-3 py-1 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 flex-row items-center gap-1.5">
                <Sparkles size={12} color="#38bdf8" />
                <Text className="text-[10px] font-medium text-slate-800 dark:text-slate-200">Toca el mapa o arrastra el pin</Text>
              </View>
            )}
          </View>

          {/* Confirmación */}
          <View className="flex-row items-center justify-between gap-2">
            <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ubicación fijada:</Text>
            <Text className="text-xs font-bold text-slate-900 dark:text-white flex-1 text-right" numberOfLines={1}>
              {isGeocoding ? 'Detectando dirección...' : placeName || 'Punto fijado en el mapa'}
            </Text>
          </View>
          <Pressable onPress={handleConfirm} className="py-3 rounded-2xl bg-lochmara-600 flex-row items-center justify-center gap-2">
            <CheckCircle2 size={16} color="#ffffff" />
            <Text className="text-white text-xs font-black">{confirmButtonText}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
