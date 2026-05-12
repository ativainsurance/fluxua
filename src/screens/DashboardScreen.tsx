import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { useExpenses } from '../hooks/useExpenses';
import {
  getCurrentMonthYear,
  getMonthName,
  formatCurrency,
  getWeeklyBreakdown,
  getShortMonthName,
  getCurrentWeekIndex,
} from '../utils/dateUtils';
import { colors, typography, spacing, radius, shadows } from '../theme';
import { SummaryCard } from '../components/SummaryCard';
import { MonthSelector } from '../components/MonthSelector';
import { ExpenseCard } from '../components/ExpenseCard';
import { PaidAmountModal } from '../components/PaidAmountModal';
import { ExpenseWithRecord } from '../types';

// ─────────────────────────────────────────────
// This Week's Flow Card
// ─────────────────────────────────────────────

const WeekFlowCard = ({
  expenses,
  month,
  year,
}: {
  expenses: ExpenseWithRecord[];
  month: number;
  year: number;
}) => {
  const weekIdx = getCurrentWeekIndex(month, year);
  const weekBreakdowns = getWeeklyBreakdown(
    expenses.reduce((s, e) => s + e.amount, 0),
    month,
    year,
    getShortMonthName(month)
  );
  const thisWeek = weekBreakdowns[weekIdx];

  let needed = 0;
  let covered = 0;
  expenses.forEach((exp) => {
    const weeks = getWeeklyBreakdown(exp.amount, month, year);
    const wk = weeks[weekIdx];
    if (!wk) return;
    needed += wk.amount;
    if (exp.record?.is_paid) covered += wk.amount;
  });
  const unallocated = needed - covered;
  const pct = needed > 0 ? covered / needed : 0;

  const barAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: pct,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const barWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const barColor =
    pct >= 0.9 ? colors.success : pct >= 0.5 ? '#60A5FA' : pct >= 0.2 ? colors.warning : colors.danger;

  if (!thisWeek) return null;

  return (
    <View style={styles.weekFlowCard}>
      <View style={styles.weekFlowHeader}>
        <Text style={styles.weekFlowEyebrow}>THIS WEEK'S FLOW</Text>
        <Text style={styles.weekFlowDate}>
          {getShortMonthName(month)} {thisWeek.startDay}–{thisWeek.endDay}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.weekFlowTrack}>
        <Animated.View style={[styles.weekFlowFill, { width: barWidth, backgroundColor: barColor }]} />
      </View>

      {/* Stats row */}
      <View style={styles.weekFlowStats}>
        <View style={styles.weekFlowStat}>
          <Text style={styles.weekFlowStatAmt}>{formatCurrency(needed)}</Text>
          <Text style={styles.weekFlowStatLbl}>You need</Text>
        </View>
        <View style={styles.weekFlowDivider} />
        <View style={styles.weekFlowStat}>
          <Text style={[styles.weekFlowStatAmt, { color: colors.success }]}>{formatCurrency(covered)}</Text>
          <Text style={styles.weekFlowStatLbl}>Covered</Text>
        </View>
        <View style={styles.weekFlowDivider} />
        <View style={styles.weekFlowStat}>
          <Text style={[styles.weekFlowStatAmt, { color: unallocated > 0 ? colors.danger : colors.success }]}>
            {formatCurrency(unallocated)}
          </Text>
          <Text style={styles.weekFlowStatLbl}>Unallocated</Text>
        </View>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// Overview Screen
// ─────────────────────────────────────────────

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const isCurrentMonth = month === currentMonth && year === currentYear;

  const { expenses, summary, loading, reload, markAsPaid, excludeFromMonth, waiveExpense } = useExpenses(month, year);

  const [pendingPaid, setPendingPaid] = useState<{ expense: ExpenseWithRecord; isPaid: boolean } | null>(null);

  const upcomingCommitments = expenses
    .filter((e) => !(e.record?.is_paid) && !(e.record?.is_waived))
    .sort((a, b) => a.due_day - b.due_day)
    .slice(0, 3);

  const handleTogglePaid = (expense: ExpenseWithRecord, isPaid: boolean) => {
    if (isPaid) {
      setPendingPaid({ expense, isPaid });
    } else {
      Alert.alert(
        'Mark as Unpaid',
        `Mark "${expense.name}" as unpaid? The recorded payment will be cleared.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Mark Unpaid', style: 'destructive', onPress: () => markAsPaid(expense, false) },
        ]
      );
    }
  };

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddExpense')}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Month selector */}
        <MonthSelector
          month={month}
          year={year}
          onChange={(m, y) => { setMonth(m); setYear(y); }}
        />

        {/* This Week's Flow — only shown for current month */}
        {isCurrentMonth && summary.expenseCount > 0 && (
          <WeekFlowCard expenses={expenses} month={month} year={year} />
        )}

        {/* Total Flow summary card */}
        {summary.expenseCount > 0 && <SummaryCard summary={summary} />}

        {/* Upcoming Commitments section */}
        {upcomingCommitments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Commitments</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Commitments')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {upcomingCommitments.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onTogglePaid={handleTogglePaid}
                onEdit={(e) => navigation.navigate('AddExpense', { expense: e })}
                onExcludeFromMonth={(e) => excludeFromMonth(e)}
                onWaive={(e) => waiveExpense(e)}
              />
            ))}
          </View>
        )}

        {/* All completed state */}
        {upcomingCommitments.length === 0 && summary.expenseCount > 0 && (
          <View style={styles.allDoneCard}>
            <View style={styles.allDoneIcon}>
              <Ionicons name="pulse" size={28} color={colors.success} />
            </View>
            <Text style={styles.allDoneTitle}>Flow complete</Text>
            <Text style={styles.allDoneSub}>
              All commitments for {getMonthName(month)} are settled. Your flow is clean.
            </Text>
          </View>
        )}

        {/* Empty state */}
        {summary.expenseCount === 0 && !loading && (
          <View style={styles.emptyCard}>
            <Ionicons name="pulse-outline" size={48} color={colors.textDisabled} />
            <Text style={styles.emptyTitle}>No commitments yet</Text>
            <Text style={styles.emptySub}>
              Add your recurring bills and subscriptions to start tracking your flow.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('AddExpense')}
            >
              <Text style={styles.emptyBtnText}>Add first commitment</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick stats */}
        {summary.expenseCount > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="hourglass-outline" size={18} color={colors.warning} />
              <Text style={styles.statValue}>{summary.expenseCount - summary.paidCount}</Text>
              <Text style={styles.statLabel}>Unallocated</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-done" size={18} color={colors.success} />
              <Text style={styles.statValue}>{summary.paidCount}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="receipt-outline" size={18} color={colors.primary} />
              <Text style={styles.statValue}>{summary.expenseCount}</Text>
              <Text style={styles.statLabel}>Commitments</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <PaidAmountModal
        visible={pendingPaid !== null}
        expenseName={pendingPaid?.expense.name ?? ''}
        plannedAmount={pendingPaid?.expense.amount ?? 0}
        monthLabel={`${getMonthName(month)} ${year}`}
        onConfirm={(actualAmount, lateFee, creditAmount) => {
          if (pendingPaid) markAsPaid(pendingPaid.expense, true, actualAmount, lateFee, creditAmount);
          setPendingPaid(null);
        }}
        onSkip={() => {
          if (pendingPaid) markAsPaid(pendingPaid.expense, true, pendingPaid.expense.amount);
          setPendingPaid(null);
        }}
        onCancel={() => setPendingPaid(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxxl,
    gap: spacing.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  greeting: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  email: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: 2,
    maxWidth: 220,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },

  // ── This Week's Flow Card ──
  weekFlowCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.md,
    gap: spacing.md,
  },
  weekFlowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekFlowEyebrow: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.textDisabled,
    letterSpacing: 0.8,
  },
  weekFlowDate: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  weekFlowTrack: {
    height: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  weekFlowFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  weekFlowStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekFlowStat: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  weekFlowDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  weekFlowStatAmt: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  weekFlowStatLbl: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },

  // ── Sections ──
  section: {
    gap: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: typography.medium,
  },

  // ── All Done ──
  allDoneCard: {
    backgroundColor: colors.successLight,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  allDoneIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  allDoneTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.success,
  },
  allDoneSub: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // ── Empty ──
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.sm,
  },
  emptyTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },

  // ── Stats Row ──
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    ...shadows.sm,
  },
  statValue: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
