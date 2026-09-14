import { useEffect } from 'react';
import Svg, { G, Path } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

/**
 * Réplica 1:1 de frontend/src/components/common/AnimatedLogo.jsx (variante NO
 * estática) — mismos 20 paths, mismos colores, mismos delays escalonados y
 * misma curva de easing que el framer-motion original, portados a Reanimated +
 * react-native-svg. Nota de fidelidad: en la web, `pathLength` (el "trazo
 * calado") se aplica sobre paths con SOLO `fill` (sin `stroke`) — por spec de
 * SVG eso no dibuja nada visible ahí (pathLength anima stroke-dasharray, y sin
 * stroke no hay nada que revelar); el efecto real que se ve en el navegador es
 * el fade-in escalonado por `opacity`, que es exactamente lo que se reproduce
 * aquí — no hace falta fingir un "dibujado" que el propio original tampoco
 * muestra.
 */

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Misma curva cúbica-bezier que framer-motion usa para las transiciones de
// salida en SplashScreen.jsx / AnimatedLogo.jsx.
const EXIT_EASING = Easing.bezier(0.7, 0, 0.84, 0);

type EmblemPathConfig = { d: string; fill: string; delay: number };
type LetterPathConfig = { d: string; delay: number };

// 1) Capas del emblema — fill sólido por grupo, delay escalonado 0.1s a 0.8s.
const EMBLEM_PATHS: EmblemPathConfig[] = [
  {
    fill: '#033b6f',
    delay: 0.1,
    d: 'M348.98 192.18 c-2.71 -3.05 -8.02 -13.48 -8.02 -15.65 0 -1.18 0.49 -2.41 1.62 -3.89 0.89 -1.18 3.35 -4.67 5.51 -7.68 3.74 -5.36 3.89 -5.56 5.66 -5.56 l1.82 0 2.56 5.41 c1.43 3.05 2.51 6.10 2.51 6.99 0 0.89 -1.08 4.97 -2.41 9.05 -1.33 4.08 -2.71 8.81 -3.05 10.48 l-0.59 3 -1.82 0 c-1.62 0 -2.16 -0.34 -3.79 -2.16z',
  },
  {
    fill: '#054d82',
    delay: 0.2,
    d: 'M398.77 194.74 c-0.10 -0.34 -1.13 -3.30 -2.26 -6.54 -1.13 -3.25 -3.44 -9 -5.17 -12.79 -2.46 -5.41 -3.15 -7.38 -3.15 -9.25 l0 -2.41 1.87 0.15 c2.21 0.15 3.05 -0.25 3.05 -1.57 0 -0.74 0.34 -0.93 1.67 -0.93 1.33 0 1.87 0.34 2.90 1.87 0.69 0.98 1.53 2.41 1.87 3.15 0.30 0.74 0.74 1.23 0.98 1.08 0.69 -0.39 2.36 -5.51 2.90 -8.81 1.28 -7.92 -3.59 -17.96 -10.53 -21.65 -1.62 -0.89 -1.82 -1.18 -1.67 -2.71 0.15 -1.67 0.20 -1.72 2.61 -1.87 6.30 -0.44 18.79 1.77 24.40 4.28 2.26 1.03 2.31 1.08 3.44 5.07 0.98 3.54 1.18 5.17 1.18 12.45 0 7.58 -0.15 8.86 -1.38 13.58 -1.48 5.71 -4.33 13.38 -6.74 18.16 -1.92 3.79 -5.07 7.23 -7.63 8.41 -2.31 1.08 -8.02 1.28 -8.36 0.34z',
  },
  {
    fill: '#0b6094',
    delay: 0.3,
    d: 'M385.24 163.99 c-4.72 -7.68 -8.76 -11.02 -12.30 -9.99 -0.93 0.30 -2.46 0.49 -3.30 0.49 -1.53 0 -1.62 -0.10 -1.62 -1.62 0 -2.21 2.41 -5.85 4.97 -7.58 1.82 -1.18 2.66 -1.38 6.35 -1.53 3.59 -0.15 4.62 0 6.30 0.84 2.61 1.33 3.64 2.71 8.41 11.46 3.74 6.79 4.87 10.23 3.49 10.23 -0.25 0 -0.49 -0.15 -0.49 -0.34 -0.05 -0.25 -0.59 -1.03 -1.28 -1.87 -1.08 -1.23 -1.23 -1.33 -1.03 -0.44 0.34 1.53 -2.02 2.85 -3.84 2.16 -1.28 -0.49 -1.33 -0.44 -1.13 0.98 0.20 1.23 0.05 1.48 -0.84 1.48 -0.84 0 -1.72 -1.03 -3.69 -4.28z',
  },
  {
    fill: '#30a9d8',
    delay: 0.4,
    d: 'M285.86 198.72 c-15.20 -3.99 -26.22 -16.04 -29.82 -32.67 -0.84 -3.89 -1.53 -23.17 -0.98 -26.96 0.59 -3.74 1.77 -3.20 4.43 2.02 3.30 6.35 8.61 12.10 13.48 14.56 1.43 0.74 1.57 0.98 1.57 3.20 0 5.12 2.90 11.12 6.84 14.27 4.62 3.69 11.61 5.46 17.37 4.48 9.25 -1.62 14.66 -6.84 32.87 -31.73 14.27 -19.53 19.04 -24.55 28 -29.18 7.38 -3.89 11.07 -4.72 20.22 -4.77 8.86 0 11.56 0.59 18.45 3.94 5.31 2.61 9.40 5.81 13.23 10.48 2.71 3.35 7.48 11.76 6.99 12.30 -0.15 0.10 -1.33 -0.25 -2.61 -0.79 -5.02 -2.16 -16.33 -4.18 -22.04 -3.99 -1.08 0.05 -3.74 -0.30 -5.85 -0.79 -6.59 -1.48 -12.74 -0.54 -19.39 2.95 -6.40 3.35 -9.45 6.74 -21.25 23.62 -12.64 18.01 -19.58 26.42 -26.03 31.29 -4.28 3.25 -11.17 6.64 -15.99 7.82 -5.31 1.33 -14.32 1.33 -19.48 -0.05z',
  },
  {
    fill: '#30a9d8',
    delay: 0.5,
    d: 'M354.15 193.51 c-0.49 -0.10 -0.89 -0.59 -0.89 -1.08 0 -1.23 1.77 -8.12 3.05 -11.71 1.23 -3.59 2.46 -4.08 4.08 -1.62 1.62 2.41 3.64 3.59 6.54 3.84 3 0.25 3 0.25 0.30 4.33 -1.97 3 -4.13 4.97 -6.45 5.95 -1.53 0.59 -4.87 0.79 -6.64 0.30z',
  },
  {
    fill: '#30a9d8',
    delay: 0.6,
    d: 'M310.46 137.42 l0 -27.21 9.35 0 9.35 0 0 14.17 c0 14.12 0 14.17 -1.23 16.63 -1.03 2.07 -12.60 17.86 -16.19 22.09 l-1.23 1.48 -0.05 -27.16z',
  },
  {
    fill: '#53c3ec',
    delay: 0.7,
    d: 'M397.54 192.87 c-3.20 -1.67 -4.72 -3.89 -12.84 -18.55 -2.56 -4.67 -4.43 -7.53 -4.92 -7.53 -0.44 0 -2.12 2.51 -4.38 6.54 -6.54 11.71 -6.10 11.17 -8.86 11.17 -3.69 0 -5.07 -0.79 -8.31 -4.67 l-1.18 -1.38 0.89 -2.76 c1.62 -5.12 10.58 -21.89 12.10 -22.73 0.54 -0.25 2.07 -0.64 3.35 -0.79 3.05 -0.34 6.05 0.98 8.76 3.94 2.90 3.15 7.38 10.68 10.77 18.06 3.74 8.17 7.82 19.68 6.94 19.68 -0.30 -0.05 -1.38 -0.44 -2.31 -0.98z',
  },
  {
    fill: '#53c3ec',
    delay: 0.8,
    d: 'M272.08 157.54 c-5.95 -3.44 -10.43 -8.22 -14.37 -15.35 l-2.61 -4.67 0 -13.53 0 -13.53 9.50 -0.15 c7.28 -0.10 9.54 0 9.69 0.49 0.15 0.34 0.20 11.32 0.15 24.35 l-0.15 23.67 -2.21 -1.28z',
  },
];

// 2) Letras "UniWheels" — grupo blanco, delay 0.85s a 1.54s (translate del
// grupo idéntica a la web: -1.3095708,-0.23110074).
const LETTER_PATHS: LetterPathConfig[] = [
  {
    delay: 0.85,
    d: 'm 247.53,245.51 c -3.2,-0.69 -5.66,-2.51 -6.99,-5.26 -1.13,-2.26 -1.18,-2.8 -1.18,-13.19 v -10.82 l 2.85,-0.15 2.8,-0.15 v 9.89 c 0,10.63 0.34,12.45 2.51,13.97 0.64,0.44 2.12,0.79 3.39,0.79 2.07,0 2.9,-0.39 4.53,-2.12 0.05,-0.05 0.25,-5.07 0.39,-11.17 l 0.25,-11.07 2.85,-0.15 2.85,-0.15 -0.15,11.71 c -0.15,13.09 -0.3,13.58 -3.94,16.53 -1.48,1.18 -2.31,1.48 -4.92,1.62 -1.72,0.05 -4.08,-0.05 -5.26,-0.3 z',
  },
  {
    delay: 0.92,
    d: 'm 267.65,234.64 v -10.82 l 2.61,0.15 c 1.87,0.1 2.56,0.34 2.61,0.89 0.1,1.53 0.25,1.53 1.67,0.3 3,-2.51 7.38,-2.31 9.79,0.44 1.82,2.12 2.12,3.94 1.92,12.79 l -0.15,6.89 -2.56,0.15 -2.61,0.15 -0.1,-2.36 c -0.05,-1.28 -0.05,-3.79 0.05,-5.51 0.1,-1.72 0,-4.33 -0.2,-5.76 l -0.3,-2.66 h -2.9 c -4.23,0 -4.43,0.44 -4.43,9.2 v 7.04 h -2.71 -2.71 v -10.87 z',
  },
  {
    delay: 0.99,
    d: 'm 291.76,234.64 v -10.82 l 2.61,0.15 2.56,0.15 0.15,10.73 0.1,10.68 h -2.71 -2.71 v -10.87 z',
  },
  {
    delay: 1.03,
    d: 'm 291.76,218.45 v -2.46 h 2.71 2.71 v 2.46 2.46 h -2.71 -2.71 z',
  },
  {
    delay: 1.08,
    d: 'm 306.03,241.23 c -0.84,-3.44 -4.28,-17.96 -5.66,-24.11 -0.25,-1.08 -0.1,-1.13 2.66,-1.13 2.9,0 2.9,0 3.25,1.62 1.48,7.38 3.94,18.01 4.13,17.81 0.1,-0.15 1.08,-3.74 2.12,-8.02 1.03,-4.23 2.12,-8.56 2.41,-9.54 l 0.49,-1.87 h 3.39 3.35 l 2.36,9.84 c 1.28,5.41 2.46,9.74 2.56,9.59 0.1,-0.1 1.13,-4.48 2.26,-9.69 l 2.02,-9.5 2.85,-0.15 c 1.62,-0.1 2.8,0.05 2.8,0.34 0,0.49 -5.46,23.71 -6.45,27.26 l -0.49,1.87 -3.05,-0.15 -3,-0.15 -1.77,-7.38 c -0.98,-4.03 -1.92,-8.02 -2.12,-8.76 -0.3,-1.08 -0.64,-1.38 -1.48,-1.23 -0.98,0.15 -1.28,0.98 -3.1,8.36 -1.13,4.48 -2.21,8.41 -2.36,8.71 -0.2,0.3 -1.62,0.54 -3.2,0.54 h -2.9 l -1.08,-4.28 z',
  },
  {
    delay: 1.15,
    d: 'm 339.98,230.8 v -14.81 h 2.71 2.71 v 4.87 4.82 l 2.31,-1.13 c 4.03,-2.07 8.27,-1.13 10.09,2.31 0.74,1.43 0.89,2.85 0.89,10.18 v 8.51 l -2.56,-0.15 -2.61,-0.15 -0.15,-7.63 c -0.1,-6.15 -0.3,-7.72 -0.93,-8.46 -1.08,-1.18 -4.13,-1.18 -5.61,0.05 -1.13,0.89 -1.18,1.28 -1.43,8.51 l -0.25,7.53 -2.56,0.15 -2.61,0.15 v -14.76 z',
  },
  {
    delay: 1.22,
    d: 'm 370.73,245.56 c -4.03,-0.69 -6.74,-3.44 -7.63,-7.72 -1.77,-8.41 3.44,-15.2 10.92,-14.32 4.72,0.59 7.53,4.13 7.87,9.94 l 0.15,2.95 -6.64,0.25 c -5.81,0.2 -6.64,0.34 -6.79,1.13 -0.1,0.44 0.49,1.53 1.28,2.31 1.92,1.87 4.08,1.97 5.71,0.25 0.93,-0.98 1.62,-1.23 3.69,-1.23 2.9,0 3.1,0.44 1.38,3 -2.31,3.49 -4.77,4.33 -9.94,3.44 z m 5.9,-14.17 c -0.84,-3.49 -4.53,-4.77 -6.89,-2.36 -0.69,0.64 -1.23,1.77 -1.23,2.46 0,1.23 0.05,1.23 4.23,1.23 h 4.23 z',
  },
  {
    delay: 1.29,
    d: 'm 393.36,245.56 c -3,-0.49 -5.26,-2.07 -6.64,-4.53 -1.03,-1.82 -1.23,-2.8 -1.23,-6.35 0,-3.69 0.15,-4.48 1.33,-6.49 1.67,-2.8 3.99,-4.28 7.23,-4.67 6.1,-0.69 10.38,3.49 10.38,10.23 v 2.36 l -6.74,0.15 -6.79,0.15 0.15,1.23 c 0.15,1.62 1.97,3.35 3.84,3.74 1.18,0.2 1.82,0 3,-0.98 1.18,-1.03 2.07,-1.28 4.03,-1.28 1.38,0 2.51,0.15 2.51,0.3 0,1.08 -2.41,4.18 -4.08,5.26 -2.07,1.33 -3.25,1.48 -6.99,0.89 z m 5.9,-13.92 c -0.89,-3 -2.8,-4.28 -5.41,-3.64 -1.23,0.3 -2.36,1.67 -2.95,3.64 -0.3,1.08 -0.25,1.08 4.18,1.08 4.43,0 4.48,0 4.18,-1.08 z',
  },
  {
    delay: 1.36,
    d: 'm 409.48281,230.67215 v -14.76 h 2.71 2.71 v 14.76 14.76 h -2.71 -2.71 z',
  },
  {
    delay: 1.43,
    d: 'm 425.49,245.51 c -1.28,-0.2 -3,-0.89 -3.84,-1.48 -1.38,-0.98 -2.95,-3.3 -2.95,-4.38 0,-0.74 5.07,-1.28 5.31,-0.54 0.84,2.46 5.46,3.44 7.23,1.48 0.44,-0.49 0.74,-1.28 0.59,-1.62 -0.15,-0.39 -2.31,-1.33 -4.82,-2.12 -2.9,-0.89 -5.17,-1.92 -6.2,-2.8 -1.43,-1.23 -1.62,-1.72 -1.62,-3.84 0,-4.28 3.35,-6.84 9,-6.84 3,0 5.22,0.93 6.89,2.95 1.87,2.21 1.57,3.15 -1.03,3.35 -1.77,0.15 -2.36,-0.05 -3.3,-1.08 -1.97,-2.12 -6.49,-1.38 -6.1,0.98 0.15,0.69 1.38,1.33 5.12,2.51 5.81,1.92 7.63,3.44 7.63,6.49 0,2.07 -1.43,4.53 -3.54,6.1 -1.53,1.13 -4.92,1.48 -8.36,0.84 z',
  },
  {
    delay: 1.5,
    d: 'm 377.07,198.92 c 0.15,-0.49 0.39,-1.97 0.54,-3.35 0.64,-4.97 0.69,-5.17 2.16,-5.17 1.33,0 1.38,0.1 1.67,3.1 0.15,1.67 0.44,3.79 0.64,4.67 l 0.34,1.57 h -2.8 c -2.46,0 -2.8,-0.1 -2.56,-0.84 z',
  },
  {
    delay: 1.54,
    d: 'm 378.11,182.44 c 0.15,-0.64 0.44,-2.02 0.64,-3.05 0.2,-1.08 0.64,-2.02 0.93,-2.12 0.54,-0.2 0.74,0.44 1.43,4.43 l 0.3,1.82 h -1.77 c -1.62,0 -1.77,-0.1 -1.53,-1.08 z',
  },
];

function EmblemPath({ d, fill, delay, isExiting }: EmblemPathConfig & { isExiting: boolean }) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const skewX = useSharedValue(0);

  useEffect(() => {
    if (isExiting) {
      // Misma escala de stagger de salida que varianteTrazo (customDelay * 0.12).
      const exitDelay = delay * 120;
      translateX.value = withDelay(exitDelay, withTiming(550, { duration: 500, easing: EXIT_EASING }));
      skewX.value = withDelay(exitDelay, withTiming(-20, { duration: 500, easing: EXIT_EASING }));
      opacity.value = withDelay(exitDelay + 100, withTiming(0, { duration: 350 }));
    } else {
      opacity.value = withDelay(delay * 1000, withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }));
    }
  }, [isExiting]);

  const animatedProps = useAnimatedProps(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { skewX: `${skewX.value}deg` }] as any,
  }));

  return <AnimatedPath d={d} fill={fill} animatedProps={animatedProps} />;
}

function LetterPath({ d, delay, isExiting }: LetterPathConfig & { isExiting: boolean }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  const scale = useSharedValue(0.85);
  const translateX = useSharedValue(0);
  const skewX = useSharedValue(0);

  useEffect(() => {
    if (isExiting) {
      // Misma escala de stagger de salida que varianteLetra (customDelay * 0.1).
      const exitDelay = delay * 100;
      translateX.value = withDelay(exitDelay, withTiming(600, { duration: 450, easing: EXIT_EASING }));
      skewX.value = withDelay(exitDelay, withTiming(-25, { duration: 450, easing: EXIT_EASING }));
      scale.value = withDelay(exitDelay, withTiming(0.9, { duration: 450, easing: EXIT_EASING }));
      opacity.value = withDelay(exitDelay + 100, withTiming(0, { duration: 300 }));
    } else {
      const enterDelay = delay * 1000;
      translateY.value = withDelay(enterDelay, withSpring(0, { damping: 14, stiffness: 160 }));
      scale.value = withDelay(enterDelay, withSpring(1, { damping: 14, stiffness: 160 }));
      opacity.value = withDelay(enterDelay, withTiming(1, { duration: 350 }));
    }
  }, [isExiting]);

  const animatedProps = useAnimatedProps(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
      { skewX: `${skewX.value}deg` },
    ] as any,
  }));

  return <AnimatedPath d={d} fill="#ffffff" animatedProps={animatedProps} />;
}

export function AnimatedUniWheelsLogo({
  width = '100%',
  height = '100%',
  isExiting = false,
}: {
  width?: number | string;
  height?: number | string;
  isExiting?: boolean;
}) {
  return (
    <Svg viewBox="0 0 677 378" width={width} height={height}>
      {EMBLEM_PATHS.map((p, i) => (
        <EmblemPath key={i} {...p} isExiting={isExiting} />
      ))}
      <G transform="translate(-1.3095708,-0.23110074)">
        {LETTER_PATHS.map((p, i) => (
          <LetterPath key={i} {...p} isExiting={isExiting} />
        ))}
      </G>
    </Svg>
  );
}
