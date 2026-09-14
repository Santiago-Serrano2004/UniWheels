import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Building2, Check, MapPin, Search, ShieldCheck, X } from 'lucide-react-native';

export type Campus = {
  id: number;
  name: string;
  address?: string;
  code?: string;
  image_url?: string;
  is_main_campus?: boolean;
};

const jardinImg = require('../../assets/campuses/el-jardin.webp');
const bosqueImg = require('../../assets/campuses/el-bosque.webp');
const csuImg = require('../../assets/campuses/csu.webp');
const casonaImg = require('../../assets/campuses/la-casona.webp');

// Mismo mapeo que frontend/src/components/home/CampusSelectorModal.jsx —
// las imágenes reales de sede se empaquetan localmente (require) porque RN no
// puede cargarlas desde una URL relativa como hace la web.
const CAMPUS_STATIC_IMAGES: Record<string, any> = {
  JARDIN: jardinImg,
  BOSQUE: bosqueImg,
  CSU: csuImg,
  CASONA: casonaImg,
  'Campus El Jardín': jardinImg,
  'Campus El Bosque': bosqueImg,
  'CSU — Centro de Servicios Universitarios': csuImg,
  'Campus La Casona': casonaImg,
};

const getCampusImage = (campus: Campus) =>
  (campus.code && CAMPUS_STATIC_IMAGES[campus.code]) || CAMPUS_STATIC_IMAGES[campus.name] || jardinImg;

/**
 * Equivalente a frontend/src/components/home/CampusSelectorModal.jsx — mismo
 * layout: tarjeta centrada (no bottom-sheet), cabecera con eyebrow + título +
 * nombre de institución, buscador si hay más de 3 sedes, y lista VERTICAL de
 * tarjetas con foto a todo el ancho (la web no usa grilla de 2 columnas).
 */
export function CampusSelectorModal({
  isOpen,
  onClose,
  campuses,
  selectedCampus,
  onSelectCampus,
  institutionName = 'Universidad Autónoma de Bucaramanga',
}: {
  isOpen: boolean;
  onClose: () => void;
  campuses: Campus[];
  selectedCampus: string;
  onSelectCampus: (campus: Campus) => void;
  institutionName?: string;
}) {
  const [filtroTexto, setFiltroTexto] = useState('');

  const sedesFiltradas = campuses.filter((sede) => {
    const termino = filtroTexto.toLowerCase();
    return (
      sede.name?.toLowerCase().includes(termino) || sede.address?.toLowerCase().includes(termino)
    );
  });

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/80 items-center justify-center p-4" onPress={onClose}>
        <Pressable
          className="w-full max-w-[380px] bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800"
          style={{ maxHeight: '85%' }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Cabecera */}
          <View className="flex-row items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <View className="gap-0.5 flex-1">
              <View className="flex-row items-center gap-1.5">
                <Building2 size={15} color="#0284c7" />
                <Text className="text-[10px] font-extrabold uppercase tracking-wider text-lochmara-600 dark:text-lochmara-400">
                  Sedes Universitarias
                </Text>
              </View>
              <Text className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                Selecciona tu Campus
              </Text>
              <Text className="text-[11px] text-slate-400" numberOfLines={1}>
                {institutionName}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} className="w-8 h-8 rounded-xl items-center justify-center shrink-0">
              <X size={16} color="#94a3b8" />
            </Pressable>
          </View>

          {campuses.length > 3 && (
            <View className="pt-3 pb-1">
              <View className="flex-row items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <Search size={13} color="#94a3b8" />
                <TextInput
                  value={filtroTexto}
                  onChangeText={setFiltroTexto}
                  placeholder="Buscar sede o dirección..."
                  placeholderTextColor="#94a3b8"
                  className="flex-1 text-xs font-bold text-slate-900 dark:text-white"
                />
                {filtroTexto ? (
                  <Pressable onPress={() => setFiltroTexto('')} hitSlop={6}>
                    <X size={12} color="#94a3b8" />
                  </Pressable>
                ) : null}
              </View>
            </View>
          )}

          {/* Lista vertical de sedes con foto */}
          <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ paddingVertical: 12, gap: 10 }}>
            {sedesFiltradas.length > 0 ? (
              sedesFiltradas.map((campus) => {
                const isSelected = campus.name === selectedCampus;
                return (
                  <Pressable
                    key={campus.id}
                    onPress={() => {
                      onSelectCampus(campus);
                      onClose();
                    }}
                    className={`rounded-2xl overflow-hidden border ${
                      isSelected
                        ? 'border-lochmara-500'
                        : 'border-slate-200 dark:border-slate-800'
                    } bg-slate-50 dark:bg-slate-950/60`}
                  >
                    <View className="h-24 w-full bg-slate-800 relative">
                      <Image source={getCampusImage(campus)} className="w-full h-full" resizeMode="cover" />

                      {campus.is_main_campus && (
                        <View className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-500/90">
                          <Text className="text-[9px] font-extrabold uppercase tracking-wider text-white">
                            Sede Principal
                          </Text>
                        </View>
                      )}

                      {isSelected && (
                        <View className="absolute top-2 right-2 w-6 h-6 rounded-full bg-lochmara-500 items-center justify-center">
                          <Check size={13} color="#ffffff" strokeWidth={3} />
                        </View>
                      )}

                      <View className="absolute bottom-2 left-3 right-3">
                        <Text className="text-xs font-black text-white" numberOfLines={1}>
                          {campus.name}
                        </Text>
                      </View>
                    </View>

                    <View className="p-2.5 flex-row items-center gap-1.5">
                      <MapPin size={12} color="#0284c7" />
                      <Text className="text-[11px] text-slate-400 flex-1" numberOfLines={1}>
                        {campus.address || ''}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            ) : (
              <View className="p-6 items-center gap-1">
                <Building2 size={22} color="#94a3b8" />
                <Text className="text-xs font-bold text-slate-400">No se encontraron sedes con ese nombre.</Text>
              </View>
            )}
          </ScrollView>

          <View className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex-row items-center justify-between">
            <View className="flex-row items-center gap-1">
              <ShieldCheck size={13} color="#0284c7" />
              <Text className="text-[10px] text-slate-400">Sedes oficiales verificadas</Text>
            </View>
            <Text className="text-[10px] text-slate-400">{campuses.length} sedes</Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
