import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../theme';
import { MonthlySummary } from '../types';
import { formatCurrency } from '../utils/dateUtils';

interface Props {
  summary: MonthlySummary;
}

export const SummaryCard = ({ summary }: Props) => {
  const progressPct =
    summary.total > 0 ? (summary.totalPaid / summary.total) * 100 : 0;

  return (
    <View style={styles.card}>
      {/* Total Flow */}
      <View style={styles.totalRow}>
        <View>
          <Text style={styles.totalLabel}>Total Flow</Text>
          <Text style={styles.totalAmount}>{formatCurrency(summary.total)}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{summary.expenseCount} commitments</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>
      <Text style={styles.progressLabel}>
        {progressPct.toFixed(0)}% completed ({summary.paidCount}/{summary.expenseCount})
      </Text>

      {/* Completed / Unallocated breakdown */}
      <View style={styles.row}>
        <View style={[styles.pill, styles.paidPill]}>
          <View style={[styles.dot, { backgroundColor: colors.success }]} />
          <View>
            <Text style={styles.pillLabel}>Completed</Text>
            <Text style={[styles.pillAmount, { color: colors.success }]}>
              {formatCurrency(summary.totalPaid)}
            </Text>
          </View>
        </View>

        <View style={[styles.pill, styles.unpaidPill]}>
          <View style={[styles.dot, { backgroundColor: colors.danger }]} />
          <View>
            <Text style={styles.pillLabel}>Unallocated</Text>
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
              <Text style={styles.pillLabel}>Personal</Text>
              <Text style={[styles.pillAmount, { color: colors.personal }]}>
                {formatCurrency(summary.personalTotal)}
              </Text>
            </View>
          </View>

          <View style={[styles.pill, styles.businessPill]}>
            <View style={[styles.dot, { backgroundColor: colors.business }]} />
            <View>
              <Text style={styles.pillLabel}>Business</Text>
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  totalLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  countBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  countText: {
    fontSize: typography.xs,
    color: colors.primary,
    fontWeight: typography.semibold,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: radius.full,
  },
  progressLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  paidPill: {
    backgroundColor: colors.successLight,
  },
  unpaidPill: {
    backgroundColor: colors.dangerLight,
  },
  personalPill: {
    backgroundColor: colors.personalLight,
  },
  businessPill: {
    backgroundColor: colors.businessLight,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  pillAmount: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
});
