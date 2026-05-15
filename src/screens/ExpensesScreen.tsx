import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../contexts/ThemeContext';
import { useExpenses } from '../hooks/useExpenses';
import {
  getCurrentMonthYear,
  getMonthName,
  getWeeklyBreakdown,
  getCurrentWeekIndex,
} from '../utils/dateUtils';
import {typography, spacing, radius, shadows } from '../theme';
import { ExpenseCard } from '../components/ExpenseCard';
import { PaidAmountModal } from '../components/PaidAmountModal';
import { MonthSelector } from '../components/MonthSelector';
import { ExpenseWithRecord, ExpenseType } from '../types';

type TabType = 'all' | ExpenseType;

interface PendingPaid {
  expense: ExpenseWithRecord;
  isPaid: boolean;
}

export default function ExpensesScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<any>();

  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [pendingPaid, setPendingPaid] = useState<PendingPaid | null>(null);

  const { expenses, summary, loading, reload, markAsPaid, removeExpense, excludeFromMonth, waiveExpense } =
    useExpenses(month, year);

  const isCurrentMonth = month === currentMonth && year === currentYear;
  const currentWeekIdx = getCurrentWeekIndex(month, year);

  const filtered = expenses.filter((e) =>
    activeTab === 'all' ? true : e.type === activeTab
  );

  const handleTogglePaid = (expense: ExpenseWithRecord, isPaid: boolean) => {
    if (isPaid) {
      // Marking as paid — open modal to enter actual amount
      setPendingPaid({ expense, isPaid });
    } else {
      // Unchecking a paid expense — clear immediately (no dialog, works on web)
      markAsPaid(expense, false);
    }
  };

  /** Weekly allocation for a commitment in the current/selected week */
  const getWeeklyAllocation = (expense: ExpenseWithRecord): number | undefined => {
    if (currentWeekIdx < 0) return undefined;
    const weeks = getWeeklyBreakdown(expense.amount, month, year);
    return weeks[currentWeekIdx]?.amount;
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: t('commitments.all') },
    { key: 'personal', label: t('commitments.personal') },
    { key: 'business', label: t('commitments.business') },
  ];

  const tabColor = (tab: TabType) => {
    if (tab === 'personal') return colors.personal;
    if (tab === 'business') return colors.business;
    return colors.primary;
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('commitments.title')}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddExpense')}
        >
          <Ionicons name="add" size={22} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Month selector */}
      <MonthSelector
        month={month}
        year={year}
        onChange={(m, y) => { setMonth(m); setYear(y); }}
      />

      {/* Summary strip */}
      <View style={styles.stripRow}>
        <View style={[styles.strip, { backgroundColor: colors.successLight }]}>
          <Text style={[styles.stripAmt, { color: colors.success }]}>
            {t('commitments.completed', { count: summary.paidCount })}
          </Text>
        </View>
        <View style={[styles.strip, { backgroundColor: colors.dangerLight }]}>
          <Text style={[styles.stripAmt, { color: colors.danger }]}>
            {t('commitments.unallocated', { count: summary.expenseCount - summary.paidCount })}
          </Text>
        </View>
      </View>

      {/* Tabs: All / Personal / Business */}
      <View style={styles.tabs}>
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                active && {
                  backgroundColor: tabColor(tab.key),
                  borderColor: tabColor(tab.key),
                },
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  active ? styles.tabTextActive : { color: colors.textSecondary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <ExpenseCard
              expense={item}
              onTogglePaid={handleTogglePaid}
              weeklyAllocation={isCurrentMonth ? getWeeklyAllocation(item) : undefined}
              onEdit={(e) => navigation.navigate('AddExpense', { expense: e })}
              onDelete={(e) => removeExpense(e.id)}
              onExcludeFromMonth={(e) => excludeFromMonth(e)}
              onWaive={(e) => waiveExpense(e)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={40} color={colors.textDisabled} />
              <Text style={styles.emptyText}>
                {activeTab === 'all'
                  ? t('commitments.noCommitmentsTitle')
                  : activeTab === 'personal'
                    ? t('commitments.noPersonalCommitments')
                    : t('commitments.noBusinessCommitments')}
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('AddExpense')}
              >
                <Text style={styles.emptyBtnText}>{t('commitments.addCommitment')}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

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

const makeStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  title: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  stripRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  strip: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  stripAmt: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
  },
  tabTextActive: {
    color: colors.textInverse,
    fontWeight: typography.semibold,
  },
  list: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxxl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  emptyBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  emptyBtnText: {
    color: colors.textInverse,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
});
