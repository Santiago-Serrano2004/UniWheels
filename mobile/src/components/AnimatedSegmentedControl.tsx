import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export type SegmentOption<T extends string> = { key: T; label: string; icon?: ReactNode };

/**
 * Control segmentado con "pill" deslizante — equivalente al patrón
 * `layoutId="direction-pill-home"` / `layoutId="date-pill-home"` de framer-motion
 * en frontend/src/components/home/HomeHeroRouteCard.jsx (spring stiffness 400,
 * damping 30, idéntico aquí vía Reanimated).
 */
export function AnimatedSegmentedControl<T extends string>({
  segments,
  value,
  onChange,
}: {
  segments: SegmentOption<T>[];
  value: T;
  onChange: (key: T) => void;
}) {
  const [containerWidth, setContainerWidth] = useState(0);
  const activeIndex = Math.max(
    0,
    segments.findIndex((s) => s.key === value)
  );
  const innerWidth = containerWidth > 0 ? containerWidth - 8 : 0; // menos padding p-1 (4px) por lado
  const segmentWidth = innerWidth / segments.length;

  const pillTranslateX = useSharedValue(0);

  useEffect(() => {
    if (containerWidth > 0) {
      pillTranslateX.value = withSpring(activeIndex * segmentWidth, { damping: 30, stiffness: 400 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, containerWidth]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillTranslateX.value }],
    width: segmentWidth,
  }));

  return (
    <View
      className="flex-row p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {containerWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            // Estilos en línea: className no se aplica en Animated.View.
            { position: 'absolute', top: 4, bottom: 4, left: 4, borderRadius: 12, backgroundColor: '#0284c7' },
            pillStyle,
            { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
          ]}
        />
      )}
      {segments.map((seg) => (
        <Pressable
          key={seg.key}
          onPress={() => onChange(seg.key)}
          className="flex-1 py-1.5 items-center justify-center flex-row gap-1"
        >
          {seg.icon}
          <Text
            className={`text-[11px] font-bold ${value === seg.key ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}
            numberOfLines={1}
          >
            {seg.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
