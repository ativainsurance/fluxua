import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  SectionList,
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
  useFormatDate,
  useFormatCurrency,
  getWeeklyBreakdown,
  getCurrentWeekIndex,
} from '../utils/dateUtils';
import { typography, spacing, radius, shadows } from '../theme';
import { ExpenseCard } from '../components/ExpenseCard';
import { PaidAmountModal } from '../components/PaidAmountModal';
import { CardPaymentsModal } from '../components/CardPaymentsModal';
import { MonthSelector } from '../components/MonthSelector';
import { ExpenseWithRecord, ExpenseType, BudgetBucket } from '../types';

type TabType = 'all' | ExpenseType | 'cards';
type CardSubFilter = 'all' | ExpenseType;

interface PendingPaid {
  expense: ExpenseWithRecord;
  isPaid: boolean;
}

const BUCKETS: BudgetBucket[] = ['needs', 'wants', 'debt'];

const BUCKET_COLORS: Record<BudgetBucket, string> = {
  needs: '#2563EB',
  wants: '#0D9488',
  debt:  '#D97706',
};

const BUCKET_ICON: Record<BudgetBucket, string> = {
  needs: 'home-outline',
  wants: 'heart-outline',
  debt:  'trending-up-outline',
};

export default function ExpensesScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { monthYear } = useFormatDate();
  const formatCurrency = useFormatCurrency();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<any>();

  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [cardSubFilter, setCardSubFilter] = useState<CardSubFilter>('all');
  const [pendingPaid, setPendingPaid] = useState<PendingPaid | null>(null);
  const [paymentModalExpense, setPaymentModalExpense] = useState<ExpenseWithRecord | null>(null);

  const { expenses, summary, bucketTotals, loading, reload, markAsPaid, removeExpense, excludeFromMonth, waiveExpense, addCardPayment, deleteCardPayment } =
    useExpenses(month, year);

  const isCurrentMonth = month === currentMonth && year === currentYear;
  const currentWeekIdx = getCurrentWeekIndex(month, year);

  // Filter by active tab — All/Personal/Business exclude cards; Cards has own sub-filter
  const filtered = expenses.filter((e) => {
    if (activeTab === 'cards') {
      if (!e.is_variable_amount) return false;
      if (cardSubFilter === 'all') return true;
      return e.type === cardSubFilter;
    }
    if (e.is_variable_amount) return false; // cards excluded from non-card tabs
    if (activeTab === 'all') return true;
    return e.type === activeTab;
  });

  // Compute per-tab total (planned amounts for the filtered set)
  const tabTotal = useMemo(
    () => filtered.reduce((sum, e) => {
      const planned = e.is_variable_amount
        ? (e.record?.statement_balance ?? e.amount)
        : e.amount;
      return sum + planned;
    }, 0),
    [filtered]
  );

  // Build sections: group filtered expenses by bucket, skip empty buckets
  const sections = useMemo(() => {
    const byBucket: Record<BudgetBucket, ExpenseWithRecord[]> = {
      needs: [],
      wants: [],
      debt: [],
    };
    filtered.forEach((e) => {
      const bucket = (e.budget_bucket ?? 'needs') as BudgetBucket;
      byBucket[bucket].push(e);
    });

    return BUCKETS
      .map((bucket) => {
        const items = byBucket[bucket];
        const subtotal = items.reduce((sum, e) => {
          const planned = e.is_variable_amount
            ? (e.record?.statement_balance ?? e.amount)
            : e.amount;
          return sum + planned;
        }, 0);
        const settled = items
          .filter((e) => e.record?.is_paid || e.record?.is_waived)
          .reduce((sum, e) => {
            const planned = e.is_variable_amount
              ? (e.record?.statement_balance ?? e.amount)
              : e.amount;
            return sum + planned;
          }, 0);
        return { bucket, data: items, subtotal, remaining: subtotal - settled };
      })
      .filter((s) => s.data.length > 0);
  }, [filtered]);

  const handleTogglePaid = (expense: ExpenseWithRecord, isPaid: boolean) => {
    if (isPaid) {
      setPendingPaid({ expense, isPaid });
    } else {
      markAsPaid(expense, false);
    }
  };

  const currentModalExpense = paymentModalExpense
    ? expenses.find((e) => e.id === paymentModalExpense.id) ?? paymentModalExpense
    : null;

  const getWeeklyAllocation = (expense: ExpenseWithRecord): number | undefined => {
    if (currentWeekIdx < 0) return undefined;
    const effectiveAmount = expense.is_variable_amount
      ? (expense.record?.statement_balance ?? expense.amount)
      : expense.amount;
    const weeks = getWeeklyBreakdown(effectiveAmount, month, year);
    return weeks[currentWeekIdx]?.amount;
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: t('commitments.all') },
    { key: 'personal', label: t('commitments.personal') },
    { key: 'business', label: t('commitments.business') },
    { key: 'cards', label: t('commitments.cards') },
  ];

  const tabColor = (tab: TabType) => {
    if (tab === 'personal') return colors.personal;
    if (tab === 'business') return colors.business;
    if (tab === 'cards') return colors.charged;
    return colors.primary;
  };

  const bucketLabel = (bucket: BudgetBucket) => {
    if (bucket === 'needs') return t('commitments.bucketNeeds');
    if (bucket === 'wants') return t('commitments.bucketWants');
    return t('commitments.bucketDebt');
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

      {/* Tabs: All / Personal / Business / Cards */}
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

      {/* Cards sub-filter: Personal / All / Business */}
      {activeTab === 'cards' && (
        <View style={[styles.tabs, { marginTop: -spacing.xs }]}>
          {(['all', 'personal', 'business'] as CardSubFilter[]).map((sf) => {
            const active = cardSubFilter === sf;
            const sfColor = sf === 'personal' ? colors.personal : sf === 'business' ? colors.business : colors.charged;
            return (
              <TouchableOpacity
                key={sf}
                style={[
                  styles.tab,
                  { flex: undefined, paddingHorizontal: spacing.base },
                  active && { backgroundColor: sfColor, borderColor: sfColor },
                ]}
                onPress={() => setCardSubFilter(sf)}
              >
                <Text style={[styles.tabText, active ? styles.tabTextActive : { color: colors.textSecondary }]}>
                  {sf === 'all' ? t('commitments.all') : sf === 'personal' ? t('commitments.personal') : t('commitments.business')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Tab-level total */}
      {!loading && filtered.length > 0 && (
        <View style={styles.tabTotalRow}>
          <Text style={styles.tabTotalLabel}>{t('commitments.tabTotalLabel')}</Text>
          <Text style={styles.tabTotalAmount}>{formatCurrency(tabTotal)}</Text>
        </View>
      )}

      {/* Sectioned list */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            sections.length === 0 && styles.listEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.primary} />
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <View style={[styles.bucketDot, { backgroundColor: BUCKET_COLORS[section.bucket] }]} />
                <Ionicons
                  name={BUCKET_ICON[section.bucket] as any}
                  size={14}
                  color={BUCKET_COLORS[section.bucket]}
                />
                <Text style={[styles.sectionHeaderLabel, { color: BUCKET_COLORS[section.bucket] }]}>
                  {bucketLabel(section.bucket).toUpperCase()}
                </Text>
              </View>
              {section.subtotal > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  {section.remaining > 0 && section.remaining < section.subtotal && (
                    <Text style={[styles.sectionHeaderSubtotal, { color: colors.warning, fontSize: typography.xs }]}>
                      {formatCurrency(section.remaining)} {t('commitments.remaining')}
                    </Text>
                  )}
                  {section.remaining === 0 && section.subtotal > 0 && (
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  )}
                  <Text style={styles.sectionHeaderSubtotal}>
                    {formatCurrency(section.subtotal)}
                  </Text>
                </View>
              )}
            </View>
          )}
          renderItem={({ item }) => (
            <ExpenseCard
              expense={item}
              onTogglePaid={handleTogglePaid}
              weeklyAllocation={isCurrentMonth ? getWeeklyAllocation(item) : undefined}
              onEdit={(e) => navigation.navigate('AddExpense', { expense: e })}
              onDelete={(e) => removeExpense(e.id)}
              onExcludeFromMonth={(e) => excludeFromMonth(e)}
              onWaive={(e) => waiveExpense(e)}
              onManagePayments={(e) => setPaymentModalExpense(e)}
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
                    : activeTab === 'business'
                      ? t('commitments.noBusinessCommitments')
                      : t('commitments.noCardsCommitments')}
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
        plannedAmount={
          pendingPaid?.expense.is_variable_amount
            ? (pendingPaid?.expense.record?.statement_balance ?? pendingPaid?.expense.amount ?? 0)
            : (pendingPaid?.expense.amount ?? 0)
        }
        monthLabel={monthYear(new Date(year, month - 1, 1))}
        onConfirm={(actualAmount, lateFee, creditAmount) => {
          if (pendingPaid) markAsPaid(pendingPaid.expense, true, actualAmount, lateFee, creditAmount);
          setPendingPaid(null);
        }}
        onSkip={() => {
          if (pendingPaid) {
            const effectiveAmt = pendingPaid.expense.is_variable_amount
              ? (pendingPaid.expense.record?.statement_balance ?? pendingPaid.expense.amount)
              : pendingPaid.expense.amount;
            markAsPaid(pendingPaid.expense, true, effectiveAmt);
          }
          setPendingPaid(null);
        }}
        onCancel={() => setPendingPaid(null)}
      />

      {currentModalExpense && (
        <CardPaymentsModal
          visible={paymentModalExpense !== null}
          expense={currentModalExpense}
          month={month}
          year={year}
          onClose={() => setPaymentModalExpense(null)}
          onAddPayment={addCardPayment}
          onDeletePayment={deleteCardPayment}
        />
      )}
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
  tabTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  tabTotalLabel: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  tabTotalAmount: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bucketDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionHeaderLabel: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    letterSpacing: 1.0,
  },
  sectionHeaderSubtotal: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
  },
  list: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxxl,
  },
  listEmpty: {
    flexGrow: 1,
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
