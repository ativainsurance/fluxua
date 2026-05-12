import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Animated,
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
  getBillStatus,
} from '../utils/dateUtils';
import { colors, typography, spacing, radius, shadows } from '../theme';
import { MonthSelector } from '../components/MonthSelector';
import { PaidAmountModal } from '../components/PaidAmountModal';
import { ExpenseWithRecord, getCategoryIcon } from '../types';

// ─────────────────────────────────────────────
// Hero Card — the dominant financial snapshot
// ─────────────────────────────────────────────

const HeroCard = ({
  greeting,
  userName,
  total,
  paid,
  paidCount,
  totalCount,
  month,
  year,
  expenses,
}: {
  greeting: string;
  userName: string;
  total: number;
  paid: number;
  paidCount: number;
  totalCount: number;
  month: number;
  year: number;
  expenses: ExpenseWithRecord[];
}) => {
  const pct = total > 0 ? paid / total : 0;
  const coveragePct = Math.round(pct * 100);

  const barAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: pct,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const barWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const barColor =
    pct >= 0.9 ? '#34D399' : pct >= 0.5 ? '#60A5FA' : pct >= 0.2 ? '#FBBF24' : '#F87171';

  const trend = pct >= 0.5 ? '↑' : '↓';
  const trendColor = pct >= 0.5 ? '#34D399' : '#F87171';

  // Week data
  const weekIdx = getCurrentWeekIndex(month, year);
  const weekBreakdowns = getWeeklyBreakdown(total, month, year, getShortMonthName(month));
  const thisWeek = weekBreakdowns[weekIdx];
  let weekNeeded = 0;
  expenses.forEach((exp) => {
    const wks = getWeeklyBreakdown(exp.amount, month, year);
    if (wks[weekIdx]) weekNeeded += wks[weekIdx].amount;
  });

  return (
    <View style={heroStyles.card}>
      {/* Glow orbs — simulated gradient feel */}
      <View style={heroStyles.glowTopRight} />
      <View style={heroStyles.glowBottomLeft} />

      {/* Content */}
      <View style={heroStyles.content}>
        <Text style={heroStyles.greeting}>{greeting}</Text>
        <Text style={heroStyles.name} numberOfLines={1}>{userName}</Text>

        <View style={heroStyles.amountRow}>
          <Text style={heroStyles.amount}>{formatCurrency(total)}</Text>
          <View style={[heroStyles.trendBadge, { backgroundColor: trendColor + '22' }]}>
            <Text style={[heroStyles.trendText, { color: trendColor }]}>
              {trend} {coveragePct}% covered
            </Text>
          </View>
        </View>

        <Text style={heroStyles.amountLabel}>Total Flow · {getMonthName(month)} {year}</Text>

        {/* Progress bar */}
        <View style={heroStyles.progressTrack}>
          <Animated.View style={[heroStyles.progressFill, { width: barWidth, backgroundColor: barColor }]} />
        </View>

        {/* 3-stat row */}
        <View style={heroStyles.statsRow}>
          <View style={heroStyles.stat}>
            <Text style={heroStyles.statValue}>{formatCurrency(paid)}</Text>
            <Text style={heroStyles.statLabel}>Settled</Text>
          </View>
          <View style={heroStyles.statDivider} />
          <View style={heroStyles.stat}>
            <Text style={heroStyles.statValue}>{formatCurrency(total - paid)}</Text>
            <Text style={heroStyles.statLabel}>Remaining</Text>
          </View>
          {thisWeek && (
            <>
              <View style={heroStyles.statDivider} />
              <View style={heroStyles.stat}>
                <Text style={heroStyles.statValue}>{formatCurrency(weekNeeded)}</Text>
                <Text style={heroStyles.statLabel}>This week</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const heroStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.navy,
    borderRadius: 28,
    overflow: 'hidden',
    // Deep elevated shadow with teal tint
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  glowTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#14B8A6',
    opacity: 0.18,
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#3B82F6',
    opacity: 0.14,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.sm,
  },
  greeting: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: typography.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: -2,
    marginBottom: spacing.xs,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  amount: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  trendBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  trendText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
  },
  amountLabel: {
    fontSize: typography.xs,
    color: 'rgba(255,255,255,0.4)',
    marginTop: -4,
  },
  progressTrack: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.full,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statValue: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: typography.medium,
  },
});

// ─────────────────────────────────────────────
// Colored Stat Cards — quick visual signals
// ─────────────────────────────────────────────

const StatCards = ({
  paidCount,
  unpaidCount,
  totalCount,
  personalTotal,
  businessTotal,
}: {
  paidCount: number;
  unpaidCount: number;
  totalCount: number;
  personalTotal: number;
  businessTotal: number;
}) => (
  <View style={statStyles.row}>
    <View style={[statStyles.card, { backgroundColor: colors.successLight }]}>
      <View style={[statStyles.iconCircle, { backgroundColor: '#D1FAE5' }]}>
        <Ionicons name="checkmark-done" size={16} color={colors.success} />
      </View>
      <Text style={[statStyles.value, { color: colors.success }]}>{paidCount}</Text>
      <Text style={statStyles.label}>Completed</Text>
    </View>

    <View style={[statStyles.card, { backgroundColor: colors.warningLight }]}>
      <View style={[statStyles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
        <Ionicons name="hourglass-outline" size={16} color={colors.warning} />
      </View>
      <Text style={[statStyles.value, { color: colors.warning }]}>{unpaidCount}</Text>
      <Text style={statStyles.label}>Unallocated</Text>
    </View>

    <View style={[statStyles.card, { backgroundColor: colors.primaryLight }]}>
      <View style={[statStyles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
        <Ionicons name="receipt-outline" size={16} color={colors.primary} />
      </View>
      <Text style={[statStyles.value, { color: colors.primary }]}>{totalCount}</Text>
      <Text style={statStyles.label}>Total Bills</Text>
    </View>
  </View>
);

const statStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    // Soft shadow
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  value: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
  },
  label: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.medium,
    textAlign: 'center',
  },
});

// ─────────────────────────────────────────────
// Premium Commitment Row
// ─────────────────────────────────────────────

const STATUS_ACCENT: Record<string, { accent: string; bg: string; label: string; icon: string }> = {
  paid:       { accent: colors.success,  bg: colors.successLight,  label: 'Completed', icon: 'checkmark-circle' },
  overdue:    { accent: colors.danger,   bg: colors.dangerLight,   label: 'Overdue',   icon: 'alert-circle' },
  'due-soon': { accent: colors.warning,  bg: colors.warningLight,  label: 'Due Soon',  icon: 'time' },
  upcoming:   { accent: colors.primary,  bg: colors.primaryLight,  label: 'Upcoming',  icon: 'calendar-outline' },
};

const CommitmentRow = ({
  expense,
  onTogglePaid,
}: {
  expense: ExpenseWithRecord;
  onTogglePaid: (expense: ExpenseWithRecord, isPaid: boolean) => void;
}) => {
  const isPaid = expense.record?.is_paid ?? false;
  const status = getBillStatus(expense.due_day, isPaid);
  const config = STATUS_ACCENT[status] ?? STATUS_ACCENT.upcoming;
  const categoryIcon = getCategoryIcon(expense.category);
  const amount = expense.record?.actual_amount ?? expense.amount;

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start(() => onTogglePaid(expense, !isPaid));
  };

  return (
    <Animated.View style={[rowStyles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      {/* Left accent bar */}
      <View style={[rowStyles.accentBar, { backgroundColor: config.accent }]} />

      <View style={rowStyles.body}>
        {/* Category icon circle */}
        <View style={[rowStyles.iconCircle, { backgroundColor: config.bg }]}>
          <Ionicons name={categoryIcon as any} size={18} color={config.accent} />
        </View>

        {/* Name + due */}
        <View style={rowStyles.info}>
          <Text style={rowStyles.name} numberOfLines={1}>{expense.name}</Text>
          <View style={rowStyles.metaRow}>
            <View style={[rowStyles.badge, { backgroundColor: config.bg }]}>
              <Ionicons name={config.icon as any} size={10} color={config.accent} />
              <Text style={[rowStyles.badgeText, { color: config.accent }]}>{config.label}</Text>
            </View>
            {expense.is_autopay && (
              <View style={rowStyles.autopayBadge}>
                <Ionicons name="flash" size={9} color={colors.primary} />
                <Text style={rowStyles.autopayText}>Auto</Text>
              </View>
            )}
          </View>
        </View>

        {/* Right: amount + check */}
        <View style={rowStyles.right}>
          <Text style={[rowStyles.amount, isPaid && { color: colors.success }]}>
            {formatCurrency(amount)}
          </Text>
          <TouchableOpacity
            style={[rowStyles.checkBtn, isPaid ? rowStyles.checkBtnPaid : rowStyles.checkBtnUnpaid]}
            onPress={handlePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="checkmark"
              size={13}
              color={isPaid ? '#fff' : colors.textDisabled}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const rowStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  accentBar: {
    width: 4,
    borderRadius: 4,
    margin: 4,
    marginRight: 0,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 5,
  },
  name: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: typography.semibold,
  },
  autopayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  autopayText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: typography.semibold,
  },
  right: {
    alignItems: 'flex-end',
    gap: spacing.sm,
    flexShrink: 0,
  },
  amount: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.textPrimary,
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
  checkBtnUnpaid: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
});

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

  const { expenses, summary, loading, reload, markAsPaid, excludeFromMonth } = useExpenses(month, year);

  const [pendingPaid, setPendingPaid] = useState<{ expense: ExpenseWithRecord; isPaid: boolean } | null>(null);

  const upcomingCommitments = expenses
    .filter((e) => !(e.record?.is_paid))
    .sort((a, b) => a.due_day - b.due_day)
    .slice(0, 5);

  const handleTogglePaid = (expense: ExpenseWithRecord, isPaid: boolean) => {
    if (isPaid) {
      setPendingPaid({ expense, isPaid });
    } else {
      markAsPaid(expense, false);
    }
  };

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening';

  const userName = user?.email?.split('@')[0] ?? '';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.primary} />
        }
      >
        {/* ── Top header ── */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.screenTitle}>Overview</Text>
            <Text style={styles.screenSub}>{getMonthName(month)} {year}</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddExpense')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Month selector */}
        <MonthSelector
          month={month}
          year={year}
          onChange={(m, y) => { setMonth(m); setYear(y); }}
        />

        {summary.expenseCount === 0 && !loading ? (
          /* ── Empty state ── */
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="pulse-outline" size={32} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No commitments yet</Text>
            <Text style={styles.emptySub}>
              Add your recurring bills and subscriptions to start tracking your flow.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('AddExpense')}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.emptyBtnText}>Add first commitment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── 1. HERO CARD ── */}
            <HeroCard
              greeting={greeting}
              userName={userName}
              total={summary.total}
              paid={summary.totalPaid}
              paidCount={summary.paidCount}
              totalCount={summary.expenseCount}
              month={month}
              year={year}
              expenses={expenses}
            />

            {/* ── 2. STAT CARDS ── */}
            <StatCards
              paidCount={summary.paidCount}
              unpaidCount={summary.expenseCount - summary.paidCount}
              totalCount={summary.expenseCount}
              personalTotal={summary.personalTotal}
              businessTotal={summary.businessTotal}
            />

            {/* ── 3. UPCOMING / ALL DONE ── */}
            {upcomingCommitments.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Upcoming</Text>
                  <TouchableOpacity
                    style={styles.seeAllBtn}
                    onPress={() => navigation.navigate('Commitments')}
                  >
                    <Text style={styles.seeAllText}>See all</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                {upcomingCommitments.map((expense) => (
                  <CommitmentRow
                    key={expense.id}
                    expense={expense}
                    onTogglePaid={handleTogglePaid}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.allDoneCard}>
                <View style={styles.allDoneGlow} />
                <View style={styles.allDoneIcon}>
                  <Ionicons name="checkmark-circle" size={32} color={colors.success} />
                </View>
                <Text style={styles.allDoneTitle}>Flow complete ✦</Text>
                <Text style={styles.allDoneSub}>
                  All {summary.expenseCount} commitments for {getMonthName(month)} are settled.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <PaidAmountModal
        visible={pendingPaid !== null}
        expenseName={pendingPaid?.expense.name ?? ''}
        plannedAmount={pendingPaid?.expense.amount ?? 0}
        monthLabel={`${getMonthName(month)} ${year}`}
        onConfirm={(actualAmount, lateFee) => {
          if (pendingPaid) markAsPaid(pendingPaid.expense, true, actualAmount, lateFee);
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

  // ── Top bar ──
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  screenTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  screenSub: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },

  // ── Section ──
  section: {
    gap: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: typography.semibold,
  },

  // ── All done ──
  allDoneCard: {
    backgroundColor: colors.successLight,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  allDoneGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.success,
    opacity: 0.08,
  },
  allDoneIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  allDoneTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: '#065F46',
  },
  allDoneSub: {
    fontSize: typography.sm,
    color: '#047857',
    textAlign: 'center',
    opacity: 0.8,
  },

  // ── Empty state ──
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    ...shadows.md,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
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
    lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    marginTop: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
});
