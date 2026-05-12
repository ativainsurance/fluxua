import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradient, typography, spacing, radius } from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const GradientButton = ({ title, onPress, loading, disabled, style }: Props) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={loading || disabled}
    activeOpacity={0.85}
    style={[styles.wrapper, (loading || disabled) && styles.wrapperDisabled, style]}
  >
    <LinearGradient
      colors={gradient.brand}
      start={gradient.brandStart}
      end={gradient.brandEnd}
      style={styles.gradient}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.label}>{title}</Text>
      )}
    </LinearGradient>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.md,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  wrapperDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  gradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#fff',
    fontSize: typography.base,
    fontWeight: typography.semibold,
    letterSpacing: 0.2,
  },
});
