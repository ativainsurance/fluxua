import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius, shadows } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { ExpenseWithRecord } from '../types';
import { getWeeklyBreakdown,
  formatCurrency,
  getShortMonthName,
  getDayOrdinal,
  getCurrentWeekIndex,
  getBillStatus } from '../utils/dateUtils';

interface Props {
  expense: ExpenseWithRecord;
  month: number;
  year: number;
}

const getPressureBarColor = (
  expense: ExpenseWithRecord,
  weekIndex: number,
  currentWeekIdx: number,
  colors: any
): string => {
  const isPaid = expense.record?.is_paid ?? false;
  if (isPaid) return colors.success;

  const status = getBillStatus(expense.due_day, isPaid);
  if (status === 'overdue' && weekIndex <= currentWeekIdx) return colors.danger;
  if (status === 'due-soon' && weekIndex === currentWeekIdx) return colors.warning;
  if (expense.type === 'personal') return colors.personal;
  return colors.business;
};

export const WeeklyBreakdown = ({ expense, month, year }: Props) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const weeks = getWeeklyBreakdown(expense.amount, month, year, getShortMonthName(month));
  const maxAmount = Math.max(...weeks.map((w) => w.amount));
  const currentWeekIdx = getCurrentWeekIndex(month, year);
  const isPaid = expense.record?.is_paid ?? false;

  const barAnims = useRef(weeks.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = weeks.map((week, i) => {
      const pct = maxAmount > 0 ? week.amount / maxAmount : 0;
      return Animated.timing(barAnims[i], {
        toValue: pct,
        duration: 550,
        delay: i * 100,
        useNativeDriver: false });
    });
    Animated.parallel(animations).start();
  }, [expense.id, expense.amount]);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{expense.name}</Text>
          {isPaid && (
            <View style={styles.completedChip}>
              <Ionicons name="checkmark" size={10} color={colors.success} />
              <Text style={styles.completedChipText}>Completed</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>Weekly flow allocation</Text>
      </View>

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Flow</Text>
        <Text style={styles.totalAmount}>{formatCurrency(expense.amount)}</Text>
      </View>

      {/* Animated bars with pressure coloring */}
      <View style={styles.bars}>
        {weeks.map((week, i) => {
          const pct = maxAmount > 0 ? week.amount / maxAmount : 0;
          const isCurrent = i === currentWeekIdx;
          const barColor = getPressureBarColor(expense, i, currentWeekIdx, colors);

          const barWidth = barAnims[i].interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
            extrapolate: 'clamp' });

          return (
            <View key={week.week} style={styles.weekRow}>
              <Text style={[styles.weekLabel, isCurrent && styles.weekLabelActive]}>
                W{week.week}
              </Text>
              <View style={styles.barTrack}>
                <Animated.View
                  style={[
                    styles.barFill,
                    {
                      width: barWidth,
                      backgroundColor: barColor,
                      opacity: isCurrent ? 1 : 0.6 },
                  ]}
                />
              </View>
              <Text style={[styles.weekAmount, isCurrent && styles.weekAmountActive]}>
                {formatCurrency(week.amount)}
              </Text>
              {isCurrent && !isPaid && (
                <View style={styles.nowDot} />
              )}
            </View>
          );
        })}
      </View>

      {/* Due date */}
      <View style={[styles.dueRow, isPaid && styles.dueRowPaid]}>
        <Ionicons
          name={isPaid ? 'checkmark-circle' : 'calendar-outline'}
          size={13}
          color={isPaid ? colors.success : colors.primary}
        />
        <Text style={[styles.dueText, isPaid && { color: colors.success }]}>
          {isPaid
            ? `Completed — ${formatCurrency(expense.record?.actual_amount ?? expense.amount)} paid`
            : `Full amount of ${formatCurrency(expense.amount)} due on the ${getDayOrdinal(expense.due_day)}`
          }
        </Text>
      </View>
    </View>
  );
};

const makeStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    ...shadows.sm,
    marginBottom: spacing.md },
  header: {
    marginBottom: spacing.sm },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm },
  title: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    flex: 1 },
  completedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.successLight,
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2 },
  completedChipText: {
    fontSize: typography.xs,
    color: colors.success,
    fontWeight: typography.semibold },
  subtitle: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: 2 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.divider,
    marginBottom: spacing.md },
  totalLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary },
  totalAmount: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.textPrimary },
  bars: {
    gap: spacing.sm },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm },
  weekLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    width: 24 },
  weekLabelActive: {
    color: colors.primary,
    fontWeight: typography.semibold },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    overflow: 'hidden' },
  barFill: {
    height: '100%',
    borderRadius: radius.full },
  weekAmount: {
    fontSize: typography.xs,
    fontWeight: typography.medium,
    color: colors.textSecondary,
    textAlign: 'right',
    width: 56 },
  weekAmountActive: {
    color: colors.textPrimary,
    fontWeight: typography.semibold },
  nowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.sm },
  dueRowPaid: {
    backgroundColor: colors.successLight },
  dueText: {
    fontSize: typography.xs,
    color: colors.primary,
    flex: 1 } });
