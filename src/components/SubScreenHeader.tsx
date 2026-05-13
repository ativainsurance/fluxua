import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius } from '../theme';
import { useTheme } from '../contexts/ThemeContext';

interface SubScreenHeaderProps {
  title: string;
  onBack: () => void;
  rightElement?: React.ReactNode;
}

export const SubScreenHeader = ({ title, onBack, rightElement }: SubScreenHeaderProps) => {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md, gap: spacing.sm }}>
      <TouchableOpacity
        onPress={onBack}
        style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.65}
      >
        <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={{ flex: 1, fontSize: typography.md, fontWeight: typography.bold, color: colors.textPrimary, letterSpacing: -0.3, textAlign: 'center' }} numberOfLines={1}>{title}</Text>
      <View style={{ width: 36, height: 36, flexShrink: 0 }}>
        {rightElement}
      </View>
    </View>
  );
};
