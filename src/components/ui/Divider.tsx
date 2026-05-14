import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme';

interface DividerProps {
  indent?: number;
  vertical?: boolean;
  style?: ViewStyle;
}

export const Divider = ({ indent = 0, vertical = false, style }: DividerProps) => {
  const { colors } = useTheme();

  if (vertical) {
    return (
      <View
        style={[{ width: 1, alignSelf: 'stretch', backgroundColor: colors.divider }, style]}
      />
    );
  }

  return (
    <View
      style={[
        {
          height: 1,
          backgroundColor: colors.divider,
          marginLeft: indent > 0 ? indent + spacing.base : 0,
        },
        style,
      ]}
    />
  );
};
