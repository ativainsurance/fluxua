import React from 'react';
import { ScrollView, View, ViewStyle, ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme';

interface ScreenProps extends Omit<ScrollViewProps, 'style' | 'contentContainerStyle'> {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export const Screen = ({
  children,
  scroll = true,
  padded = true,
  style,
  contentStyle,
  ...rest
}: ScreenProps) => {
  const { colors } = useTheme();
  const bg = { backgroundColor: colors.background };
  const pad = padded ? { paddingHorizontal: spacing.base } : undefined;

  if (!scroll) {
    return (
      <SafeAreaView style={[{ flex: 1 }, bg, style]}>
        <View style={[{ flex: 1 }, pad, contentStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[{ flex: 1 }, bg, style]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[pad, { paddingBottom: spacing.xxxl }, contentStyle]}
        {...rest}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};
