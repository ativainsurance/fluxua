import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { getMonthName, navigateMonth } from '../utils/dateUtils';

interface Props {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export const MonthSelector = ({ month, year, onChange }: Props) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const goBack = () => {
    const { month: m, year: y } = navigateMonth(month, year, 'prev');
    onChange(m, y);
  };

  const goForward = () => {
    const { month: m, year: y } = navigateMonth(month, year, 'next');
    onChange(m, y);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={goBack} style={styles.arrow} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Text style={styles.label}>
        {getMonthName(month)} {year}
      </Text>

      <TouchableOpacity onPress={goForward} style={styles.arrow} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center' },
  label: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    minWidth: 150,
    textAlign: 'center' } });
