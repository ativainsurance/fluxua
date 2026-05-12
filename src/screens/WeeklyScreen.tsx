import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useExpenses } from '../hooks/useExpenses';
import { getCurrentMonthYear, formatCurrency, getWeeklyBreakdown, getShortMonthName } from '../utils/dateUtils';
import { colors, typography, spacing, radius, shadows } from '../theme';
import { MonthSelector } from '../components/MonthSelector';
import { WeeklyBreakdown } from '../components/WeeklyBreakdown';

export default function WeeklyScreen() {
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const { expenses, summary, loading, reload } = useExpenses(month, year);

  // Aggregate all expenses into a combined weekly breakdown
  const totalWeeklyBreakdown = getWeeklyBreakdown(
    summary.total,
    month,
    year,
    getShortMonthName(month)
  );

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
          <Text style={styles.title}>Weekly Breakdown</Text>
          <Text style={styles.subtitle}>
            How much to set aside each week to cover your bills
          </Text>
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
        ) : (
          <>
            {/* Total weekly overview */}
            {summary.total > 0 && (
              <View style={styles.overviewCard}>
                <Text style={styles.overviewTitle}>All Expenses Combined</Text>
                <Text style={styles.overviewSub}>
                  Total monthly: {formatCurrency(summary.total)}
                </Text>
                <View style={styles.weekGrid}>
                  {totalWeeklyBreakdown.map((week) => (
                    <View key={week.week} style={styles.weekCell}>
                      <Text style={styles.weekCellLabel}>{week.label.split('·')[0].trim()}</Text>
                      <Text style={styles.weekCellAmount}>{formatCurrency(week.amount)}</Text>
                      <Text style={styles.weekCellDays}>
                        {getShortMonthName(month)} {week.startDay}–{week.endDay}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Per-expense breakdowns */}
            {expenses.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Per-Expense Breakdown</Text>
                {expenses.map((expense) => (
                  <WeeklyBreakdown
                    key={expense.id}
                    expense={expense}
                    month={month}
                    year={year}
                  />
                ))}
              </View>
            )}

            {/* Empty state */}
            {expenses.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No expenses this month</Text>
                <Text style={styles.emptyText}>
                  Add expenses in the Expenses tab to see your weekly breakdown here.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
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
    paddingTop: spacing.md,
  },
  title: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  center: {
    paddingTop: spacing.xxxl,
    alignItems: 'center',
  },
  overviewCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  overviewTitle: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: '#fff',
    marginBottom: 4,
  },
  overviewSub: {
    fontSize: typography.sm,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing.md,
  },
  weekGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  weekCell: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.md,
    padding: spacing.md,
    minWidth: '45%',
    flex: 1,
  },
  weekCellLabel: {
    fontSize: typography.xs,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: typography.medium,
  },
  weekCellAmount: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: '#fff',
    marginVertical: 2,
  },
  weekCellDays: {
    fontSize: typography.xs,
    color: 'rgba(255,255,255,0.6)',
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
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
});
