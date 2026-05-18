import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  useReducedMotion,
  cancelAnimation,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import type { EnergyLevel } from '../../utils/energyState';

interface FlowBarProps {
  /** 0–1 fill ratio */
  ratio: number;
  /** Energy state drives color + shimmer behavior */
  state: EnergyLevel;
  /** Bar height in px — defaults to 6 */
  height?: number;
  /** Override track (unfilled) color — defaults to colors.surfaceElevated */
  trackColor?: string;
}

// Shimmer duration by state — draining is slowed, others run at full pace
const SHIMMER_DURATION: Record<EnergyLevel, number> = {
  charged: 2500,
  flowing: 2500,
  thinning: 3000,
  draining: 0, // disabled
};

// Fill opacity by state — draining is dimmed
const FILL_OPACITY: Record<EnergyLevel, number> = {
  charged: 1,
  flowing: 0.95,
  thinning: 0.80,
  draining: 0.45,
};

export const FlowBar = ({ ratio, state, height = 6, trackColor }: FlowBarProps) => {
  const { colors, isDark } = useTheme();
  const reduceMotion = useReducedMotion();

  const shimmerX = useSharedValue(-1);

  const clampedRatio = Math.min(1, Math.max(0, ratio));
  const shimmerDuration = SHIMMER_DURATION[state];
  const shouldShimmer = shimmerDuration > 0 && !reduceMotion;

  useEffect(() => {
    if (shouldShimmer) {
      shimmerX.value = withRepeat(
        withTiming(1, {
          duration: shimmerDuration,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        false,
      );
    } else {
      cancelAnimation(shimmerX);
      shimmerX.value = -1;
    }
    return () => cancelAnimation(shimmerX);
  }, [shouldShimmer, shimmerDuration]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value * 80 }],
    opacity: shimmerX.value > 0 ? 0.35 : 0,
  }));

  const fillOpacity = FILL_OPACITY[state];

  // Gradient colors from theme energy tokens
  const gradientColors = isDark
    ? ([colors.flowStart, colors.flowEnd] as [string, string])
    : ([colors.flowStart, colors.flowEnd] as [string, string]);

  // Draining shifts toward the draining token color
  const drainColor = colors.draining;
  const effectiveColors: [string, string] =
    state === 'draining'
      ? [drainColor, drainColor]
      : state === 'thinning'
      ? [colors.thinning, colors.flowing]
      : gradientColors;

  return (
    <View
      style={[
        styles.track,
        { height, backgroundColor: trackColor ?? colors.surfaceElevated, borderRadius: height / 2 },
      ]}
    >
      {clampedRatio > 0 && (
        <View
          style={[
            styles.fillContainer,
            { width: `${clampedRatio * 100}%`, height, borderRadius: height / 2, overflow: 'hidden', opacity: fillOpacity },
          ]}
        >
          <LinearGradient
            colors={effectiveColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Shimmer sweep */}
          {shouldShimmer && (
            <Animated.View
              style={[
                styles.shimmer,
                shimmerStyle,
                { height },
              ]}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fillContainer: {
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: '-20%',
    width: '40%',
    backgroundColor: 'rgba(255,255,255,0.55)',
    // Blur-like softening via border radius on a narrow strip
    borderRadius: 3,
  },
});
