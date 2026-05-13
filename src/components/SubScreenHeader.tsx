import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../theme';

interface SubScreenHeaderProps {
  title: string;
  onBack: () => void;
  rightElement?: React.ReactNode;
}

export const SubScreenHeader = ({ title, onBack, rightElement }: SubScreenHeaderProps) => (
  <View style={s.header}>
    <TouchableOpacity
      onPress={onBack}
      style={s.backBtn}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      activeOpacity={0.65}
    >
      <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
    </TouchableOpacity>

    <Text style={s.title} numberOfLines={1}>{title}</Text>

    <View style={s.rightSlot}>
      {rightElement ?? <View style={s.backBtn} />}
    </View>
  </View>
);

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  title: {
    flex: 1,
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  rightSlot: {
    width: 36,
    height: 36,
    flexShrink: 0,
  },
});
