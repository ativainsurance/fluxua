import React from 'react';
import { Text, TextProps, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

// ─────────────────────────────────────────────────────────────────────────────
// GlowText — wraps Text with a soft outer glow tied to the flowEnd accent.
//
// intensity tiers:
//   'subtle' — visible glow for 48px hero numbers (primary target)
//   'soft'   — ~40% of subtle's shadow strength for 24–30px secondary numbers
//   'none'   — clean no-op pass-through (same as plain Text)
//
// On native: textShadow* props (iOS renders these well; Android has limited
// text shadow support but it degrades gracefully — the text stays legible).
// On web: filter: drop-shadow via style (works on Vercel / Expo web).
// ─────────────────────────────────────────────────────────────────────────────

export type GlowIntensity = 'subtle' | 'soft' | 'none';

interface GlowTextProps extends TextProps {
  intensity?: GlowIntensity;
  /** Override glow color — defaults to colors.flowEnd (teal) */
  glowColor?: string;
}

// Shadow specs per intensity tier
const SHADOW_SPECS = {
  subtle: { opacity: 0.50, radius: 12 },
  soft:   { opacity: 0.20, radius: 6  },
  none:   { opacity: 0,    radius: 0  },
};

export const GlowText = ({
  intensity = 'subtle',
  glowColor,
  style,
  children,
  ...rest
}: GlowTextProps) => {
  const { colors } = useTheme();
  const baseColor = glowColor ?? colors.flowEnd;
  const { opacity, radius } = SHADOW_SPECS[intensity];

  const glowStyle =
    intensity === 'none'
      ? {}
      : Platform.select({
          // Native shadow (iOS renders well; Android degrades gracefully)
          default: {
            textShadowColor: `rgba(${hexToRgb(baseColor)},${opacity})`,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: radius,
          },
          // Web: CSS drop-shadow via filter
          web: {
            filter: `drop-shadow(0 0 ${radius}px rgba(${hexToRgb(baseColor)},${opacity}))`,
          } as any,
        });

  return (
    <Text style={[glowStyle, style]} {...rest}>
      {children}
    </Text>
  );
};

// ── Hex to RGB helper ─────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `${r},${g},${b}`;
}
