import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../contexts/ThemeContext';
import { useExpenses } from '../hooks/useExpenses';
import {
  getCurrentMonthYear,
  useFormatCurrency,
  useFormatDate,
  getWeeklyBreakdown,
  getCurrentWeekIndex,
} from '../utils/dateUtils';
import { typography, spacing, radius, shadows } from '../theme';
import { useEnergyState } from '../utils/energyState';
import { FlowBar } from '../components/ui/FlowBar';
import { GlowText } from '../components/ui/GlowText';
import { MonthSelector } from '../components/MonthSelector';
import { ExpenseWithRecord, getCategoryIcon } from '../types';

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
// Week Bar Card — sophisticated grid tiles
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
  const { colors } = useTheme();
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const weekStyles = useMemo(() => makeWeekStyles(colors), [colors]);
  const energyState = useEnergyState();

  const config = (isPast || isCurrent)
    ? energyState({ ratio: coverage })
    : { state: 'flowing' as const, color: colors.textTertiary, bg: colors.surfaceAlt };

  return (
    <View style={[
      weekStyles.card,
      { backgroundColor: config.bg },
      isCurrent && weekStyles.cardCurrent,
    ]}>
      <View style={weekStyles.header}>
        <Text style={[weekStyles.label, { color: config.color }]}>{label}</Text>
        <View style={weekStyles.headerRight}>
          {isCurrent && (
            <View style={weekStyles.nowPill}>
              <Text style={weekStyles.nowText}>{t('flow.now')}</Text>
            </View>
          )}
          {isPast && !isCurrent && coverage >= 0.9 && (
            <Ionicons name="checkmark-circle" size={13} color={colors.success} />
          )}
        </View>
      </View>

      <Text style={[weekStyles.amount, { color: isCurrent ? colors.teal : colors.textPrimary }]}>
        {formatCurrency(amount)}
      </Text>
      <Text style={weekStyles.dateRange}>{dateRange}</Text>

      <FlowBar ratio={isPast || isCurrent ? coverage : 0} state={config.state} height={6} />

      {isPast && (
        <Text style={[weekStyles.coverage, { color: config.color }]}>
          {Math.round(coverage * 100)}% {t('overview.covered')}
        </Text>
      )}
    </View>
  );
};

const makeWeekStyles = (colors: any) => StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.md,
    minWidth: '45%',
    flex: 1,
    gap: 4,
    ...shadows.sm,
  },
  cardCurrent: {
    borderWidth: 1.5,
    borderColor: colors.teal,
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    letterSpacing: 0.3,
  },
  nowPill: {
    backgroundColor: colors.teal,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  nowText: {
    fontSize: 9,
    fontWeight: typography.bold,
    color: colors.textInverse,
    letterSpacing: 0.5,
  },
  amount: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  dateRange: {
    fontSize: typography.xs,
    color: colors.textTertiary,
  },
  coverage: {
    fontSize: 10,
    fontWeight: typography.semibold,
    marginTop: 2,
    letterSpacing: 0.1,
  },
});

// ─────────────────────────────────────────────
// Commitment Flow Card — clean, single-week focus
// No repetitive W1/W2/W3/W4 bars
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
  const { colors } = useTheme();
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const { ordinalDay } = useFormatDate();
  const flowRowStyles = useMemo(() => makeFlowRowStyles(colors), [colors]);
  const energyState = useEnergyState();

  const weeks = getWeeklyBreakdown(expense.amount, month, year);
  const thisWeek = weeks[weekIndex];
  const isPaid = expense.record?.is_paid ?? false;
  const isWaived = expense.record?.is_waived ?? false;
  const isResolved = isPaid || isWaived;
  const categoryIcon = getCategoryIcon(expense.category);

  const resolvedConfig = energyState({ status: isWaived ? 'waived' : 'paid' });
  const accentColor = isResolved
    ? resolvedConfig.color
    : expense.type === 'personal' ? colors.personal : colors.business;
  const accentBg = isResolved
    ? resolvedConfig.bg
    : expense.type === 'personal' ? colors.personalLight : colors.businessLight;

  return (
    <View style={flowRowStyles.card}>
      <View style={[flowRowStyles.accentStrip, { backgroundColor: accentColor }]} />
      <View style={flowRowStyles.body}>
        {/* Row: icon + info + amount */}
        <View style={flowRowStyles.mainRow}>
          <View style={[flowRowStyles.iconCircle, { backgroundColor: accentBg }]}>
            <Ionicons name={categoryIcon as any} size={17} color={accentColor} />
          </View>

          <View style={flowRowStyles.meta}>
            <Text style={flowRowStyles.name} numberOfLines={1}>{expense.name}</Text>
            <Text style={flowRowStyles.due}>{t('flow.dueOnThe', { day: ordinalDay(expense.due_day) })}</Text>
          </View>

          <View style={flowRowStyles.right}>
            <Text style={[
              flowRowStyles.amount,
              { color: isResolved ? resolvedConfig.color : colors.textPrimary }
            ]}>
              {formatCurrency(expense.amount)}
            </Text>
            {isResolved ? (
              <View style={[flowRowStyles.resolvedChip, { backgroundColor: resolvedConfig.bg }]}>
                <Ionicons name={isWaived ? 'gift-outline' : 'checkmark'} size={9} color={resolvedConfig.color} />
                <Text style={[flowRowStyles.resolvedText, { color: resolvedConfig.color }]}>
                  {isWaived ? t('status.waived') : t('status.paid')}
                </Text>
              </View>
            ) : thisWeek ? (
              <Text style={flowRowStyles.weekAlloc}>
                <Text style={flowRowStyles.weekAllocAmt}>{formatCurrency(thisWeek.amount)}</Text>
                {' '}{t('flow.thisWeek').toLowerCase()}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Single progress bar */}
        <FlowBar
          ratio={isResolved ? 1 : 0}
          state={isResolved ? resolvedConfig.state : 'flowing'}
          height={5}
        />
      </View>
    </View>
  );
};

const makeFlowRowStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    flexDirection: 'row',
    ...shadows.card,
  },
  accentStrip: {
    width: 5,
  },
  body: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  meta: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  due: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  amount: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    letterSpacing: -0.5,
  },
  resolvedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  resolvedText: {
    fontSize: 10,
    fontWeight: typography.semibold,
  },
  weekAlloc: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  weekAllocAmt: {
    fontWeight: typography.bold,
    color: colors.teal,
  },
});

// ─────────────────────────────────────────────
// FlowScreen
// ─────────────────────────────────────────────

export default function FlowScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const { dateRange, shortMonth } = useFormatDate();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const { expenses, summary, loading, reload } = useExpenses(month, year);

  const isCurrentMonth = month === currentMonth && year === currentYear;
  const currentWeekIdx = isCurrentMonth ? getCurrentWeekIndex(month, year) : 0;
  const totalWeeklyBreakdown = getWeeklyBreakdown(summary.total, month, year);

  const currentWeekData = totalWeeklyBreakdown[currentWeekIdx];
  const weekNeeded = currentWeekData?.amount ?? 0;
  const weekCoverage = getWeekCoverage(expenses, currentWeekIdx, month, year);
  const weekCovered = weekNeeded * weekCoverage;
  const weekUnallocated = weekNeeded - weekCovered;
  const coveragePct = weekNeeded > 0 ? weekCoverage * 100 : 0;
  const energyState = useEnergyState();
  const heroEnergyResult = energyState({ ratio: weekCoverage });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.teal} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t('nav.flow')}</Text>
            <Text style={styles.subtitle}>{t('flow.subtitle')}</Text>
          </View>
        </View>

        <MonthSelector
          month={month}
          year={year}
          onChange={(m, y) => { setMonth(m); setYear(y); }}
        />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.teal} />
          </View>
        ) : expenses.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="pulse-outline" size={28} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>{t('flow.noExpensesTitle')}</Text>
            <Text style={styles.emptyText}>{t('flow.noExpensesText')}</Text>
          </View>
        ) : (
          <>
            {/* ── Dark Hero Card — matches Dashboard aesthetic ── */}
            {isCurrentMonth && currentWeekData && (
              <View style={styles.heroCard}>
                {/* Ambient glow orbs */}
                <View style={styles.heroGlowA} />
                <View style={styles.heroGlowB} />
                {/* Decorative ring */}
                <View style={styles.heroRing} />

                <View style={styles.heroContent}>
                  {/* Header */}
                  <View style={styles.heroHeaderRow}>
                    <View>
                      <Text style={styles.heroEyebrow}>{t('flow.thisWeek').toUpperCase()}</Text>
                      <Text style={styles.heroTitle}>
                        {dateRange(new Date(year, month - 1, currentWeekData.startDay), new Date(year, month - 1, currentWeekData.endDay))}
                      </Text>
                    </View>
                    <View style={[styles.heroBadge, { backgroundColor: heroEnergyResult.color + '22' }]}>
                      <View style={[styles.heroBadgeDot, { backgroundColor: heroEnergyResult.color }]} />
                      <Text style={[styles.heroBadgeText, { color: heroEnergyResult.color }]}>
                        {Math.round(coveragePct)}% {t('overview.covered')}
                      </Text>
                    </View>
                  </View>

                  {/* Amount */}
                  <GlowText intensity="subtle" style={styles.heroAmount}>{formatCurrency(weekNeeded)}</GlowText>
                  <Text style={styles.heroAmountLabel}>{t('flow.committedThisWeek').toLowerCase()}</Text>

                  {/* Progress bar */}
                  <FlowBar
                    ratio={weekCoverage}
                    state={heroEnergyResult.state}
                    height={8}
                    trackColor="rgba(250,250,247,0.10)"
                  />

                  {/* Stats row */}
                  <View style={styles.heroStats}>
                    <View style={styles.heroStat}>
                      <Text style={[styles.heroStatValue, { color: colors.success }]}>
                        {formatCurrency(weekCovered)}
                      </Text>
                      <Text style={styles.heroStatLabel}>{t('overview.covered').toUpperCase()}</Text>
                    </View>
                    <View style={styles.heroStatDivider} />
                    <View style={styles.heroStat}>
                      <Text style={[
                        styles.heroStatValue,
                        { color: weekUnallocated > 0 ? colors.warning : colors.success }
                      ]}>
                        {formatCurrency(weekUnallocated)}
                      </Text>
                      <Text style={styles.heroStatLabel}>{t('overview.remainingUpper')}</Text>
                    </View>
                    <View style={styles.heroStatDivider} />
                    <View style={styles.heroStat}>
                      <Text style={styles.heroStatValue}>{formatCurrency(weekNeeded)}</Text>
                      <Text style={styles.heroStatLabel}>{t('flow.committed')}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ── Month Flow Grid ── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{shortMonth(new Date(year, month - 1, 1))} {t('nav.flow')}</Text>
              <View style={styles.weekGrid}>
                {totalWeeklyBreakdown.map((week, i) => {
                  const coverage = getWeekCoverage(expenses, i, month, year);
                  const isPastOrCurrent = isCurrentMonth ? i <= currentWeekIdx : true;
                  const isCurrent = isCurrentMonth && i === currentWeekIdx;
                  return (
                    <WeekBar
                      key={week.week}
                      label={t('flow.week', { n: week.week })}
                      dateRange={dateRange(new Date(year, month - 1, week.startDay), new Date(year, month - 1, week.endDay))}
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
              <Text style={styles.sectionLabel}>{t('flow.perExpenseBreakdown')}</Text>
              {expenses.map((expense, i) => (
                <CommitmentFlowRow
                  key={expense.id}
                  expense={expense}
                  weekIndex={currentWeekIdx}
                  month={month}
                  year={year}
                  delay={i * 80}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
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

  // ── Header ──
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
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },

  center: { paddingTop: spacing.xxxl, alignItems: 'center' },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.sm,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
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
    lineHeight: 20,
  },

  // ── Dark hero card — Navy, matches Overview ──
  heroCard: {
    backgroundColor: colors.navy,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    marginHorizontal: -spacing.base,
    ...shadows.hero,
  },
  heroGlowA: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.teal,
    opacity: 0.15,
  },
  heroGlowB: {
    position: 'absolute',
    bottom: -60,
    left: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary,
    opacity: 0.12,
  },
  heroRing: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: 'rgba(250,250,247,0.05)',
  },
  heroContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroEyebrow: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: 'rgba(244,241,234,0.70)',
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textInverse,
    marginTop: 3,
    letterSpacing: -0.3,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heroBadgeText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
  },
  heroAmount: {
    fontSize: typography.display,
    fontWeight: typography.extrabold,
    color: colors.textInverse,
    letterSpacing: -2,
    lineHeight: 54,
  },
  heroAmountLabel: {
    fontSize: typography.xs,
    color: 'rgba(244,241,234,0.60)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: -8,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(250,250,247,0.07)',
    marginTop: spacing.xs,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  heroStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(250,250,247,0.08)',
  },
  heroStatValue: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.textInverse,
    letterSpacing: -0.3,
  },
  heroStatLabel: {
    fontSize: 9,
    color: 'rgba(244,241,234,0.55)',
    fontWeight: typography.semibold,
    letterSpacing: 0.8,
  },

  // ── Sections ──
  section: { gap: spacing.sm },
  sectionLabel: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  weekGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});