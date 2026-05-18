import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing, radius, shadows } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { MonthlySummary } from '../types';
import { useFormatCurrency } from '../utils/dateUtils';
import { useTranslation } from 'react-i18next';
import { useEnergyState } from '../utils/energyState';
import { FlowBar } from './ui/FlowBar';
import { GlowText } from './ui/GlowText';

interface Props {
  summary: MonthlySummary;
}

export const SummaryCard = ({ summary }: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const energyState = useEnergyState();

  const ratio = summary.total > 0 ? summary.totalPaid / summary.total : 0;
  const progressPct = ratio * 100;
  const energyResult = energyState({ ratio });

  return (
    <View style={styles.card}>
      {/* Total Flow */}
      <View style={styles.totalRow}>
        <View>
          <Text style={styles.totalLabel}>{t('flow.totalFlow')}</Text>
          <GlowText intensity="soft" style={styles.totalAmount}>{formatCurrency(summary.total)}</GlowText>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{t('common.commitments', { count: summary.expenseCount })}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarWrapper}>
        <FlowBar ratio={ratio} state={energyResult.state} height={8} />
      </View>
      <Text style={styles.progressLabel}>
        {t('overview.progressLabel', { pct: progressPct.toFixed(0), paid: summary.paidCount, total: summary.expenseCount })}
      </Text>

      {/* Completed / Unallocated breakdown */}
      <View style={styles.row}>
        <View style={[styles.pill, styles.paidPill]}>
          <View style={[styles.dot, { backgroundColor: colors.success }]} />
          <View>
            <Text style={styles.pillLabel}>{t('status.completed')}</Text>
            <Text style={[styles.pillAmount, { color: colors.success }]}>
              {formatCurrency(summary.totalPaid)}
            </Text>
          </View>
        </View>

        <View style={[styles.pill, styles.unpaidPill]}>
          <View style={[styles.dot, { backgroundColor: colors.danger }]} />
          <View>
            <Text style={styles.pillLabel}>{t('overview.unallocated')}</Text>
            <Text style={[styles.pillAmount, { color: colors.danger }]}>
              {formatCurrency(summary.totalUnpaid)}
            </Text>
          </View>
        </View>
      </View>

      {/* Personal / Business split */}
      {(summary.personalTotal > 0 || summary.businessTotal > 0) && (
        <View style={[styles.row, { marginTop: spacing.sm }]}>
          <View style={[styles.pill, styles.personalPill]}>
            <View style={[styles.dot, { backgroundColor: colors.personal }]} />
            <View>
              <Text style={styles.pillLabel}>{t('commitments.personal')}</Text>
              <Text style={[styles.pillAmount, { color: colors.personal }]}>
                {formatCurrency(summary.personalTotal)}
              </Text>
            </View>
          </View>

          <View style={[styles.pill, styles.businessPill]}>
            <View style={[styles.dot, { backgroundColor: colors.business }]} />
            <View>
              <Text style={styles.pillLabel}>{t('commitments.business')}</Text>
              <Text style={[styles.pillAmount, { color: colors.business }]}>
                {formatCurrency(summary.businessTotal)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const makeStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.md },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md },
  totalLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
    marginBottom: 2 },
  totalAmount: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.textPrimary },
  countBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4 },
  countText: {
    fontSize: typography.xs,
    color: colors.primary,
    fontWeight: typography.semibold },
  progressBarWrapper: {
    marginBottom: spacing.xs },
  progressLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    gap: spacing.sm },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    padding: spacing.sm },
  paidPill: {
    backgroundColor: colors.successLight },
  unpaidPill: {
    backgroundColor: colors.dangerLight },
  personalPill: {
    backgroundColor: colors.personalLight },
  businessPill: {
    backgroundColor: colors.businessLight },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4 },
  pillLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary },
  pillAmount: {
    fontSize: typography.sm,
    fontWeight: typography.semibold } });
