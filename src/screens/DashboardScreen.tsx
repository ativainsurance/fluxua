import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import { useTheme } from '../contexts/ThemeContext';
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
import {typography, spacing, radius, shadows } from '../theme';
import { MonthSelector } from '../components/MonthSelector';
import { PaidAmountModal } from '../components/PaidAmountModal';
import { ExpenseWithRecord, getCategoryIcon } from '../types';

// ─────────────────────────────────────────────
// Hero Card — dominant financial snapshot
// Inspired by premium fintech depth:
//   large display number → progress bar → 3-stat row
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
  const { colors } = useTheme();
  const heroStyles = useMemo(() => makeHeroStyles(colors), [colors]);

  const pct = total > 0 ? paid / total : 0;
  const coveragePct = Math.round(pct * 100);

  const barAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: pct,
      duration: 1100,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const barWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  // Semantic color for progress — shifts from red → yellow → teal → green
  const barColor =
    pct >= 0.9 ? '#34D399' :
    pct >= 0.6 ? colors.teal :
    pct >= 0.3 ? '#FBBF24' : '#F87171';

  const trendUp = pct >= 0.5;
  const trendColor = trendUp ? '#34D399' : '#F87171';

  // Weekly context
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
      {/* ── Ambient glow layers ── */}
      <View style={heroStyles.glowTopRight} />
      <View style={heroStyles.glowBottomLeft} />
      <View style={heroStyles.glowCenter} />

      {/* ── Decorative geometry ── */}
      <View style={heroStyles.ringOuter} />
      <View style={heroStyles.ringInner} />

      {/* ── Content ── */}
      <View style={heroStyles.content}>
        {/* Header row: greeting + coverage badge */}
        <View style={heroStyles.headerRow}>
          <View>
            <Text style={heroStyles.eyebrow}>{greeting}</Text>
            <Text style={heroStyles.userName} numberOfLines={1}>{userName}</Text>
          </View>
          <View style={[heroStyles.coverageBadge, { backgroundColor: trendColor + '22' }]}>
            <View style={[heroStyles.coverageDot, { backgroundColor: trendColor }]} />
            <Text style={[heroStyles.coverageText, { color: trendColor }]}>
              {coveragePct}% covered
            </Text>
          </View>
        </View>

        {/* Display amount */}
        <View style={heroStyles.amountBlock}>
          <Text style={heroStyles.amountLabel}>
            {getMonthName(month)} {year} · Total Flow
          </Text>
          <Text style={heroStyles.amount}>{formatCurrency(total)}</Text>
        </View>

        {/* Progress bar with glow */}
        <View style={heroStyles.progressSection}>
          <View style={heroStyles.progressTrack}>
            <Animated.View
              style={[
                heroStyles.progressFill,
                {
                  width: barWidth,
                  backgroundColor: barColor,
                  shadowColor: barColor,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.9,
                  shadowRadius: 8,
                  elevation: 4,
                },
              ]}
            />
          </View>
          <View style={heroStyles.progressLabels}>
            <Text style={heroStyles.progressLabelLeft}>
              {formatCurrency(paid)} settled
            </Text>
            <Text style={heroStyles.progressLabelRight}>
              {paidCount}/{totalCount} bills
            </Text>
          </View>
        </View>

        {/* 3-stat row */}
        <View style={heroStyles.statsRow}>
          <View style={heroStyles.stat}>
            <Text style={heroStyles.statValue}>{formatCurrency(paid)}</Text>
            <Text style={heroStyles.statLabel}>SETTLED</Text>
          </View>
          <View style={heroStyles.statDivider} />
          <View style={heroStyles.stat}>
            <Text style={[heroStyles.statValue, { color: total - paid > 0 ? '#FBBF24' : '#34D399' }]}>
              {formatCurrency(total - paid)}
            </Text>
            <Text style={heroStyles.statLabel}>REMAINING</Text>
          </View>
          {thisWeek && (
            <>
              <View style={heroStyles.statDivider} />
              <View style={heroStyles.stat}>
                <Text style={[heroStyles.statValue, { color: colors.teal }]}>
                  {formatCurrency(weekNeeded)}
                </Text>
                <Text style={heroStyles.statLabel}>THIS WEEK</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const makeHeroStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.navy,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    marginHorizontal: -spacing.base,   // break out of scroll padding — immersive
    ...shadows.hero,
  },

  // ── Ambient glow orbs ──
  glowTopRight: {
    position: 'absolute',
    top: -70,
    right: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.teal,
    opacity: 0.16,
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -90,
    left: -50,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.primary,
    opacity: 0.13,
  },
  glowCenter: {
    position: 'absolute',
    top: '15%',
    right: '20%',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#7C3AED',
    opacity: 0.07,
  },

  // ── Decorative concentric rings (premium depth) ──
  ringOuter: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  ringInner: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },

  // ── Content ──
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  userName: {
    fontSize: typography.sm,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 3,
    fontWeight: typography.medium,
  },
  coverageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  coverageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  coverageText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
  },

  // ── Amount display ──
  amountBlock: {
    gap: 4,
  },
  amountLabel: {
    fontSize: typography.xs,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  amount: {
    fontSize: typography.display,   // 48px — dominant financial number
    fontWeight: typography.extrabold,
    color: '#FFFFFF',
    letterSpacing: -2,
    lineHeight: 54,
  },

  // ── Progress bar ──
  progressSection: {
    gap: spacing.xs,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabelLeft: {
    fontSize: typography.xs,
    color: 'rgba(255,255,255,0.40)',
    fontWeight: typography.medium,
  },
  progressLabelRight: {
    fontSize: typography.xs,
    color: 'rgba(255,255,255,0.40)',
    fontWeight: typography.medium,
  },

  // ── Stats row ──
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    marginTop: -spacing.xs,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  statValue: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: typography.semibold,
    letterSpacing: 0.8,
  },
});

// ─────────────────────────────────────────────
// Stat Cards — primary / secondary hierarchy
// ─────────────────────────────────────────────

const StatCards = ({
  paidCount,
  unpaidCount,
  totalCount,
  totalPaid,
}: {
  paidCount: number;
  unpaidCount: number;
  totalCount: number;
  totalPaid: number;
}) => {
  const { colors } = useTheme();
  const statStyles = useMemo(() => makeStatStyles(colors), [colors]);
  return (
  <View style={statStyles.container}>
    {/* Primary card — full width, Completed as dominant signal */}
    <View style={[statStyles.primaryCard, { backgroundColor: colors.successLight }]}>
      <View style={[statStyles.primaryIcon, { backgroundColor: '#D1FAE5' }]}>
        <Ionicons name="checkmark-done" size={22} color={colors.success} />
      </View>
      <View style={statStyles.primaryBody}>
        <Text style={[statStyles.primaryValue, { color: colors.success }]}>
          {paidCount}
          <Text style={statStyles.primaryDenom}> / {totalCount}</Text>
        </Text>
        <Text style={statStyles.primaryLabel}>Commitments completed</Text>
      </View>
      <View style={statStyles.primaryRight}>
        <Text style={[statStyles.primaryPct, {
          color: paidCount === totalCount ? colors.success : colors.warning
        }]}>
          {totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0}%
        </Text>
        <Text style={statStyles.primaryPctLabel}>done</Text>
      </View>
    </View>

    {/* Secondary row */}
    <View style={statStyles.secondaryRow}>
      <View style={[statStyles.secondaryCard, { backgroundColor: colors.warningLight }]}>
        <View style={[statStyles.secondaryIcon, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="hourglass-outline" size={14} color={colors.warning} />
        </View>
        <Text style={[statStyles.secondaryValue, { color: colors.warning }]}>{unpaidCount}</Text>
        <Text style={statStyles.secondaryLabel}>Remaining</Text>
      </View>

      <View style={[statStyles.secondaryCard, { backgroundColor: colors.primaryLight }]}>
        <View style={[statStyles.secondaryIcon, { backgroundColor: '#DBEAFE' }]}>
          <Ionicons name="receipt-outline" size={14} color={colors.primary} />
        </View>
        <Text style={[statStyles.secondaryValue, { color: colors.primary }]}>{totalCount}</Text>
        <Text style={statStyles.secondaryLabel}>Total Bills</Text>
      </View>
    </View>
  </View>
  );
}

const makeStatStyles = (colors: any) => StyleSheet.create({
  container: { gap: spacing.sm },
  primaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.md,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 2,
  },
  primaryIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  primaryBody: { flex: 1, gap: 3 },
  primaryValue: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    lineHeight: 28,
  },
  primaryDenom: {
    fontSize: typography.md,
    fontWeight: typography.regular,
    color: colors.textSecondary,
  },
  primaryLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  primaryRight: {
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
    paddingRight: spacing.xs,
  },
  primaryPct: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    letterSpacing: -0.5,
  },
  primaryPctLabel: {
    fontSize: 9,
    color: colors.textTertiary,
    fontWeight: typography.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  secondaryRow: { flexDirection: 'row', gap: spacing.sm },
  secondaryCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.sm,
  },
  secondaryIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  secondaryValue: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
  },
  secondaryLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
});

// ─────────────────────────────────────────────
// Commitment Row — premium fintech card
// ─────────────────────────────────────────────

const STATUS_ACCENT: Record<string, { accent: string; bg: string; label: string; icon: string }> = {
  paid:       { accent: '#10B981',  bg: '#D1FAE5',  label: 'Completed', icon: 'checkmark-circle' },
  waived:     { accent: '#8B5CF6',       bg: '#EDE9FE',            label: 'Waived',    icon: 'gift-outline' },
  overdue:    { accent: '#EF4444',   bg: '#FEE2E2',   label: 'Overdue',   icon: 'alert-circle' },
  'due-soon': { accent: '#F59E0B',  bg: '#FEF3C7',  label: 'Due Soon',  icon: 'time' },
  upcoming:   { accent: '#3B82F6',  bg: '#EFF6FF',  label: 'Upcoming',  icon: 'calendar-outline' },
};

const CommitmentRow = ({
  expense,
  onTogglePaid,
}: {
  expense: ExpenseWithRecord;
  onTogglePaid: (expense: ExpenseWithRecord, isPaid: boolean) => void;
}) => {
  const { colors } = useTheme();
  const rowStyles = useMemo(() => makeRowStyles(colors), [colors]);

  const isPaid = expense.record?.is_paid ?? false;
  const isWaived = expense.record?.is_waived ?? false;
  const status = isWaived ? 'waived' : getBillStatus(expense.due_day, isPaid);
  const config = STATUS_ACCENT[status] ?? STATUS_ACCENT.upcoming;
  const categoryIcon = getCategoryIcon(expense.category);
  const amount = expense.record?.actual_amount ?? expense.amount;
  const isResolved = isPaid || isWaived;

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 70, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start(() => onTogglePaid(expense, !isResolved));
  };

  return (
    <Animated.View style={[rowStyles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      {/* Left accent strip */}
      <View style={[rowStyles.accentStrip, { backgroundColor: config.accent }]} />

      <View style={rowStyles.body}>
        {/* Category icon */}
        <View style={[rowStyles.iconCircle, { backgroundColor: config.bg }]}>
          <Ionicons name={categoryIcon as any} size={19} color={config.accent} />
        </View>

        {/* Info: name + status badge */}
        <View style={rowStyles.info}>
          <Text style={[rowStyles.name, isResolved && { opacity: 0.6 }]} numberOfLines={1}>
            {expense.name}
          </Text>
          <View style={rowStyles.badgeRow}>
            <View style={[rowStyles.statusBadge, { backgroundColor: config.bg }]}>
              <Ionicons name={config.icon as any} size={9} color={config.accent} />
              <Text style={[rowStyles.statusText, { color: config.accent }]}>{config.label}</Text>
            </View>
            {expense.is_autopay && (
              <View style={rowStyles.autopayBadge}>
                <Ionicons name="flash" size={9} color={colors.primary} />
                <Text style={rowStyles.autopayText}>Auto</Text>
              </View>
            )}
          </View>
        </View>

        {/* Amount + check — right panel */}
        <View style={rowStyles.right}>
          <Text style={[
            rowStyles.amount,
            isResolved && { color: colors.success, opacity: 0.8 },
          ]}>
            {formatCurrency(amount)}
          </Text>
          <TouchableOpacity
            style={[
              rowStyles.checkBtn,
              isResolved ? rowStyles.checkBtnDone : rowStyles.checkBtnPending,
              isWaived && rowStyles.checkBtnWaived,
            ]}
            onPress={handlePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isWaived ? 'gift-outline' : 'checkmark'}
              size={13}
              color={isResolved ? '#fff' : colors.textDisabled}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const makeRowStyles = (colors: any) => StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  accentStrip: {
    width: 5,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.base,
    gap: spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
    fontSize: 10,
    fontWeight: typography.semibold,
    letterSpacing: 0.1,
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
    gap: spacing.xs,
    flexShrink: 0,
  },
  amount: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  checkBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  checkBtnDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkBtnWaived: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  checkBtnPending: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
});

// ─────────────────────────────────────────────
// Overview Screen
// ─────────────────────────────────────────────

export default function DashboardScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const { expenses, summary, loading, reload, markAsPaid } = useExpenses(month, year);
  const [pendingPaid, setPendingPaid] = useState<{ expense: ExpenseWithRecord; isPaid: boolean } | null>(null);

  const upcomingCommitments = expenses
    .filter((e) => !(e.record?.is_paid) && !(e.record?.is_waived))
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
    greetingHour < 12 ? 'Good morning' :
    greetingHour < 18 ? 'Good afternoon' : 'Good evening';

  const userName = user?.email?.split('@')[0] ?? '';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.teal} />
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
            <View style={styles.emptyIconRing}>
              <Ionicons name="pulse-outline" size={30} color={colors.primary} />
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
            {/* ── 1. HERO ── */}
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
              totalPaid={summary.totalPaid}
            />

            {/* ── 3. UPCOMING / ALL DONE ── */}
            {upcomingCommitments.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>Upcoming</Text>
                  <TouchableOpacity
                    style={styles.seeAllBtn}
                    onPress={() => navigation.navigate('Commitments')}
                  >
                    <Text style={styles.seeAllText}>See all</Text>
                    <Ionicons name="chevron-forward" size={13} color={colors.primary} />
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
                <View style={styles.allDoneGlowA} />
                <View style={styles.allDoneGlowB} />
                <View style={styles.allDoneIconRing}>
                  <Ionicons name="checkmark-circle" size={30} color={colors.success} />
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

const makeStyles = (colors: any) => StyleSheet.create({
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
    letterSpacing: -0.3,
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
    shadowOpacity: 0.40,
    shadowRadius: 12,
    elevation: 5,
  },

  // ── Section ──
  section: { gap: 0 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
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

  // ── All done state ──
  allDoneCard: {
    backgroundColor: colors.successLight,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  allDoneGlowA: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.success,
    opacity: 0.08,
  },
  allDoneGlowB: {
    position: 'absolute',
    bottom: -40,
    left: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.teal,
    opacity: 0.07,
  },
  allDoneIconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 3,
  },
  allDoneTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: '#065F46',
    letterSpacing: -0.3,
  },
  allDoneSub: {
    fontSize: typography.sm,
    color: '#047857',
    textAlign: 'center',
    opacity: 0.85,
    lineHeight: 20,
  },

  // ── Empty state ──
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    ...shadows.card,
  },
  emptyIconRing: {
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
    letterSpacing: -0.3,
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
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
});