import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, radius, typography } from '../theme';

// Curated set of finance + lifestyle emoji, grouped thematically.
export const FINANCE_EMOJI = [
  // Housing & utilities
  '🏠', '🏡', '🏢', '💡', '💧', '🔌', '🔥', '🌡️',
  // Transport
  '🚗', '🚕', '🛵', '🚌', '🚂', '✈️', '⛽', '🅿️',
  // Food & dining
  '🍔', '🍕', '☕', '🛒', '🍷', '🍜', '🥗', '🥡',
  // Health & fitness
  '💊', '🏥', '🦷', '🏋️', '🧘', '🩺', '🩹', '💉',
  // Tech & entertainment
  '📱', '💻', '📺', '🎮', '🎵', '🎬', '🎭', '📡',
  // Education
  '📚', '🎓', '✏️', '🖊️', '📝', '🔬', '🏫', '📐',
  // Finance & money
  '💳', '💰', '💸', '🏧', '🧾', '📊', '📈', '🪙',
  // Insurance & protection
  '🛡️', '☂️', '🔐', '🔒', '📋', '🗂️', '📦', '📫',
  // Business
  '💼', '📞', '🖨️', '🗃️', '🏗️', '🔧', '🛠️', '📌',
  // Lifestyle & personal
  '🐶', '🐱', '👶', '🧴', '🧹', '🎁', '🏖️', '🌿',
  // Subscriptions & recurring
  '🔄', '📰', '🎯', '⚽', '🏊', '🧗', '🎨', '🌐',
];

interface Props {
  selected: string;
  onSelect: (emoji: string) => void;
  /** When true, render a compact 5-column grid (for category picker) */
  compact?: boolean;
}

export const EmojiPicker = ({ selected, onSelect, compact = false }: Props) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors, compact);
  const cellSize = compact ? 36 : 44;
  const fontSize = compact ? 18 : 22;

  return (
    <ScrollView
      horizontal={false}
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
      nestedScrollEnabled
    >
      <View style={styles.grid}>
        {FINANCE_EMOJI.map((emoji) => {
          const isSelected = selected === emoji;
          return (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.cell,
                { width: cellSize, height: cellSize },
                isSelected && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
              ]}
              onPress={() => onSelect(emoji)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize }}>{emoji}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

const makeStyles = (colors: any, compact: boolean) =>
  StyleSheet.create({
    scroll: {
      maxHeight: compact ? 160 : 220,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: compact ? spacing.xs : spacing.sm,
      paddingVertical: spacing.xs,
    },
    cell: {
      borderRadius: radius.sm,
      borderWidth: 1.5,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
  });
