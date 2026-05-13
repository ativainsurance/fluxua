import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows } from '../theme';
import {
  ExpenseWithRecord,
  getCategoryLabel,
  getCategoryIcon,
} from '../types';
import {
  formatCurrency,
  formatDueDay,
  getBillStatus,
} from '../utils/dateUtils';

interface Props {
  expense: ExpenseWithRecord;
  onTogglePaid: (expense: ExpenseWithRecord, isPaid: boolean) => void;
  onEdit?: (expense: ExpenseWithRecord) => void;
  onDelete?: (expense: ExpenseWithRecord) => void;
  onExcludeFromMonth?: (expense: ExpenseWithRecord) => void;
  onWaive?: (expense: ExpenseWithRecord) => void;
  weeklyAllocation?: number;
}

// ── Status configuration — semantic, not decorative ──
const STATUS_CONFIG = {
  paid: {
    color: colors.success,
    bg: colors.successLight,
    label: 'Completed',
    icon: 'checkmark-circle',
  },
  waived: {
    color: '#8B5CF6',
    bg: '#EDE9FE',
    label: 'Waived',
    icon: 'gift-outline',
  },
  overdue: {
    color: colors.danger,
    bg: colors.dangerLight,
    label: 'Overdue',
    icon: 'alert-circle',
  },
  'due-soon': {
    color: colors.warning,
    bg: colors.warningLight,
    label: 'Due Soon',
    icon: 'time',
  },
  upcoming: {
    color: colors.textTertiary,
    bg: colors.surfaceAlt,
    label: 'Upcoming',
    icon: 'calendar-outline',
  },
} as const;

const formatShortDate = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export const ExpenseCard = ({
  expense,
  onTogglePaid,
  onEdit,
  onDelete,
  onExcludeFromMonth,
  onWaive,
  weeklyAllocation,
}: Props) => {
  const isPaid = expense.record?.is_paid ?? false;
  const isWaived = expense.record?.is_waived ?? false;
  const isResolved = isPaid || isWaived;
  const status = isWaived ? 'waived' : getBillStatus(expense.due_day, isPaid);
  const statusConfig = STATUS_CONFIG[status];
  const categoryIcon = getCategoryIcon(expense.category);
  const categoryLabel = getCategoryLabel(expense.category);

  const plannedAmount = expense.amount;
  const actualAmount = expense.record?.actual_amount;
  const lateFee = expense.record?.late_fee;
  const creditAmount = expense.record?.credit_amount;
  const hasActualDiff = isPaid && actualAmount !== undefined && actualAmount !== plannedAmount;
  const hasLateFee = isPaid && lateFee !== undefined && lateFee > 0;
  const hasCredit = isResolved && creditAmount !== undefined && creditAmount > 0;

  // Amount color — status-aware
  const amountColor =
    isResolved ? colors.success :
    status === 'overdue' ? colors.danger :
    status === 'due-soon' ? colors.warning :
    colors.textPrimary;

  const handleLongPress = () => {
    Alert.alert(expense.name, 'What would you like to do?', [
      { text: 'Edit', onPress: () => onEdit?.(expense) },
      {
        text: 'Mark as Waived',
        onPress: () =>
          Alert.alert(
            'Mark as Waived',
            `Mark "${expense.name}" as waived? No payment needed — it will be resolved at $0.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Mark as Waived', onPress: () => onWaive?.(expense) },
            ]
          ),
      },
      {
        text: 'Remove from this month',
        onPress: () =>
          Alert.alert(
            'Remove from This Month',
            `Remove "${expense.name}" from this month only? It will still appear in future months.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: () => onExcludeFromMonth?.(expense),
              },
            ]
          ),
      },
      {
        text: 'Delete permanently',
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            'Delete Commitment',
            `Are you sure you want to delete "${expense.name}"? This will remove it from all months.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(expense) },
            ]
          ),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        // Very subtle status tint on entire card for overdue/due-soon
        status === 'overdue' && { backgroundColor: '#FFFAFA' },
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
                  : colors.business + '50',
              },
            ]}
          >
            <Text
              style={[
                styles.typeText,
                {
                  color: expense.type === 'personal'
                    ? colors.personal
                    : colors.business,
                },
              ]}
            >
              {expense.type === 'personal' ? 'Personal' : 'Business'}
            </Text>
          </View>
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <Text style={styles.category}>{categoryLabel}</Text>
          <View style={styles.metaDot} />
          <Text style={styles.dueDay}>{formatDueDay(expense.due_day)}</Text>
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
              {expense.start_date ? formatShortDate(expense.start_date) : ''}
              {expense.end_date ? ` → ${formatShortDate(expense.end_date)}` : ''}
            </Text>
          </View>
        )}

        {/* Weekly allocation */}
        {weeklyAllocation !== undefined && !isResolved && (
          <Text style={styles.weeklyAlloc}>
            This week:{' '}
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
              {statusConfig.label}
            </Text>
          </View>
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
          <Text style={styles.creditAmt}>-{formatCurrency(creditAmount!)} credit</Text>
        )}
        {hasLateFee && (
          <Text style={styles.lateFee}>+{formatCurrency(lateFee!)} fee</Text>
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
            color={isResolved ? '#fff' : colors.textDisabled}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
    overflow: 'hidden',
  },
  accentStrip: {
    width: 5,
    alignSelf: 'stretch',
    borderRadius: 0,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  typeBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  typeText: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    letterSpacing: 0.1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  category: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textDisabled,
  },
  dueDay: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  dateRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dateRangeText: {
    fontSize: typography.xs,
    color: colors.textDisabled,
  },
  weeklyAlloc: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  weeklyAllocAmt: {
    fontWeight: typography.semibold,
    color: colors.primary,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: typography.xs,
    fontWeight: typography.medium,
    letterSpacing: 0.1,
  },
  autopayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: colors.primaryLight,
  },
  autopayText: {
    fontSize: typography.xs,
    fontWeight: typography.medium,
    color: colors.primary,
  },
  right: {
    alignItems: 'flex-end',
    gap: spacing.sm,
    flexShrink: 0,
    paddingRight: spacing.xs,
  },
  amount: {
    fontSize: typography.xl,     // 24px — dominant financial number
    fontWeight: typography.bold,
    letterSpacing: -0.5,
  },
  amountStack: {
    alignItems: 'flex-end',
    gap: 2,
  },
  plannedAmount: {
    fontSize: typography.xs,
    color: colors.textDisabled,
    textDecorationLine: 'line-through',
  },
  creditAmt: {
    fontSize: typography.xs,
    color: '#8B5CF6',
    fontWeight: typography.medium,
  },
  lateFee: {
    fontSize: typography.xs,
    color: colors.warning,
    fontWeight: typography.medium,
  },
  editBtn: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  checkBtnPaid: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkBtnWaived: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  checkBtnUnpaid: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
});
  