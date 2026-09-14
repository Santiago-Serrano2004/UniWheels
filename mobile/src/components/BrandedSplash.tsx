import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { AnimatedUniWheelsLogo } from './AnimatedUniWheelsLogo';

const EXIT_EASING = Easing.bezier(0.7, 0, 0.84, 0);

/**
 * Réplica 1:1 de frontend/src/components/common/SplashScreen.jsx: mismo
 * degradado, mismo resplandor pulsante que se convierte en una estela hacia
 * la derecha al salir, mismo logo animado trazo por trazo (AnimatedUniWheelsLogo,
 * equivalente a AnimatedLogo.jsx no-estático) y misma línea de tiempo —
 * durationMs=3600 con el disparo de salida 600ms antes del final, igual que
 * App.jsx invoca <SplashScreen durationMs={3600} />.
 */
export function BrandedSplash({ onFinish, durationMs = 3600 }: { onFinish: () => void; durationMs?: number }) {
  const [isExiting, setIsExiting] = useState(false);

  // Entrada del contenedor del logo (scale 0.85→1, opacity 0→1, 700ms).
  const containerOpacity = useSharedValue(0);
  const containerScale = useSharedValue(0.85);
  // Salida del contenedor completo (opacity→0, translateX→100, 450ms).
  const containerExitOpacity = useSharedValue(1);
  const containerExitTranslateX = useSharedValue(0);

  // Resplandor: pulso infinito en reposo, estela acelerada hacia la derecha al salir.
  const glowPulseScale = useSharedValue(1);
  const glowPulseOpacity = useSharedValue(0.2);
  const glowExitTranslateX = useSharedValue(0);
  const glowExitScaleX = useSharedValue(1);
  const glowExitOpacity = useSharedValue(1);

  useEffect(() => {
    containerOpacity.value = withTiming(1, { duration: 700, easing: Easing.bezier(0.16, 1, 0.3, 1) });
    containerScale.value = withTiming(1, { duration: 700, easing: Easing.bezier(0.16, 1, 0.3, 1) });

    glowPulseScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
    glowPulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );

    // Misma línea de tiempo que SplashScreen.jsx: la salida se activa 600ms
    // antes del final (una vez el logo ya se dibujó y se apreció), y onFinish
    // se dispara al llegar a durationMs.
    const exitTimer = setTimeout(() => setIsExiting(true), durationMs - 600);
    const finishTimer = setTimeout(onFinish, durationMs);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [durationMs, onFinish]);

  useEffect(() => {
    if (!isExiting) return;

    containerExitTranslateX.value = withTiming(100, { duration: 450, easing: EXIT_EASING });
    containerExitOpacity.value = withTiming(0, { duration: 450, easing: EXIT_EASING });

    // El pulso infinito se detiene para que la estela tome el control del blob.
    cancelAnimation(glowPulseScale);
    cancelAnimation(glowPulseOpacity);
    glowExitTranslateX.value = withTiming(380, { duration: 500, easing: EXIT_EASING });
    glowExitScaleX.value = withTiming(2.2, { duration: 500, easing: EXIT_EASING });
    glowExitOpacity.value = withTiming(0, { duration: 500, easing: EXIT_EASING });
  }, [isExiting]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value * containerExitOpacity.value,
    transform: [{ scale: containerScale.value }, { translateX: containerExitTranslateX.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulseOpacity.value * glowExitOpacity.value,
    transform: [
      { translateX: glowExitTranslateX.value },
      { scaleX: glowPulseScale.value * glowExitScaleX.value },
      { scaleY: glowPulseScale.value },
    ],
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={['#020617', '#082f49', '#020617']} style={StyleSheet.absoluteFill} />

      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 288,
            height: 288,
            marginLeft: -144,
            marginTop: -144,
            borderRadius: 144,
            backgroundColor: '#0ea5e9',
          },
          glowStyle,
        ]}
      />

      <Animated.View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }, containerStyle]}>
        <View style={{ width: '100%', maxWidth: 280, aspectRatio: 677 / 378 }}>
          <AnimatedUniWheelsLogo width="100%" height="100%" isExiting={isExiting} />
        </View>
      </Animated.View>
    </View>
  );
}
