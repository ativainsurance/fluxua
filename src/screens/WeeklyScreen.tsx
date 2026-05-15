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
import { useTranslation } from 'react-i18next';

import { useExpenses } from '../hooks/useExpenses';
import { getCurrentMonthYear, useFormatCurrency, useFormatDate, getWeeklyBreakdown } from '../utils/dateUtils';
import {  typography, spacing, radius, shadows } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { MonthSelector } from '../components/MonthSelector';
import { WeeklyBreakdown } from '../components/WeeklyBreakdown';

export default function WeeklyScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const { dateRange } = useFormatDate();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const { expenses, summary, loading, reload } = useExpenses(month, year);

  // Aggregate all expenses into a combined weekly breakdown
  const totalWeeklyBreakdown = getWeeklyBreakdown(summary.total, month, year);

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
          <Text style={styles.title}>{t('flow.title')}</Text>
          <Text style={styles.subtitle}>{t('flow.subtitle')}</Text>
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
                <Text style={styles.overviewTitle}>{t('flow.allExpensesCombined')}</Text>
                <Text style={styles.overviewSub}>
                  {t('flow.totalMonthly')} {formatCurrency(summary.total)}
                </Text>
                <View style={styles.weekGrid}>
                  {totalWeeklyBreakdown.map((week) => (
                    <View key={week.week} style={styles.weekCell}>
                      <Text style={styles.weekCellLabel}>{t('flow.week', { n: week.week })}</Text>
                      <Text style={styles.weekCellAmount}>{formatCurrency(week.amount)}</Text>
                      <Text style={styles.weekCellDays}>
                        {dateRange(new Date(year, month - 1, week.startDay), new Date(year, month - 1, week.endDay))}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Per-expense breakdowns */}
            {expenses.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('flow.perExpenseBreakdown')}</Text>
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
                <Text style={styles.emptyTitle}>{t('flow.noExpensesTitle')}</Text>
                <Text style={styles.emptyText}>{t('flow.noExpensesText')}</Text>
              </View>
            )}
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
    color: colors.textInverse,
    marginBottom: 4,
  },
  overviewSub: {
    fontSize: typography.sm,
    color: 'rgba(250,250,247,0.7)',
    marginBottom: spacing.md,
  },
  weekGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  weekCell: {
    backgroundColor: 'rgba(250,250,247,0.15)',
    borderRadius: radius.md,
    padding: spacing.md,
    minWidth: '45%',
    flex: 1,
  },
  weekCellLabel: {
    fontSize: typography.xs,
    color: 'rgba(250,250,247,0.7)',
    fontWeight: typography.medium,
  },
  weekCellAmount: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textInverse,
    marginVertical: 2,
  },
  weekCellDays: {
    fontSize: typography.xs,
    color: 'rgba(250,250,247,0.6)',
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
