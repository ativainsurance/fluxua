import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useExpenses } from '../hooks/useExpenses';
import {
  getCurrentMonthYear,
  formatCurrency,
  getWeeklyBreakdown,
  getShortMonthName,
  getCurrentWeekIndex,
  getDayOrdinal,
} from '../utils/dateUtils';
import { colors, gradient, typography, spacing, radius, shadows } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { MonthSelector } from '../components/MonthSelector';
import { ExpenseWithRecord, getCategoryIcon } from '../types';

// ─────────────────────────────────────────────
// Pressure color logic
// ─────────────────────────────────────────────

const getPressureColor = (ratio: number, isPast: boolean): string => {
  if (!isPast) return colors.textDisabled; // future week — neutral
  if (ratio >= 0.9) return colors.success;
  if (ratio >= 0.5) return colors.teal;
  if (ratio >= 0.2) return colors.warning;
  return colors.danger;
};

const getPressureBg = (ratio: number, isPast: boolean): string => {
  if (!isPast) return colors.surfaceAlt;
  if (ratio >= 0.9) return colors.successLight;
  if (ratio >= 0.5) return colors.tealLight;
  if (ratio >= 0.2) return colors.warningLight;
  return colors.dangerLight;
};

/** Coverage ratio for a given week based on which commitments are paid */
const getWeekCoverage = (
  expenses: ExpenseWithRecord[],
  weekIndex: number,
  month: number,
  year: number
): number => {
  let needed = 0;
  let covered = 0;
  expenses.forEach((exp) => {
    const weeks = getWeeklyBreakdown(exp.amount, month, year);
    const wk = weeks[weekIndex];
    if (!wk) return;
    needed += wk.amount;
    if (exp.record?.is_paid) covered += wk.amount;
  });
  return needed > 0 ? covered / needed : 1;
};

// ─────────────────────────────────────────────
// Animated weekly bar for the overview grid
// ─────────────────────────────────────────────

const WeekBar = ({
  label,
  dateRange,
  amount,
  coverage,
  isCurrent,
  isPast,
  delay,
}: {
  label: string;
  dateRange: string;
  amount: number;
  coverage: number;
  isCurrent: boolean;
  isPast: boolean;
  delay: number;
}) => {
  const barAnim = useRef(new Animated.Value(0)).current;
  const color = isCurrent ? colors.teal : getPressureColor(coverage, isPast);
  const bg = isCurrent ? colors.tealLight : getPressureBg(coverage, isPast);

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: coverage,
      duration: 700,
      delay,
      useNativeDriver: false,
    }).start();
  }, [coverage]);

  const barWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.weekBarCard, isCurrent && styles.weekBarCardCurrent, { backgroundColor: bg }]}>
      <View style={styles.weekBarHeader}>
        <Text style={[styles.weekBarLabel, { color }]}>{label}</Text>
        {isCurrent && (
          <View style={styles.nowPill}>
            <Text style={styles.nowPillText}>NOW</Text>
          </View>
        )}
        {isPast && !isCurrent && coverage >= 0.9 && (
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
        )}
      </View>
      <Text style={[styles.weekBarAmount, { color: isCurrent ? colors.teal : colors.textPrimary }]}>
        {formatCurrency(amount)}
      </Text>
      <Text style={styles.weekBarDates}>{dateRange}</Text>

      {/* Progress bar */}
      <View style={styles.weekBarTrack}>
        <Animated.View
          style={[
            styles.weekBarFill,
            { width: barWidth, backgroundColor: color },
          ]}
        />
      </View>
      {isPast && (
        <Text style={[styles.weekBarCoverage, { color }]}>
          {Math.round(coverage * 100)}% covered
        </Text>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────
// Per-commitment card — clean, single-week focus
// ─────────────────────────────────────────────

const CommitmentFlowRow = ({
  expense,
  weekIndex,
  month,
  year,
  delay,
}: {
  expense: ExpenseWithRecord;
  weekIndex: number;
  month: number;
  year: number;
  delay: number;
}) => {
  const weeks = getWeeklyBreakdown(expense.amount, month, year);
  const thisWeek = weeks[weekIndex];
  const isPaid = expense.record?.is_paid ?? false;
  const isWaived = expense.record?.is_waived ?? false;
  const isResolved = isPaid || isWaived;
  const categoryIcon = getCategoryIcon(expense.category);

  const barAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: isResolved ? 1 : 0,
      duration: 600,
      delay,
      useNativeDriver: false,
    }).start();
  }, [isResolved]);

  const barWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const accentColor = isResolved
    ? colors.success
    : expense.type === 'personal' ? colors.personal : colors.business;
  const accentBg = isResolved
    ? colors.successLight
    : expense.type === 'personal' ? colors.personalLight : colors.businessLight;

  return (
    <View style={styles.commitmentCard}>
      {/* Left accent bar */}
      <View style={[styles.commitmentAccent, { backgroundColor: accentColor }]} />

      <View style={styles.commitmentBody}>
        {/* Icon + info */}
        <View style={styles.commitmentRow}>
          <View style={[styles.commitmentIcon, { backgroundColor: accentBg }]}>
            <Ionicons name={categoryIcon as any} size={18} color={accentColor} />
          </View>

          <View style={styles.commitmentMeta}>
            <Text style={styles.commitmentName} numberOfLines={1}>{expense.name}</Text>
            <Text style={styles.commitmentDue}>Due on the {getDayOrdinal(expense.due_day)}</Text>
          </View>

          <View style={styles.commitmentRight}>
            <Text style={[styles.commitmentAmount, { color: isResolved ? colors.success : colors.textPrimary }]}>
              {formatCurrency(expense.amount)}
            </Text>
            {isResolved ? (
              <View style={styles.resolvedChip}>
                <Ionicons name={isWaived ? 'gift-outline' : 'checkmark'} size={10} color={colors.success} />
                <Text style={styles.resolvedChipText}>{isWaived ? 'Waived' : 'Done'}</Text>
              </View>
            ) : thisWeek ? (
              <Text style={styles.weekAllocLabel}>
                <Text style={styles.weekAllocAmt}>{formatCurrency(thisWeek.amount)}</Text> this wk
              </Text>
            ) : null}
          </View>
        </View>

        {/* Single progress bar — paid progress */}
        {!isResolved && (
          <View style={styles.singleBarTrack}>
            <Animated.View style={[styles.singleBarFill, { width: barWidth, backgroundColor: accentColor }]} />
            {/* Static indicator showing weekly slice */}
            {thisWeek && expense.amount > 0 && (
              <View style={[
                styles.weekSliceMarker,
                { left: `${Math.min((thisWeek.amount / expense.amount) * 100, 100)}%` as any }
              ]} />
            )}
          </View>
        )}
        {isResolved && (
          <View style={[styles.singleBarTrack, { backgroundColor: colors.successLight }]}>
            <View style={[styles.singleBarFill, { width: '100%', backgroundColor: colors.success, opacity: 0.6 }]} />
          </View>
        )}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// FlowScreen
// ─────────────────────────────────────────────

export default function FlowScreen() {
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const { expenses, summary, loading, reload } = useExpenses(month, year);

  const isCurrentMonth = month === currentMonth && year === currentYear;
  const currentWeekIdx = isCurrentMonth ? getCurrentWeekIndex(month, year) : 0;
  const totalWeeklyBreakdown = getWeeklyBreakdown(summary.total, month, year, getShortMonthName(month));

  // Current week hero data
  const currentWeekData = totalWeeklyBreakdown[currentWeekIdx];
  const weekNeeded = currentWeekData?.amount ?? 0;
  const weekCoverage = getWeekCoverage(expenses, currentWeekIdx, month, year);
  const weekCovered = weekNeeded * weekCoverage;
  const weekUnallocated = weekNeeded - weekCovered;
  const coveragePct = weekNeeded > 0 ? weekCoverage * 100 : 0;

  // Animate the hero bar
  const heroAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(heroAnim, {
      toValue: weekCoverage,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [weekCoverage]);

  const heroBarWidth = heroAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const heroBarColor = coveragePct >= 90
    ? colors.success
    : coveragePct >= 50
    ? colors.teal
    : coveragePct >= 20
    ? colors.warning
    : colors.danger;
  const heroIsPositive = coveragePct >= 50;

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
            <Text style={styles.title}>Flow</Text>
            <Text style={styles.subtitle}>What's happening with your money</Text>
          </View>
        </View>

        {/* Month selector */}
        <MonthSelector
          month={month}
          year={year}
          onChange={(m, y) => { setMonth(m); setYear(y); }}
        />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : expenses.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="pulse-outline" size={40} color={colors.textDisabled} />
            <Text style={styles.emptyTitle}>No commitments this month</Text>
            <Text style={styles.emptyText}>Add commitments in the Commitments tab to see your flow here.</Text>
          </View>
        ) : (
          <>
            {/* ── Current Week Hero Card ── */}
            {isCurrentMonth && currentWeekData && (
              <View style={styles.heroCard}>
                <View style={styles.heroTop}>
                  <View>
                    <Text style={styles.heroEyebrow}>THIS WEEK</Text>
                    <Text style={styles.heroTitle}>
                      {getShortMonthName(month)} {currentWeekData.startDay}–{currentWeekData.endDay}
                    </Text>
                  </View>
                  <View style={[
                    styles.heroBadge,
                    { backgroundColor: heroBarColor + '22' }
                  ]}>
                    <Text style={[styles.heroBadgeText, { color: heroBarColor }]}>
                      {Math.round(coveragePct)}% covered
                    </Text>
                  </View>
                </View>

                {/* Hero bar — gradient when positive, semantic color otherwise */}
                <View style={styles.heroBarTrack}>
                  {heroIsPositive ? (
                    <Animated.View style={[styles.heroBarFill, { width: heroBarWidth }]}>
                      <LinearGradient
                        colors={gradient.brand}
                        start={gradient.brandStart}
                        end={gradient.brandEnd}
                        style={StyleSheet.absoluteFill}
                      />
                    </Animated.View>
                  ) : (
                    <Animated.View style={[styles.heroBarFill, { width: heroBarWidth, backgroundColor: heroBarColor }]} />
                  )}
                </View>

                {/* Row: Covered / Remaining / Committed — value first, label below */}
                <View style={styles.heroStats}>
                  <View style={styles.heroStat}>
                    <Text style={[styles.heroStatValue, { color: colors.success }]}>
                      {formatCurrency(weekCovered)}
                    </Text>
                    <Text style={styles.heroStatLabel}>covered</Text>
                  </View>
                  <View style={styles.heroStatDivider} />
                  <View style={styles.heroStat}>
                    <Text style={[styles.heroStatValue, { color: weekUnallocated > 0 ? colors.danger : colors.success }]}>
                      {formatCurrency(weekUnallocated)}
                    </Text>
                    <Text style={styles.heroStatLabel}>remaining</Text>
                  </View>
                  <View style={styles.heroStatDivider} />
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatValue}>{formatCurrency(weekNeeded)}</Text>
                    <Text style={styles.heroStatLabel}>committed</Text>
                  </View>
                </View>
              </View>
            )}

            {/* ── Month Flow Grid ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{getShortMonthName(month)} Flow</Text>
              <View style={styles.weekBarsGrid}>
                {totalWeeklyBreakdown.map((week, i) => {
                  const coverage = getWeekCoverage(expenses, i, month, year);
                  const isPastOrCurrent = isCurrentMonth
                    ? i <= currentWeekIdx
                    : true; // for past months treat all as past
                  const isCurrent = isCurrentMonth && i === currentWeekIdx;
                  return (
                    <WeekBar
                      key={week.week}
                      label={`Week ${week.week}`}
                      dateRange={`${getShortMonthName(month)} ${week.startDay}–${week.endDay}`}
                      amount={week.amount}
                      coverage={coverage}
                      isCurrent={isCurrent}
                      isPast={isPastOrCurrent}
                      delay={i * 120}
                    />
                  );
                })}
              </View>
            </View>

            {/* ── Per-Commitment Flow ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Per Commitment</Text>
              {expenses.map((expense, i) => (
                <CommitmentFlowRow
                  key={expense.id}
                  expense={expense}
                  weekIndex={currentWeekIdx}
                  month={month}
                  year={year}
                  delay={i * 100}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EEF2F8' },
  scroll: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxxl,
    gap: spacing.base,
  },
  header: {
    paddingTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  center: {
    paddingTop: spacing.xxxl,
    alignItems: 'center',
  },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.sm,
  },
  emptyTitle: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  emptyText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // ── Hero Card ──
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.md,
    gap: spacing.md,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroEyebrow: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textDisabled,
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  heroBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  heroBadgeText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
  },
  heroBarTrack: {
    height: 14,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  heroBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  heroStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  heroStatLabel: {
    fontSize: typography.xs,
    color: colors.textDisabled,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  heroStatValue: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },

  // ── Section ──
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },

  // ── Week Bars Grid ──
  weekBarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  weekBarCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    minWidth: '45%',
    flex: 1,
    gap: 4,
    opacity: 0.82,
  },
  weekBarCardCurrent: {
    borderWidth: 1.5,
    borderColor: colors.teal,
    opacity: 1,
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  weekBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekBarLabel: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
  },
  nowPill: {
    backgroundColor: colors.teal,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  nowPillText: {
    fontSize: 9,
    fontWeight: typography.bold,
    color: '#fff',
    letterSpacing: 0.5,
  },
  weekBarAmount: {
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
  weekBarDates: {
    fontSize: typography.xs,
    color: colors.textDisabled,
  },
  weekBarTrack: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.07)',
    borderRadius: radius.full,
    overflow: 'hidden',
    marginTop: 4,
  },
  weekBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  weekBarCoverage: {
    fontSize: typography.xs,
    fontWeight: typography.medium,
    marginTop: 2,
  },

  // ── Commitment Card ──
  commitmentCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
    flexDirection: 'row',
  },
  commitmentAccent: {
    width: 4,
    borderRadius: 4,
    margin: 4,
    marginRight: 0,
  },
  commitmentBody: {
    flex: 1,
    padding: spacing.md,
    paddingLeft: spacing.sm,
    gap: spacing.sm,
  },
  commitmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  commitmentIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  commitmentMeta: {
    flex: 1,
    gap: 3,
  },
  commitmentName: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  commitmentDue: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  commitmentRight: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  commitmentAmount: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    letterSpacing: -0.3,
  },
  resolvedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.successLight,
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  resolvedChipText: {
    fontSize: 10,
    color: colors.success,
    fontWeight: typography.semibold,
  },
  weekAllocLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  weekAllocAmt: {
    fontWeight: typography.bold,
    color: colors.teal,
  },
  singleBarTrack: {
    height: 5,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    overflow: 'visible',
    position: 'relative',
  },
  singleBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  weekSliceMarker: {
    position: 'absolute',
    top: -2,
    width: 2,
    height: 9,
    borderRadius: 1,
    backgroundColor: colors.teal,
    opacity: 0.7,
  },
});
