import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { typography, spacing, radius, shadows } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { ExpenseWithRecord } from '../types';
import { getWeeklyBreakdown,
  useFormatCurrency,
  useFormatDate,
  getCurrentWeekIndex,
  getBillStatus } from '../utils/dateUtils';
import { useEnergyState } from '../utils/energyState';
import { FlowBar } from './ui/FlowBar';

interface Props {
  expense: ExpenseWithRecord;
  month: number;
  year: number;
}

export const WeeklyBreakdown = ({ expense, month, year }: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const { ordinalDay } = useFormatDate();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const energyState = useEnergyState();
  const weeks = getWeeklyBreakdown(expense.amount, month, year);
  const maxAmount = Math.max(...weeks.map((w) => w.amount));
  const currentWeekIdx = getCurrentWeekIndex(month, year);
  const isPaid = expense.record?.is_paid ?? false;
  const billStatus = getBillStatus(expense.due_day, isPaid);
  const currentWeekConfig = energyState({ status: isPaid ? 'paid' : billStatus });
  const upcomingConfig = energyState({ status: 'upcoming' });

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{expense.name}</Text>
          {isPaid && (
            <View style={styles.completedChip}>
              <Ionicons name="checkmark" size={10} color={colors.success} />
              <Text style={styles.completedChipText}>{t('status.completed')}</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>{t('flow.weeklyFlowAllocation')}</Text>
      </View>

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>{t('flow.totalFlow')}</Text>
        <Text style={styles.totalAmount}>{formatCurrency(expense.amount)}</Text>
      </View>

      {/* Flow bars — energy state coloring */}
      <View style={styles.bars}>
        {weeks.map((week, i) => {
          const pct = maxAmount > 0 ? week.amount / maxAmount : 0;
          const isCurrent = i === currentWeekIdx;
          const barConfig = isCurrent ? currentWeekConfig : upcomingConfig;

          return (
            <View key={week.week} style={styles.weekRow}>
              <Text style={[styles.weekLabel, isCurrent && styles.weekLabelActive]}>
                W{week.week}
              </Text>
              <View style={styles.barTrackWrapper}>
                <FlowBar ratio={pct} state={barConfig.state} height={10} />
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
            ? `${t('status.completed')} — ${formatCurrency(expense.record?.actual_amount ?? expense.amount)} ${t('overview.settled').toLowerCase()}`
            : t('flow.fullAmountDue', { amount: formatCurrency(expense.amount), day: ordinalDay(expense.due_day) })
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
  barTrackWrapper: {
    flex: 1 },
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
