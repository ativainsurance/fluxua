import React from 'react';
import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { typography, fonts } from '../../theme';

type Variant = 'hero' | 'h1' | 'h2' | 'h3' | 'body' | 'label' | 'caption' | 'mono';

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  style?: TextStyle | TextStyle[];
}

const VARIANT_STYLES: Record<Variant, TextStyle> = {
  hero: {
    fontFamily: fonts.display + '-Bold',
    fontSize: 42,
    letterSpacing: -1.5,
    lineHeight: 46,
  },
  h1: {
    fontFamily: fonts.display + '-SemiBold',
    fontSize: typography.xxl,
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  h2: {
    fontFamily: fonts.display + '-Medium',
    fontSize: typography.xl,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  h3: {
    fontFamily: fonts.body + '-SemiBold',
    fontSize: typography.lg,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  body: {
    fontFamily: fonts.body + '-Regular',
    fontSize: typography.base,
    lineHeight: 22,
  },
  label: {
    fontFamily: fonts.body + '-Medium',
    fontSize: typography.sm,
    lineHeight: 18,
  },
  caption: {
    fontFamily: fonts.body + '-Regular',
    fontSize: typography.xs,
    lineHeight: 16,
  },
  mono: {
    fontFamily: fonts.mono + '-Regular',
    fontSize: typography.base,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
};

export const Text = ({ variant = 'body', color, style, ...rest }: Props) => {
  const { colors } = useTheme();

  const defaultColor =
    variant === 'hero' || variant === 'h1' || variant === 'h2' || variant === 'h3'
      ? colors.textPrimary
      : variant === 'label' || variant === 'caption'
      ? colors.textSecondary
      : colors.textPrimary;

  return (
    <RNText
      style={[VARIANT_STYLES[variant], { color: color ?? defaultColor }, style]}
      {...rest}
    />
  );
};
