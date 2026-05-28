import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../contexts/ThemeContext';
import { useRecurringIncomes } from '../hooks/useRecurringIncomes';
import { useTransferCycles, computeTransferCycles } from '../hooks/useTransferCycles';
import { getCurrentMonthYear, useFormatCurrency, useFormatDate } from '../utils/dateUtils';
import { typography, spacing, radius, shadows } from '../theme';
import { MonthSelector } from '../components/MonthSelector';
import { TransferCycle, CycleCommitment } from '../types';
import { FlowBar } from '../components/ui/FlowBar';
import { GlowText } from '../components/ui/GlowText';

// ─── CycleMathRow ─────────────────────────────────────────────────────────────

const CycleMathRow = ({
  label,
  amount,
  color,
  isTotal = false,
}: {
  label: string;
  amount: number;
  color?: string;
  isTotal?: boolean;
}) => {
  const { colors } = useTheme();
  const formatCurrency = useFormatCurrency();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
      <Text style={{ fontSize: isTotal ? typography.base : typography.sm, fontWeight: isTotal ? typography.bold : typography.medium, color: color ?? colors.textSecondary }}>
        {label}
      </Text>
      <Text style={{ fontSize: isTotal ? typography.base : typography.sm, fontWeight: isTotal ? typography.bold : typography.semibold, color: color ?? colors.textSecondary }}>
        {formatCurrency(amount)}
      </Text>
    </View>
  );
};

// ─── CommitmentLine ───────────────────────────────────────────────────────────

const CommitmentLine = ({ commitment }: { commitment: CycleCommitment }) => {
  const { colors } = useTheme();
  const formatCurrency = useFormatCurrency();
  const { ordinalDay } = useFormatDate();
  const { t } = useTranslation();
  const resolved = commitment.isPaid || commitment.isWaived;

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
      paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.divider,
    }}>
      <View style={{
        width: 7, height: 7, borderRadius: 3.5, flexShrink: 0,
        backgroundColor: resolved ? colors.success : colors.warning,
      }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: typography.sm, fontWeight: typography.semibold, color: resolved ? colors.textTertiary : colors.textPrimary }} numberOfLines={1}>
          {commitment.expense.name}
        </Text>
        <Text style={{ fontSize: 11, color: colors.textTertiary, marginTop: 1 }}>
          {ordinalDay(commitment.expense.due_day)}
          {resolved ? ` · ${commitment.isWaived ? t('status.waived') : t('status.paid')}` : ''}
        </Text>
      </View>
      <Text style={{ fontSize: typography.sm, fontWeight: typography.bold, color: resolved ? colors.textTertiary : colors.textPrimary, textDecorationLine: resolved ? 'line-through' : 'none' }}>
        {formatCurrency(commitment.amount)}
      </Text>
    </View>
  );
};

// ─── CycleCard ────────────────────────────────────────────────────────────────

const CycleCard = ({ cycle, isExpanded, onToggle }: {
  cycle: TransferCycle;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();

  const paidRatio = cycle.totalNeeded > 0 ? cycle.totalSettled / cycle.totalNeeded : 0;
  const isFullyCovered = cycle.manualTransfer === 0;

  const accentColor = isFullyCovered ? colors.success : colors.warning;

  return (
    <View style={{
      backgroundColor: colors.surface, borderRadius: radius.xxl,
      overflow: 'hidden', ...shadows.card, borderWidth: 1, borderColor: colors.border,
    }}>
      {/* Header */}
      <TouchableOpacity onPress={onToggle} activeOpacity={0.75} style={{ padding: spacing.xl, gap: spacing.md }}>
        {/* Cycle label row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ gap: 3 }}>
            <Text style={{ fontSize: typography.xs, fontWeight: typography.bold, color: colors.textTertiary, letterSpacing: 1, textTransform: 'uppercase' }}>
              {t('transfer.cycleLabel', { n: cycle.cycleNumber })}
            </Text>
            <Text style={{ fontSize: typography.sm, fontWeight: typography.semibold, color: colors.textSecondary }}>
              {t('transfer.transferOnThe', { day: cycle.transferDay })} · {t('transfer.window', { range: cycle.windowLabel })}
            </Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textDisabled}
          />
        </View>

        {/* Hero amount */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: typography.xs, color: colors.textTertiary, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            {isFullyCovered
              ? t('transfer.covered')
              : t('transfer.transferNeeded')}
          </Text>
          <GlowText
            intensity={isFullyCovered ? 'none' : 'subtle'}
            style={{
              fontSize: 36, fontWeight: typography.extrabold,
              color: accentColor, letterSpacing: -1.5, lineHeight: 42,
            }}
          >
            {isFullyCovered ? t('transfer.allCovered') : formatCurrency(cycle.manualTransfer)}
          </GlowText>
        </View>

        {/* Progress bar */}
        <FlowBar ratio={paidRatio} state={isFullyCovered ? 'idle' : 'flowing'} height={6} />

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.success }} />
            <Text style={{ fontSize: typography.xs, color: colors.textSecondary, fontWeight: typography.medium }}>
              {formatCurrency(cycle.totalSettled)} {t('transfer.settled')}
            </Text>
          </View>
          {cycle.incomeTotal > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.primary }} />
              <Text style={{ fontSize: typography.xs, color: colors.textSecondary, fontWeight: typography.medium }}>
                {formatCurrency(cycle.incomeTotal)} {t('transfer.income')}
              </Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.border }} />
            <Text style={{ fontSize: typography.xs, color: colors.textSecondary, fontWeight: typography.medium }}>
              {cycle.commitments.length} {t('common.commitments', { count: cycle.commitments.length })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded detail */}
      {isExpanded && (
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.md }}>
          {/* Math breakdown */}
          <View style={{
            backgroundColor: colors.surfaceAlt, borderRadius: radius.lg,
            padding: spacing.base, gap: 2,
          }}>
            <Text style={{ fontSize: typography.xs, fontWeight: typography.bold, color: colors.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
              {t('transfer.mathTitle')}
            </Text>
            <CycleMathRow label={t('transfer.mathCommitments')} amount={cycle.totalNeeded} />
            {cycle.totalSettled > 0 && (
              <CycleMathRow label={`− ${t('transfer.mathSettled')}`} amount={cycle.totalSettled} color={colors.success} />
            )}
            {cycle.incomeTotal > 0 && cycle.incomeInWindow.map((inc) => (
              <CycleMathRow
                key={inc.name + inc.day}
                label={`− ${inc.name} (${t('transfer.dayShort')}${inc.day})`}
                amount={inc.amount}
                color={colors.primary}
              />
            ))}
            <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: 4 }} />
            <CycleMathRow
              label={t('transfer.mathTransfer')}
              amount={cycle.manualTransfer}
              color={cycle.manualTransfer > 0 ? colors.warning : colors.success}
              isTotal
            />
          </View>

          {/* Commitment list */}
          {cycle.commitments.length > 0 && (
            <View>
              <Text style={{ fontSize: typography.xs, fontWeight: typography.bold, color: colors.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>
                {t('transfer.commitmentsTitle')}
              </Text>
              {cycle.commitments.map((c) => (
                <CommitmentLine key={c.expense.id} commitment={c} />
              ))}
            </View>
          )}

          {cycle.commitments.length === 0 && (
            <Text style={{ fontSize: typography.sm, color: colors.textTertiary, textAlign: 'center', paddingVertical: spacing.md }}>
              {t('transfer.noCommitmentsInWindow')}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TransferScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { monthYear } = useFormatDate();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [expanded, setExpanded] = useState<1 | 2 | null>(1);

  const formatCurrency = useFormatCurrency();
  const { incomes, loading: incomesLoading, reload: reloadIncomes } = useRecurringIncomes();
  const { expenses, nextExpenses, loading: cyclesLoading, reload: reloadCycles } =
    useTransferCycles(month, year);

  const loading = incomesLoading || cyclesLoading;

  const [cycle1, cycle2] = useMemo(() => {
    if (loading) return [null, null];
    return computeTransferCycles(month, year, expenses, nextExpenses, incomes);
  }, [loading, month, year, expenses, nextExpenses, incomes]);

  const reload = () => { reloadIncomes(); reloadCycles(); };

  const totalTransfer = (cycle1?.manualTransfer ?? 0) + (cycle2?.manualTransfer ?? 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.teal} />}
      >
        {/* Header */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.screenTitle}>{t('transfer.title')}</Text>
            <Text style={styles.screenSub}>{monthYear(new Date(year, month - 1, 1))}</Text>
          </View>
        </View>

        <MonthSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.content}>
            {/* Month summary strip */}
            {(cycle1 || cycle2) && (
              <View style={styles.summaryStrip}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryLabel}>{t('transfer.monthTransfer')}</Text>
                  <Text style={[styles.summaryAmount, { color: totalTransfer > 0 ? colors.warning : colors.success }]}>
                    {totalTransfer === 0 ? t('transfer.allCovered') : formatCurrency(totalTransfer)}
                  </Text>
                </View>
                <View style={{ width: 1, backgroundColor: colors.divider, marginHorizontal: spacing.md }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryLabel}>{t('transfer.totalPersonal')}</Text>
                  <Text style={styles.summaryAmount}>
                    {formatCurrency((cycle1?.totalNeeded ?? 0) + (cycle2?.totalNeeded ?? 0))}
                  </Text>
                </View>
              </View>
            )}

            {/* Cycle cards */}
            {cycle1 && (
              <CycleCard
                cycle={cycle1}
                isExpanded={expanded === 1}
                onToggle={() => setExpanded(expanded === 1 ? null : 1)}
              />
            )}
            {cycle2 && (
              <CycleCard
                cycle={cycle2}
                isExpanded={expanded === 2}
                onToggle={() => setExpanded(expanded === 2 ? null : 2)}
              />
            )}

            {/* Info footer */}
            <View style={styles.infoFooter}>
              <Ionicons name="information-circle-outline" size={14} color={colors.textDisabled} />
              <Text style={styles.infoText}>{t('transfer.footerNote')}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.base, paddingBottom: spacing.xxxl, gap: spacing.base },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingTop: spacing.md,
  },
  screenTitle: {
    fontSize: typography.xl, fontWeight: typography.bold,
    color: colors.textPrimary, letterSpacing: -0.3,
  },
  screenSub: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  content: { gap: spacing.base },
  summaryStrip: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.base, flexDirection: 'row', alignItems: 'center',
    ...shadows.card, borderWidth: 1, borderColor: colors.border,
  },
  summaryLabel: {
    fontSize: typography.xs, fontWeight: typography.semibold,
    color: colors.textTertiary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4,
  },
  summaryAmount: {
    fontSize: typography.lg, fontWeight: typography.bold,
    color: colors.textPrimary, letterSpacing: -0.5,
  },
  infoFooter: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs,
    paddingHorizontal: spacing.xs, paddingTop: spacing.xs,
  },
  infoText: {
    flex: 1, fontSize: typography.xs, color: colors.textDisabled, lineHeight: 18,
  },
});
