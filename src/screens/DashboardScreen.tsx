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
  getDayOrdinal,
} from '../utils/dateUtils';
import { typography, spacing, radius, shadows } from '../theme';
import { MonthSelector } from '../components/MonthSelector';
import { PaidAmountModal } from '../components/PaidAmountModal';
import { ExpenseWithRecord, getCategoryIcon, getCategoryLabel, CATEGORY_LABELS } from '../types';

// ─────────────────────────────────────────────
// Module-level constants (no hook access here — hex only)
// ─────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { accent: string; bg: string; darkBg: string }> = {
  housing:       { accent: '#3B82F6', bg: '#EFF6FF',  darkBg: 'rgba(59,130,246,0.18)'  },
  utilities:     { accent: '#F59E0B', bg: '#FFFBEB',  darkBg: 'rgba(245,158,11,0.18)'  },
  transport:     { accent: '#10B981', bg: '#ECFDF5',  darkBg: 'rgba(16,185,129,0.18)'  },
  food:          { accent: '#EF4444', bg: '#FEF2F2',  darkBg: 'rgba(239,68,68,0.18)'   },
  health:        { accent: '#EC4899', bg: '#FDF2F8',  darkBg: 'rgba(236,72,153,0.18)'  },
  subscriptions: { accent: '#8B5CF6', bg: '#F5F3FF',  darkBg: 'rgba(139,92,246,0.18)'  },
  education:     { accent: '#06B6D4', bg: '#ECFEFF',  darkBg: 'rgba(6,182,212,0.18)'   },
  entertainment: { accent: '#F97316', bg: '#FFF7ED',  darkBg: 'rgba(249,115,22,0.18)'  },
  insurance:     { accent: '#6366F1', bg: '#EEF2FF',  darkBg: 'rgba(99,102,241,0.18)'  },
  savings:       { accent: '#14B8A6', bg: '#F0FDFA',  darkBg: 'rgba(20,184,166,0.18)'  },
  business:      { accent: '#0EA5E9', bg: '#F0F9FF',  darkBg: 'rgba(14,165,233,0.18)'  },
  other:         { accent: '#94A3B8', bg: '#F8FAFC',  darkBg: 'rgba(148,163,184,0.18)' },
};

const getCategoryColor = (category: string) =>
  CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other;

// STATUS_ACCENT uses warm editorial semantic colors
// NOTE: these are light-mode hardcodes; dark mode derives from the ThemeContext per-component
const STATUS_ACCENT_LIGHT: Record<string, { accent: string; bg: string; label: string; icon: string }> = {
  paid:       { accent: '#5A8260', bg: 'rgba(90,130,96,0.12)', label: 'Completed', icon: 'checkmark-circle'  },
  waived:     { accent: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', label: 'Waived',   icon: 'gift-outline'      },
  overdue:    { accent: '#8E4530', bg: 'rgba(142,69,48,0.12)', label: 'Overdue',   icon: 'alert-circle'      },
  'due-soon': { accent: '#A85F40', bg: 'rgba(168,95,64,0.12)', label: 'Due Soon',  icon: 'time'              },
  upcoming:   { accent: '#9C968D', bg: 'rgba(156,150,141,0.10)', label: 'Upcoming', icon: 'calendar-outline' },
};

const STATUS_ACCENT_DARK: Record<string, { accent: string; bg: string; label: string; icon: string }> = {
  paid:       { accent: '#7FA582', bg: 'rgba(127,165,130,0.15)', label: 'Completed', icon: 'checkmark-circle'  },
  waived:     { accent: '#A78BFA', bg: 'rgba(167,139,250,0.15)', label: 'Waived',    icon: 'gift-outline'      },
  overdue:    { accent: '#B85C3F', bg: 'rgba(184,92,63,0.15)',  label: 'Overdue',   icon: 'alert-circle'      },
  'due-soon': { accent: '#C97B5A', bg: 'rgba(201,123,90,0.15)', label: 'Due Soon',  icon: 'time'              },
  upcoming:   { accent: '#5C544C', bg: 'rgba(92,84,76,0.12)',   label: 'Upcoming',  icon: 'calendar-outline'  },
};

const getStatusAccent = (isDark: boolean) => isDark ? STATUS_ACCENT_DARK : STATUS_ACCENT_LIGHT;

// ─────────────────────────────────────────────
// MetricCard — premium KPI tile
// ─────────────────────────────────────────────

const MetricCard = ({
  label,
  value,
  subtitle,
  icon,
  accent,
  accentBg,
  wide = false,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: string;
  accent: string;
  accentBg: string;
  wide?: boolean;
}) => {
  const { colors } = useTheme();
  return (
    <View style={{
      flex: wide ? 2 : 1,
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.base,
      gap: spacing.sm,
      ...shadows.card,
      borderWidth: 1,
      borderColor: colors.border,
    }}>
      {/* Icon + accent strip */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{
          width: 36,
          height: 36,
          borderRadius: 11,
          backgroundColor: accentBg,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Ionicons name={icon as any} size={17} color={accent} />
        </View>
        <View style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: accent,
          opacity: 0.6,
        }} />
      </View>

      {/* Value */}
      <Text style={{
        fontSize: typography.xl,
        fontWeight: typography.extrabold,
        color: colors.textPrimary,
        letterSpacing: -0.6,
        lineHeight: 28,
      }} numberOfLines={1}>{value}</Text>

      {/* Label */}
      <View style={{ gap: 2 }}>
        <Text style={{
          fontSize: typography.xs,
          fontWeight: typography.semibold,
          color: colors.textSecondary,
          letterSpacing: 0.1,
        }}>{label}</Text>
        {subtitle ? (
          <Text style={{
            fontSize: 10,
            color: accent,
            fontWeight: typography.semibold,
            letterSpacing: 0.2,
          }}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// SplitCard — Business vs Personal breakdown
// ─────────────────────────────────────────────

const SplitCard = ({
  personalTotal,
  businessTotal,
  total,
}: {
  personalTotal: number;
  businessTotal: number;
  total: number;
}) => {
  const { colors, isDark } = useTheme();
  const barAnim = useRef(new Animated.Value(0)).current;

  const personalPct = total > 0 ? personalTotal / total : 0;
  const businessPct = total > 0 ? businessTotal / total : 0;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: 1,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [personalPct]);

  const personalWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${Math.round(personalPct * 100)}%`],
    extrapolate: 'clamp',
  });

  if (total === 0) return null;

  return (
    <View style={{
      backgroundColor: colors.navy,
      borderRadius: radius.xxl,
      padding: spacing.xl,
      gap: spacing.lg,
      overflow: 'hidden',
      ...shadows.hero,
    }}>
      {/* Ambient glow */}
      <View style={{
        position: 'absolute', top: -60, left: -40,
        width: 200, height: 200, borderRadius: 100,
        backgroundColor: colors.personal, opacity: 0.10,
      }} />
      <View style={{
        position: 'absolute', bottom: -50, right: -30,
        width: 180, height: 180, borderRadius: 90,
        backgroundColor: colors.business, opacity: 0.10,
      }} />

      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{
          fontSize: typography.sm,
          fontWeight: typography.bold,
          color: colors.textInverse,
          letterSpacing: -0.1,
        }}>Commitment Split</Text>
        <View style={{
          backgroundColor: 'rgba(250,250,247,0.08)',
          borderRadius: radius.full,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderWidth: 1,
          borderColor: 'rgba(250,250,247,0.10)',
        }}>
          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: typography.semibold }}>
            {formatCurrency(total)} total
          </Text>
        </View>
      </View>

      {/* Split bar */}
      <View style={{
        height: 10,
        borderRadius: radius.full,
        backgroundColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
        flexDirection: 'row',
      }}>
        <Animated.View style={{
          width: personalWidth,
          height: '100%',
          backgroundColor: '#818CF8',
          shadowColor: '#818CF8',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 6,
        }} />
        {/* Remaining = business (shown as different shade) */}
      </View>

      {/* Legend row */}
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        {/* Personal */}
        <View style={{
          flex: 1,
          backgroundColor: colors.personalLight,
          borderRadius: radius.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.personal + '30',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.personal }} />
            <Text style={{ fontSize: 10, color: 'rgba(244,241,234,0.50)', fontWeight: typography.semibold, letterSpacing: 0.5 }}>
              PERSONAL
            </Text>
          </View>
          <Text style={{
            fontSize: typography.lg,
            fontWeight: typography.extrabold,
            color: colors.textInverse,
            letterSpacing: -0.5,
          }}>{formatCurrency(personalTotal)}</Text>
          <Text style={{ fontSize: 11, color: 'rgba(244,241,234,0.40)', marginTop: 2 }}>
            {Math.round(personalPct * 100)}% of total
          </Text>
        </View>

        {/* Business */}
        <View style={{
          flex: 1,
          backgroundColor: colors.businessLight,
          borderRadius: radius.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.business + '30',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.business }} />
            <Text style={{ fontSize: 10, color: 'rgba(244,241,234,0.50)', fontWeight: typography.semibold, letterSpacing: 0.5 }}>
              BUSINESS
            </Text>
          </View>
          <Text style={{
            fontSize: typography.lg,
            fontWeight: typography.extrabold,
            color: colors.textInverse,
            letterSpacing: -0.5,
          }}>{formatCurrency(businessTotal)}</Text>
          <Text style={{ fontSize: 11, color: 'rgba(244,241,234,0.40)', marginTop: 2 }}>
            {Math.round(businessPct * 100)}% of total
          </Text>
        </View>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// WeekBar — single animated vertical bar
// ─────────────────────────────────────────────

const BAR_MAX_HEIGHT = 62;

const WeekBar = ({
  label,
  amount,
  maxAmount,
  paidAmount,
  accent,
  delay,
}: {
  label: string;
  amount: number;
  maxAmount: number;
  paidAmount: number;
  accent: string;
  delay: number;
}) => {
  const { colors } = useTheme();
  const totalAnim = useRef(new Animated.Value(0)).current;
  const paidAnim = useRef(new Animated.Value(0)).current;

  const targetTotal = maxAmount > 0 ? (amount / maxAmount) * BAR_MAX_HEIGHT : 0;
  const targetPaid = amount > 0 ? (paidAmount / amount) * targetTotal : 0;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(totalAnim, { toValue: targetTotal, duration: 750, delay, useNativeDriver: false }),
      Animated.timing(paidAnim, { toValue: targetPaid, duration: 750, delay: delay + 150, useNativeDriver: false }),
    ]).start();
  }, [targetTotal, targetPaid]);

  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
      {/* Amount label above bar */}
      {amount > 0 && (
        <Text style={{ fontSize: 9, color: colors.textTertiary, fontWeight: typography.semibold }}>
          {amount >= 1000 ? `$${(amount / 1000).toFixed(1)}k` : `$${Math.round(amount)}`}
        </Text>
      )}

      {/* Bar container */}
      <View style={{
        width: '70%',
        height: BAR_MAX_HEIGHT,
        justifyContent: 'flex-end',
        borderRadius: radius.sm,
        backgroundColor: colors.surfaceAlt,
        overflow: 'hidden',
      }}>
        {/* Total bar (track) */}
        <Animated.View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: totalAnim,
          backgroundColor: accent + '30',
          borderRadius: radius.sm,
        }} />
        {/* Paid portion */}
        <Animated.View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: paidAnim,
          backgroundColor: accent,
          borderRadius: radius.sm,
          shadowColor: accent,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 4,
        }} />
      </View>

      {/* Week label */}
      <Text style={{
        fontSize: 10,
        color: colors.textSecondary,
        fontWeight: typography.semibold,
        letterSpacing: 0.2,
      }}>{label}</Text>
    </View>
  );
};

// ─────────────────────────────────────────────
// WeeklyFlowChart — 4-column bar chart
// ─────────────────────────────────────────────

const WeeklyFlowChart = ({
  expenses,
  month,
  year,
}: {
  expenses: ExpenseWithRecord[];
  month: number;
  year: number;
}) => {
  const { colors } = useTheme();

  // Bucket expenses by week using due_day
  const weekBuckets = useMemo(() => {
    const buckets = [
      { label: 'Wk 1', days: '1–7',  total: 0, paid: 0 },
      { label: 'Wk 2', days: '8–14', total: 0, paid: 0 },
      { label: 'Wk 3', days: '15–21',total: 0, paid: 0 },
      { label: 'Wk 4', days: '22+',  total: 0, paid: 0 },
    ];
    expenses.forEach(e => {
      const d = e.due_day;
      const idx = d <= 7 ? 0 : d <= 14 ? 1 : d <= 21 ? 2 : 3;
      buckets[idx].total += e.amount;
      if (e.record?.is_paid || e.record?.is_waived) {
        buckets[idx].paid += e.record?.actual_amount ?? e.amount;
      }
    });
    return buckets;
  }, [expenses]);

  const maxAmount = Math.max(...weekBuckets.map(b => b.total), 1);
  const totalFlow = weekBuckets.reduce((s, b) => s + b.total, 0);

  const BAR_ACCENTS = [colors.primary, colors.teal, colors.accentMuted, colors.warning];

  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.base,
      gap: spacing.md,
      ...shadows.card,
      borderWidth: 1,
      borderColor: colors.border,
    }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{
            fontSize: typography.sm,
            fontWeight: typography.bold,
            color: colors.textPrimary,
            letterSpacing: -0.1,
          }}>Weekly Flow</Text>
          <Text style={{ fontSize: typography.xs, color: colors.textSecondary, marginTop: 2 }}>
            {getMonthName(month)} commitment schedule
          </Text>
        </View>
        <View style={{
          backgroundColor: colors.tealLight,
          borderRadius: radius.full,
          paddingHorizontal: 10,
          paddingVertical: 4,
        }}>
          <Text style={{ fontSize: 10, color: colors.teal, fontWeight: typography.bold }}>
            {formatCurrency(totalFlow)}
          </Text>
        </View>
      </View>

      {/* Bar chart */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: spacing.xs,
        paddingTop: 20,
        paddingBottom: 4,
      }}>
        {weekBuckets.map((bucket, i) => (
          <WeekBar
            key={bucket.label}
            label={bucket.label}
            amount={bucket.total}
            maxAmount={maxAmount}
            paidAmount={bucket.paid}
            accent={BAR_ACCENTS[i]}
            delay={i * 80}
          />
        ))}
      </View>

      {/* Legend */}
      <View style={{
        flexDirection: 'row',
        gap: spacing.lg,
        paddingTop: spacing.xs,
        borderTopWidth: 1,
        borderTopColor: colors.divider,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: colors.teal }} />
          <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: typography.medium }}>Covered</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border }} />
          <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: typography.medium }}>Remaining</Text>
        </View>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// CategoryBar — single animated category row
// ─────────────────────────────────────────────

const CategoryBar = ({
  category,
  amount,
  count,
  maxAmount,
  isDark,
}: {
  category: string;
  amount: number;
  count: number;
  maxAmount: number;
  isDark: boolean;
}) => {
  const { colors } = useTheme();
  const barAnim = useRef(new Animated.Value(0)).current;
  const pct = maxAmount > 0 ? amount / maxAmount : 0;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: pct,
      duration: 700,
      delay: 100,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const barWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const catColor = getCategoryColor(category);
  const iconBg = isDark ? catColor.darkBg : catColor.bg;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      {/* Icon */}
      <View style={{
        width: 36,
        height: 36,
        borderRadius: 11,
        backgroundColor: iconBg,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <Ionicons name={getCategoryIcon(category) as any} size={16} color={catColor.accent} />
      </View>

      {/* Bar + meta */}
      <View style={{ flex: 1, gap: 5 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{
            fontSize: typography.sm,
            fontWeight: typography.semibold,
            color: colors.textPrimary,
          }}>{getCategoryLabel(category)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text style={{
              fontSize: 10,
              color: colors.textTertiary,
              fontWeight: typography.medium,
            }}>{count} {count === 1 ? 'bill' : 'bills'}</Text>
            <Text style={{
              fontSize: typography.sm,
              fontWeight: typography.bold,
              color: catColor.accent,
            }}>{formatCurrency(amount)}</Text>
          </View>
        </View>
        {/* Bar track */}
        <View style={{
          height: 5,
          backgroundColor: colors.surfaceAlt,
          borderRadius: radius.full,
          overflow: 'hidden',
        }}>
          <Animated.View style={{
            height: '100%',
            width: barWidth,
            backgroundColor: catColor.accent,
            borderRadius: radius.full,
            shadowColor: catColor.accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 3,
          }} />
        </View>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// CategoryAllocation — top categories panel
// ─────────────────────────────────────────────

const CategoryAllocation = ({ expenses }: { expenses: ExpenseWithRecord[] }) => {
  const { colors, isDark } = useTheme();

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    expenses.forEach(e => {
      if (!map[e.category]) map[e.category] = { total: 0, count: 0 };
      map[e.category].total += e.amount;
      map[e.category].count++;
    });
    return Object.entries(map)
      .map(([cat, d]) => ({ category: cat, ...d }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [expenses]);

  const maxAmount = Math.max(...categoryBreakdown.map(c => c.total), 1);

  if (categoryBreakdown.length === 0) return null;

  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.base,
      gap: spacing.md,
      ...shadows.card,
      borderWidth: 1,
      borderColor: colors.border,
    }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{
          fontSize: typography.sm,
          fontWeight: typography.bold,
          color: colors.textPrimary,
          letterSpacing: -0.1,
        }}>Commitment Allocation</Text>
        <Text style={{
          fontSize: typography.xs,
          color: colors.textTertiary,
          fontWeight: typography.medium,
        }}>Top {categoryBreakdown.length} categories</Text>
      </View>

      {/* Category bars */}
      <View style={{ gap: spacing.md }}>
        {categoryBreakdown.map((item) => (
          <CategoryBar
            key={item.category}
            category={item.category}
            amount={item.total}
            count={item.count}
            maxAmount={maxAmount}
            isDark={isDark}
          />
        ))}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// InsightStrip — autopay & recurring summary
// ─────────────────────────────────────────────

const InsightStrip = ({ expenses }: { expenses: ExpenseWithRecord[] }) => {
  const { colors } = useTheme();

  const autopayCount = expenses.filter(e => e.is_autopay).length;
  const recurringCount = expenses.filter(e => e.is_recurring).length;
  const autopayAmount = expenses
    .filter(e => e.is_autopay)
    .reduce((s, e) => s + e.amount, 0);

  if (autopayCount === 0 && recurringCount === 0) return null;

  return (
    <View style={{
      flexDirection: 'row',
      gap: spacing.sm,
    }}>
      {/* Autopay tile */}
      {autopayCount > 0 && (
        <View style={{
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: spacing.base,
          gap: spacing.xs,
          ...shadows.card,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <View style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: colors.primaryLight,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 2,
          }}>
            <Ionicons name="flash" size={15} color={colors.primary} />
          </View>
          <Text style={{
            fontSize: typography.xl,
            fontWeight: typography.extrabold,
            color: colors.textPrimary,
            letterSpacing: -0.5,
          }}>{autopayCount}</Text>
          <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: typography.semibold }}>
            On autopay
          </Text>
          <Text style={{ fontSize: 10, color: colors.primary, fontWeight: typography.bold }}>
            {formatCurrency(autopayAmount)}
          </Text>
        </View>
      )}

      {/* Recurring tile */}
      {recurringCount > 0 && (
        <View style={{
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: spacing.base,
          gap: spacing.xs,
          ...shadows.card,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <View style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: colors.tealLight,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 2,
          }}>
            <Ionicons name="repeat" size={15} color={colors.teal} />
          </View>
          <Text style={{
            fontSize: typography.xl,
            fontWeight: typography.extrabold,
            color: colors.textPrimary,
            letterSpacing: -0.5,
          }}>{recurringCount}</Text>
          <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: typography.semibold }}>
            Recurring
          </Text>
          <Text style={{ fontSize: 10, color: colors.teal, fontWeight: typography.bold }}>
            auto-tracked
          </Text>
        </View>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────
// CommitmentRow — premium fintech card
// ─────────────────────────────────────────────

const CommitmentRow = ({
  expense,
  onTogglePaid,
}: {
  expense: ExpenseWithRecord;
  onTogglePaid: (expense: ExpenseWithRecord, isPaid: boolean) => void;
}) => {
  const { colors, isDark } = useTheme();
  const rowStyles = useMemo(() => makeRowStyles(colors), [colors]);
  const STATUS_ACCENT = useMemo(() => getStatusAccent(isDark), [isDark]);

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
            {expense.due_day > 0 && (
              <Text style={rowStyles.dueDay}>
                {getDayOrdinal(expense.due_day)}
              </Text>
            )}
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
              color={isResolved ? colors.textInverse : colors.textDisabled}
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
  accentStrip: { width: 5 },
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
  info: { flex: 1, gap: 6 },
  name: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
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
  dueDay: {
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: typography.medium,
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
    backgroundColor: colors.textTertiary,
    borderColor: colors.textTertiary,
  },
  checkBtnPending: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
});

// ─────────────────────────────────────────────
// HeroCard — dominant financial snapshot
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
    Animated.timing(barAnim, { toValue: pct, duration: 1100, useNativeDriver: false }).start();
  }, [pct]);

  const barWidth = barAnim.interpolate({
    inputRange: [0, 1], outputRange: ['0%', '100%'], extrapolate: 'clamp',
  });

  const barColor =
    pct >= 0.9 ? colors.success : pct >= 0.6 ? colors.teal : pct >= 0.3 ? colors.warning : colors.danger;
  const trendColor = pct >= 0.5 ? colors.success : colors.danger;

  const dueSoonCount = expenses.filter(e => {
    const s = getBillStatus(e.due_day, e.record?.is_paid ?? false);
    return (s === 'due-soon' || s === 'overdue') && !(e.record?.is_paid) && !(e.record?.is_waived);
  }).length;

  return (
    <View style={heroStyles.card}>
      <View style={heroStyles.glowTopRight} />
      <View style={heroStyles.glowBottomLeft} />
      <View style={heroStyles.glowCenter} />
      <View style={heroStyles.ringOuter} />
      <View style={heroStyles.ringInner} />
      <View style={heroStyles.content}>
        <View style={heroStyles.headerRow}>
          <View>
            <Text style={heroStyles.eyebrow}>{greeting}</Text>
            <Text style={heroStyles.userName} numberOfLines={1}>{userName}</Text>
          </View>
          <View style={[heroStyles.coverageBadge, { backgroundColor: trendColor + '22' }]}>
            <View style={[heroStyles.coverageDot, { backgroundColor: trendColor }]} />
            <Text style={[heroStyles.coverageText, { color: trendColor }]}>{coveragePct}% covered</Text>
          </View>
        </View>
        <View style={heroStyles.amountBlock}>
          <Text style={heroStyles.amountLabel}>{getMonthName(month)} {year} · Total Flow</Text>
          <Text style={heroStyles.amount}>{formatCurrency(total)}</Text>
        </View>
        <View style={heroStyles.progressSection}>
          <View style={heroStyles.progressTrack}>
            <Animated.View style={[heroStyles.progressFill, {
              width: barWidth, backgroundColor: barColor,
              shadowColor: barColor, shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.9, shadowRadius: 8, elevation: 4,
            }]} />
          </View>
          <View style={heroStyles.progressLabels}>
            <Text style={heroStyles.progressLabelLeft}>{formatCurrency(paid)} settled</Text>
            <Text style={heroStyles.progressLabelRight}>{paidCount}/{totalCount} bills</Text>
          </View>
        </View>
        <View style={heroStyles.statsRow}>
          <View style={heroStyles.stat}>
            <Text style={heroStyles.statValue}>{formatCurrency(paid)}</Text>
            <Text style={heroStyles.statLabel}>SETTLED</Text>
          </View>
          <View style={heroStyles.statDivider} />
          <View style={heroStyles.stat}>
            <Text style={[heroStyles.statValue, { color: total - paid > 0 ? colors.warning : colors.success }]}>
              {formatCurrency(total - paid)}
            </Text>
            <Text style={heroStyles.statLabel}>REMAINING</Text>
          </View>
          {dueSoonCount > 0 && (
            <>
              <View style={heroStyles.statDivider} />
              <View style={heroStyles.stat}>
                <Text style={[heroStyles.statValue, { color: colors.danger }]}>{dueSoonCount}</Text>
                <Text style={heroStyles.statLabel}>DUE SOON</Text>
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
    backgroundColor: colors.navy, borderRadius: radius.xxl,
    overflow: 'hidden', marginHorizontal: -spacing.base, ...shadows.hero,
  },
  glowTopRight: {
    position: 'absolute', top: -70, right: -70,
    width: 260, height: 260, borderRadius: 130, backgroundColor: colors.teal, opacity: 0.16,
  },
  glowBottomLeft: {
    position: 'absolute', bottom: -90, left: -50,
    width: 280, height: 280, borderRadius: 140, backgroundColor: colors.primary, opacity: 0.13,
  },
  glowCenter: {
    position: 'absolute', top: '15%', right: '20%',
    width: 200, height: 200, borderRadius: 100, backgroundColor: colors.accentMuted, opacity: 0.07,
  },
  ringOuter: {
    position: 'absolute', top: -50, right: -50, width: 280, height: 280,
    borderRadius: 140, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  ringInner: {
    position: 'absolute', top: -20, right: -20, width: 200, height: 200,
    borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: {
    fontSize: typography.xs, fontWeight: typography.semibold,
    color: 'rgba(244,241,234,0.45)', letterSpacing: 1.2, textTransform: 'uppercase',
  },
  userName: {
    fontSize: typography.sm, color: 'rgba(244,241,234,0.65)',
    marginTop: 3, fontWeight: typography.medium,
  },
  coverageBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 5,
  },
  coverageDot: { width: 6, height: 6, borderRadius: 3 },
  coverageText: { fontSize: typography.xs, fontWeight: typography.bold },
  amountBlock: { gap: 4 },
  amountLabel: {
    fontSize: typography.xs, color: 'rgba(244,241,234,0.35)',
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  amount: {
    fontSize: typography.display, fontWeight: typography.extrabold,
    color: colors.textInverse, letterSpacing: -2, lineHeight: 54,
  },
  progressSection: { gap: spacing.xs },
  progressTrack: {
    height: 8, backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: radius.full, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.full },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabelLeft: {
    fontSize: typography.xs, color: 'rgba(244,241,234,0.40)', fontWeight: typography.medium,
  },
  progressLabelRight: {
    fontSize: typography.xs, color: 'rgba(244,241,234,0.40)', fontWeight: typography.medium,
  },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: 'rgba(244,241,234,0.07)', marginTop: -spacing.xs,
  },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(244,241,234,0.08)' },
  statValue: {
    fontSize: typography.base, fontWeight: typography.bold, color: colors.textInverse, letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 9, color: 'rgba(244,241,234,0.35)', fontWeight: typography.semibold, letterSpacing: 0.8,
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

  const urgentCommitments = useMemo(() =>
    expenses
      .filter(e => {
        if (e.record?.is_paid || e.record?.is_waived) return false;
        const s = getBillStatus(e.due_day, false);
        return s === 'overdue' || s === 'due-soon';
      })
      .sort((a, b) => {
        const sa = getBillStatus(a.due_day, false);
        const sb = getBillStatus(b.due_day, false);
        if (sa === 'overdue' && sb !== 'overdue') return -1;
        if (sb === 'overdue' && sa !== 'overdue') return 1;
        return a.due_day - b.due_day;
      })
      .slice(0, 4),
    [expenses]
  );

  const upcomingCommitments = useMemo(() =>
    expenses
      .filter(e => !(e.record?.is_paid) && !(e.record?.is_waived))
      .sort((a, b) => a.due_day - b.due_day)
      .slice(0, 5),
    [expenses]
  );

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

  const coveragePct = summary.total > 0
    ? Math.round((summary.totalPaid / summary.total) * 100) : 0;

  const dueSoonExpenses = expenses.filter(e => {
    if (e.record?.is_paid || e.record?.is_waived) return false;
    const s = getBillStatus(e.due_day, false);
    return s === 'due-soon' || s === 'overdue';
  });
  const dueSoonTotal = dueSoonExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.teal} />}
      >
        <View style={styles.topBar}>
          <View>
            <Text style={styles.screenTitle}>Overview</Text>
            <Text style={styles.screenSub}>{getMonthName(month)} {year}</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddExpense')} activeOpacity={0.8}>
            <Ionicons name="add" size={22} color={colors.textInverse} />
          </TouchableOpacity>
        </View>

        <MonthSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />

        {summary.expenseCount === 0 && !loading ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconRing}>
              <Ionicons name="pulse-outline" size={30} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No commitments yet</Text>
            <Text style={styles.emptySub}>Add your recurring bills and subscriptions to start tracking your flow.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('AddExpense')} activeOpacity={0.85}>
              <Ionicons name="add" size={16} color={colors.textInverse} />
              <Text style={styles.emptyBtnText}>Add first commitment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <HeroCard
              greeting={greeting} userName={userName}
              total={summary.total} paid={summary.totalPaid}
              paidCount={summary.paidCount} totalCount={summary.expenseCount}
              month={month} year={year} expenses={expenses}
            />

            <View style={styles.metricGrid}>
              <View style={styles.metricRow}>
                <MetricCard
                  label="Total Flow" value={formatCurrency(summary.total)}
                  subtitle={`${summary.expenseCount} commitments`}
                  icon="receipt-outline" accent={colors.primary} accentBg={colors.primaryLight}
                />
                <MetricCard
                  label="Total Covered" value={formatCurrency(summary.totalPaid)}
                  subtitle={`${coveragePct}% of total`}
                  icon="checkmark-done-outline" accent={colors.success} accentBg={colors.successLight}
                />
              </View>
              <View style={styles.metricRow}>
                <MetricCard
                  label="Remaining" value={formatCurrency(summary.totalUnpaid)}
                  subtitle={`${summary.expenseCount - summary.paidCount} unpaid`}
                  icon="hourglass-outline" accent={colors.warning} accentBg={colors.warningLight}
                />
                <MetricCard
                  label="Due Soon"
                  value={dueSoonExpenses.length > 0 ? formatCurrency(dueSoonTotal) : '—'}
                  subtitle={dueSoonExpenses.length > 0 ? `${dueSoonExpenses.length} bills` : 'All on track'}
                  icon={dueSoonExpenses.length > 0 ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                  accent={dueSoonExpenses.length > 0 ? colors.danger : colors.success}
                  accentBg={dueSoonExpenses.length > 0 ? colors.dangerLight : colors.successLight}
                />
              </View>
            </View>

            {(summary.personalTotal > 0 || summary.businessTotal > 0) && (
              <SplitCard
                personalTotal={summary.personalTotal}
                businessTotal={summary.businessTotal}
                total={summary.total}
              />
            )}

            <WeeklyFlowChart expenses={expenses} month={month} year={year} />

            <CategoryAllocation expenses={expenses} />

            {urgentCommitments.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.danger, marginTop: 1 }} />
                    <Text style={styles.sectionLabel}>Needs Attention</Text>
                  </View>
                  <TouchableOpacity style={styles.seeAllBtn} onPress={() => navigation.navigate('Commitments')}>
                    <Text style={styles.seeAllText}>See all</Text>
                    <Ionicons name="chevron-forward" size={13} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                {urgentCommitments.map(e => (
                  <CommitmentRow key={e.id} expense={e} onTogglePaid={handleTogglePaid} />
                ))}
              </View>
            )}

            {upcomingCommitments.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 1 }} />
                    <Text style={styles.sectionLabel}>Upcoming</Text>
                  </View>
                  <TouchableOpacity style={styles.seeAllBtn} onPress={() => navigation.navigate('Commitments')}>
                    <Text style={styles.seeAllText}>See all</Text>
                    <Ionicons name="chevron-forward" size={13} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                {upcomingCommitments.map(e => (
                  <CommitmentRow key={e.id} expense={e} onTogglePaid={handleTogglePaid} />
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

            <InsightStrip expenses={expenses} />
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
  addBtn: {
    width: 42, height: 42, borderRadius: radius.md,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40, shadowRadius: 12, elevation: 5,
  },
  metricGrid: { gap: spacing.sm },
  metricRow: { flexDirection: 'row', gap: spacing.sm },
  section: { gap: 0 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.md,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sectionLabel: {
    fontSize: typography.xs, fontWeight: typography.semibold,
    color: colors.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase',
  },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: typography.sm, color: colors.primary, fontWeight: typography.semibold },
  allDoneCard: {
    backgroundColor: colors.successLight, borderRadius: radius.xl,
    padding: spacing.xxl, alignItems: 'center', gap: spacing.sm,
    overflow: 'hidden', position: 'relative',
  },
  allDoneGlowA: {
    position: 'absolute', top: -40, right: -40, width: 160, height: 160,
    borderRadius: 80, backgroundColor: colors.success, opacity: 0.08,
  },
  allDoneGlowB: {
    position: 'absolute', bottom: -40, left: -30, width: 140, height: 140,
    borderRadius: 70, backgroundColor: colors.teal, opacity: 0.07,
  },
  allDoneIconRing: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surfaceRaised,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.success, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20, shadowRadius: 12, elevation: 3,
  },
  allDoneTitle: {
    fontSize: typography.lg, fontWeight: typography.bold, color: colors.success, letterSpacing: -0.3,
  },
  allDoneSub: {
    fontSize: typography.sm, color: colors.success, textAlign: 'center', opacity: 0.85, lineHeight: 20,
  },
  emptyCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xxl,
    alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, ...shadows.card,
  },
  emptyIconRing: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.lg, fontWeight: typography.bold, color: colors.textPrimary, letterSpacing: -0.3,
  },
  emptySub: { fontSize: typography.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2, marginTop: spacing.sm,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 4,
  },
  emptyBtnText: { color: colors.textInverse, fontSize: typography.sm, fontWeight: typography.semibold },
});
