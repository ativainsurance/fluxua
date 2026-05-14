import React from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { radius, shadows, spacing } from '../../theme';

type CardVariant = 'default' | 'raised' | 'hero';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number | false;
}

const VARIANT_SHADOW: Record<CardVariant, object> = {
  default: shadows.card,
  raised: shadows.md,
  hero: shadows.hero,
};

export const Card = ({
  children,
  variant = 'default',
  onPress,
  style,
  padding,
}: CardProps) => {
  const { colors } = useTheme();

  const bg = variant === 'hero' ? colors.navy : colors.surface;
  const pad = padding === false ? undefined : { padding: padding ?? spacing.base };

  const cardStyle: ViewStyle = {
    backgroundColor: bg,
    borderRadius: variant === 'hero' ? radius.xxl : radius.xl,
    overflow: 'hidden',
    ...VARIANT_SHADOW[variant],
    ...pad,
  };

  if (onPress) {
    return (
      <TouchableOpacity style={[cardStyle, style]} onPress={onPress} activeOpacity={0.82}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
};
