import React, { useMemo } from 'react';
import { View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius, shadows } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { ExpenseWithRecord,
  getCategoryIcon } from '../types';
import { useCategoryLabel } from '../utils/categories';
import { useFormatCurrency,
  useFormatDate,
  getBillStatus } from '../utils/dateUtils';
import { useEnergyState } from '../utils/energyState';
import { useTranslation } from 'react-i18next';


interface Props {
  expense: ExpenseWithRecord;
  onTogglePaid: (expense: ExpenseWithRecord, isPaid: boolean) => void;
  onEdit?: (expense: ExpenseWithRecord) => void;
  onDelete?: (expense: ExpenseWithRecord) => void;
  onExcludeFromMonth?: (expense: ExpenseWithRecord) => void;
  onWaive?: (expense: ExpenseWithRecord) => void;
  weeklyAllocation?: number;
}



export const ExpenseCard = ({
  expense,
  onTogglePaid,
  onEdit,
  onDelete,
  onExcludeFromMonth,
  onWaive,
  weeklyAllocation }: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const energyState = useEnergyState();
  const formatCurrency = useFormatCurrency();
  const { monthYear, ordinalDay } = useFormatDate();
  const getCategoryLabel = useCategoryLabel();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const isPaid = expense.record?.is_paid ?? false;
  const isWaived = expense.record?.is_waived ?? false;
  const isResolved = isPaid || isWaived;
  const status = isWaived ? 'waived' : getBillStatus(expense.due_day, isPaid);
  const statusConfig = energyState({ status });
  const categoryIcon = getCategoryIcon(expense.category);
  const categoryLabel = getCategoryLabel(expense.category);

  const plannedAmount = expense.is_variable_amount
    ? (expense.record?.statement_balance ?? expense.amount)
    : expense.amount;
  const actualAmount = expense.record?.actual_amount;
  const lateFee = expense.record?.late_fee;
  const creditAmount = expense.record?.credit_amount;
  const needsBalance = expense.is_variable_amount && !expense.record?.statement_balance && !isResolved;
  const hasActualDiff = isPaid && actualAmount !== undefined && actualAmount !== plannedAmount;
  const hasLateFee = isPaid && lateFee !== undefined && lateFee > 0;
  const hasCredit = isResolved && creditAmount !== undefined && creditAmount > 0;

  // Amount color — flows through energy state
  const amountColor =
    isResolved || status === 'overdue' || status === 'due-soon'
      ? statusConfig.color
      : colors.textPrimary;

  const handleLongPress = () => {
    Alert.alert(expense.name, t('commitments.whatToDo'), [
      { text: t('common.edit'), onPress: () => onEdit?.(expense) },
      {
        text: t('commitments.markAsWaived'),
        onPress: () =>
          Alert.alert(
            t('commitments.markAsWaived'),
            t('commitments.waiveConfirm', { name: expense.name }),
            [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('commitments.markAsWaived'), onPress: () => onWaive?.(expense) },
            ]
          ) },
      {
        text: t('commitments.removeFromMonth'),
        onPress: () =>
          Alert.alert(
            t('commitments.removeFromMonthTitle'),
            t('commitments.removeFromMonthConfirm', { name: expense.name }),
            [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('common.remove'),
                style: 'destructive',
                onPress: () => onExcludeFromMonth?.(expense) },
            ]
          ) },
      {
        text: t('commitments.deletePermanently'),
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            t('commitments.deleteTitle'),
            t('commitments.deleteConfirm', { name: expense.name }),
            [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('common.delete'), style: 'destructive', onPress: () => onDelete?.(expense) },
            ]
          ) },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        // Very subtle status tint on entire card for overdue
        status === 'overdue' && { backgroundColor: statusConfig.bg },
        isResolved && { opacity: 0.88 },
      ]}
      onLongPress={handleLongPress}
      activeOpacity={0.82}
    >
      {/* Left accent strip — 5px, full height */}
      <View style={[styles.accentStrip, { backgroundColor: statusConfig.color }]} />

      {/* Category icon */}
      <View style={[styles.iconWrapper, { backgroundColor: statusConfig.bg }]}>
        <Ionicons name={categoryIcon as any} size={20} color={statusConfig.color} />
      </View>

      {/* Info column */}
      <View style={styles.info}>
        {/* Name row */}
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{expense.name}</Text>
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: expense.type === 'personal'
                  ? colors.personal + '50'
                  : colors.business + '50' },
            ]}
          >
            <Text
              style={[
                styles.typeText,
                {
                  color: expense.type === 'personal'
                    ? colors.personal
                    : colors.business },
              ]}
            >
              {expense.type === 'personal' ? t('commitments.personal') : t('commitments.business')}
            </Text>
          </View>
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <Text style={styles.category}>{categoryLabel}</Text>
          <View style={styles.metaDot} />
          <Text style={styles.dueDay}>{t('commitments.dueOnDay', { day: ordinalDay(expense.due_day) })}</Text>
          {expense.is_recurring && (
            <>
              <View style={styles.metaDot} />
              <Ionicons name="repeat" size={11} color={colors.textTertiary} />
            </>
          )}
        </View>

        {/* Date range */}
        {(expense.start_date || expense.end_date) && (
          <View style={styles.dateRangeRow}>
            <Ionicons name="calendar-outline" size={10} color={colors.textDisabled} />
            <Text style={styles.dateRangeText}>
              {expense.start_date ? monthYear(new Date(expense.start_date.replace(/-/g, '/'))) : ''}
              {expense.end_date ? ` → ${monthYear(new Date(expense.end_date.replace(/-/g, '/')))}` : ''}
            </Text>
          </View>
        )}

        {/* Weekly allocation */}
        {weeklyAllocation !== undefined && !isResolved && (
          <Text style={styles.weeklyAlloc}>
            {t('commitments.thisWeek')}{' '}
            <Text style={styles.weeklyAllocAmt}>{formatCurrency(weeklyAllocation)}</Text>
          </Text>
        )}

        {/* Badges row */}
        <View style={styles.badgesRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Ionicons
              name={statusConfig.icon as any}
              size={10}
              color={statusConfig.color}
            />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {t(statusConfig.labelKey!)}
            </Text>
          </View>
          {needsBalance && (
            <View style={[styles.statusBadge, { backgroundColor: colors.warningLight ?? colors.warning + '18' }]}>
              <Ionicons name="alert-circle-outline" size={10} color={colors.warning} />
              <Text style={[styles.statusText, { color: colors.warning }]}>
                {t('commitments.needsBalance')}
              </Text>
            </View>
          )}
          {expense.is_autopay && (
            <View style={styles.autopayBadge}>
              <Ionicons name="flash" size={9} color={colors.primary} />
              <Text style={styles.autopayText}>
                {expense.autopay_method?.toUpperCase() ?? 'AUTO'}
                {expense.autopay_last4 ? ` ···· ${expense.autopay_last4}` : ''}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Right panel — amount + actions */}
      <View style={styles.right}>
        {hasActualDiff ? (
          <View style={styles.amountStack}>
            <Text style={[styles.amount, { color: amountColor }]}>
              {formatCurrency(actualAmount!)}
            </Text>
            <Text style={styles.plannedAmount}>{formatCurrency(plannedAmount)}</Text>
          </View>
        ) : (
          <Text style={[styles.amount, { color: amountColor }]}>
            {formatCurrency(plannedAmount)}
          </Text>
        )}
        {hasCredit && (
          <Text style={styles.creditAmt}>-{formatCurrency(creditAmount!)} {t('commitments.creditLabel')}</Text>
        )}
        {hasLateFee && (
          <Text style={styles.lateFee}>+{formatCurrency(lateFee!)} {t('commitments.feeLabel')}</Text>
        )}

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => onEdit?.(expense)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="pencil-outline" size={12} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.checkBtn,
            isResolved ? styles.checkBtnPaid : styles.checkBtnUnpaid,
            isWaived && styles.checkBtnWaived,
          ]}
          onPress={() => onTogglePaid(expense, !isResolved)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isWaived ? 'gift-outline' : 'checkmark'}
            size={13}
            color={isResolved ? colors.textInverse : colors.textDisabled}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const makeStyles = (colors: any) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
    gap: spacing.md,
    overflow: 'hidden' },
  accentStrip: {
    width: 5,
    alignSelf: 'stretch',
    borderRadius: 0 },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0 },
  info: {
    flex: 1,
    gap: 4 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs },
  name: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    flex: 1 },
  typeBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2 },
  typeText: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    letterSpacing: 0.1 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4 },
  category: {
    fontSize: typography.xs,
    color: colors.textSecondary },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textDisabled },
  dueDay: {
    fontSize: typography.xs,
    color: colors.textSecondary },
  dateRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3 },
  dateRangeText: {
    fontSize: typography.xs,
    color: colors.textDisabled },
  weeklyAlloc: {
    fontSize: typography.xs,
    color: colors.textSecondary },
  weeklyAllocAmt: {
    fontWeight: typography.semibold,
    color: colors.primary },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2 },
  statusText: {
    fontSize: typography.xs,
    fontWeight: typography.medium,
    letterSpacing: 0.1 },
  autopayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: colors.primaryLight },
  autopayText: {
    fontSize: typography.xs,
    fontWeight: typography.medium,
    color: colors.primary },
  right: {
    alignItems: 'flex-end',
    gap: spacing.sm,
    flexShrink: 0,
    paddingRight: spacing.xs },
  amount: {
    fontSize: typography.xl,     // 24px — dominant financial number
    fontWeight: typography.bold,
    letterSpacing: -0.5 },
  amountStack: {
    alignItems: 'flex-end',
    gap: 2 },
  plannedAmount: {
    fontSize: typography.xs,
    color: colors.textDisabled,
    textDecorationLine: 'line-through' },
  creditAmt: {
    fontSize: typography.xs,
    color: colors.accentMuted,
    fontWeight: typography.medium },
  lateFee: {
    fontSize: typography.xs,
    color: colors.warning,
    fontWeight: typography.medium },
  editBtn: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center' },
  checkBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2 },
  checkBtnPaid: {
    backgroundColor: colors.success,
    borderColor: colors.success },
  checkBtnWaived: {
    backgroundColor: colors.charged,
    borderColor: colors.charged },
  checkBtnUnpaid: {
    backgroundColor: 'transparent',
    borderColor: colors.border } });
  