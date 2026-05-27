import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useFormatCurrency } from '../utils/dateUtils';
import { typography, spacing, radius, shadows } from '../theme';
import { FlowBar } from '../components/ui/FlowBar';
import { GlowText } from '../components/ui/GlowText';
import { useEnergyState } from '../utils/energyState';
import { useBudget } from '../hooks/useBudget';
import { FinancialProfile } from '../types';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const fmt = (v: number | null | undefined, formatCurrency: (n: number) => string): string =>
  v !== null && v !== undefined && v > 0 ? formatCurrency(v) : '—';

// ─────────────────────────────────────────────
// ProfileForm — editable inputs card
// ─────────────────────────────────────────────

interface ProfileFormProps {
  profile: FinancialProfile | null;
  autoCCDebt: number;
  saving: boolean;
  onSave: (updates: Partial<Omit<FinancialProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
}

const ProfileForm = ({ profile, autoCCDebt, saving, onSave }: ProfileFormProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { currencySymbol } = useSettings();
  const formStyles = useMemo(() => makeFormStyles(colors), [colors]);

  const [editing, setEditing] = useState(false);
  const [income, setIncome] = useState('');
  const [assets, setAssets] = useState('');
  const [loans, setLoans] = useState('');
  const [ccOverride, setCcOverride] = useState('');
  const [useOverride, setUseOverride] = useState(false);

  // Sync form fields when entering edit mode or profile loads
  useEffect(() => {
    if (editing) {
      setIncome(profile?.annual_after_tax_income?.toFixed(2) ?? '');
      setAssets(profile?.total_assets?.toFixed(2) ?? '');
      setLoans(profile?.total_other_loans_balance?.toFixed(2) ?? '');
      const hasOverride = profile?.cc_debt_override !== null && profile?.cc_debt_override !== undefined;
      setUseOverride(hasOverride);
      setCcOverride(hasOverride ? (profile?.cc_debt_override ?? 0).toFixed(2) : '');
    }
  }, [editing]);

  const handleSave = async () => {
    const updates: Partial<Omit<FinancialProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>> = {
      annual_after_tax_income: income ? parseFloat(income) : null,
      total_assets: assets ? parseFloat(assets) : null,
      total_other_loans_balance: loans ? parseFloat(loans) : null,
      cc_debt_override: useOverride && ccOverride ? parseFloat(ccOverride) : null,
    };
    await onSave(updates);
    setEditing(false);
  };

  const handleCancel = () => setEditing(false);

  if (!editing) {
    // View mode
    const hasAny =
      profile?.annual_after_tax_income ||
      profile?.total_assets ||
      profile?.total_other_loans_balance;
    const hasOverride =
      profile?.cc_debt_override !== null && profile?.cc_debt_override !== undefined;

    return (
      <View style={formStyles.card}>
        <View style={formStyles.cardHeader}>
          <Text style={formStyles.cardTitle}>{t('budget.profileTitle')}</Text>
          <TouchableOpacity
            style={formStyles.editBtn}
            onPress={() => setEditing(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="pencil-outline" size={15} color={colors.primary} />
            <Text style={formStyles.editBtnText}>{t('budget.editProfile')}</Text>
          </TouchableOpacity>
        </View>

        {!hasAny && (
          <Text style={formStyles.emptyHint}>{t('budget.noIncomePrompt')}</Text>
        )}

        <ViewRow
          label={t('budget.annualIncome')}
          value={profile?.annual_after_tax_income}
          colors={colors}
          formStyles={formStyles}
        />
        <ViewRow
          label={t('budget.totalAssets')}
          hint={t('budget.totalAssetsHint')}
          value={profile?.total_assets}
          colors={colors}
          formStyles={formStyles}
        />
        <ViewRow
          label={t('budget.otherLoans')}
          hint={t('budget.otherLoansHint')}
          value={profile?.total_other_loans_balance}
          colors={colors}
          formStyles={formStyles}
        />

        {/* CC Debt row */}
        <View style={formStyles.viewRow}>
          <View style={formStyles.viewRowLeft}>
            <Text style={formStyles.viewLabel}>{t('budget.ccDebt')}</Text>
            <Text style={formStyles.viewHint}>{t('budget.ccDebtHint')}</Text>
          </View>
          <View style={formStyles.viewRowRight}>
            <View style={[formStyles.badge, hasOverride ? formStyles.badgeManual : formStyles.badgeAuto]}>
              <Text style={[formStyles.badgeText, hasOverride ? formStyles.badgeTextManual : formStyles.badgeTextAuto]}>
                {hasOverride ? t('budget.ccDebtManual') : t('budget.ccDebtAuto')}
              </Text>
            </View>
            <Text style={formStyles.viewValue}>
              {hasOverride
                ? (profile?.cc_debt_override ?? 0) > 0 ? `$${profile!.cc_debt_override!.toFixed(0)}` : t('budget.notSet')
                : autoCCDebt > 0 ? `$${autoCCDebt.toFixed(0)}` : t('budget.notSet')}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Edit mode
  return (
    <View style={formStyles.card}>
      <View style={formStyles.cardHeader}>
        <Text style={formStyles.cardTitle}>{t('budget.profileTitle')}</Text>
      </View>

      <InputRow
        label={t('budget.annualIncome')}
        value={income}
        onChange={setIncome}
        placeholder={t('budget.annualIncomePlaceholder')}
        currencySymbol={currencySymbol}
        colors={colors}
        formStyles={formStyles}
      />
      <InputRow
        label={t('budget.totalAssets')}
        hint={t('budget.totalAssetsHint')}
        value={assets}
        onChange={setAssets}
        placeholder={t('budget.totalAssetsPlaceholder')}
        currencySymbol={currencySymbol}
        colors={colors}
        formStyles={formStyles}
      />
      <InputRow
        label={t('budget.otherLoans')}
        hint={t('budget.otherLoansHint')}
        value={loans}
        onChange={setLoans}
        placeholder={t('budget.otherLoansPlaceholder')}
        currencySymbol={currencySymbol}
        colors={colors}
        formStyles={formStyles}
      />

      {/* CC Debt — auto + optional override */}
      <View style={formStyles.fieldBlock}>
        <Text style={formStyles.fieldLabel}>{t('budget.ccDebt')}</Text>
        <View style={formStyles.ccAutoRow}>
          <View style={[formStyles.badge, formStyles.badgeAuto]}>
            <Text style={[formStyles.badgeText, formStyles.badgeTextAuto]}>{t('budget.ccDebtAuto')}</Text>
          </View>
          <Text style={formStyles.ccAutoValue}>
            {autoCCDebt > 0 ? `$${autoCCDebt.toFixed(2)}` : t('budget.notSet')}
          </Text>
          <TouchableOpacity
            style={[formStyles.overrideToggle, useOverride && formStyles.overrideToggleActive]}
            onPress={() => { setUseOverride((v) => !v); setCcOverride(''); }}
          >
            <Text style={[formStyles.overrideToggleText, useOverride && formStyles.overrideToggleTextActive]}>
              {t('budget.ccDebtManual')}
            </Text>
          </TouchableOpacity>
        </View>
        {useOverride && (
          <View style={formStyles.inputRow}>
            <Text style={formStyles.currencySymbol}>{currencySymbol}</Text>
            <TextInput
              style={formStyles.input}
              value={ccOverride}
              onChangeText={setCcOverride}
              keyboardType="decimal-pad"
              placeholder={t('budget.ccDebtOverridePlaceholder')}
              placeholderTextColor={colors.textDisabled}
              selectTextOnFocus
            />
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={formStyles.actions}>
        <TouchableOpacity style={formStyles.cancelBtn} onPress={handleCancel} disabled={saving}>
          <Text style={formStyles.cancelText}>{t('budget.cancelEdit')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[formStyles.saveBtn, saving && formStyles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator size="small" color={colors.textInverse} />
            : <Text style={formStyles.saveBtnText}>{t('budget.saveProfile')}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Sub-components for ProfileForm to keep it readable
const ViewRow = ({ label, hint, value, colors, formStyles }: any) => {
  const { currencySymbol } = useSettings();
  return (
    <View style={formStyles.viewRow}>
      <View style={formStyles.viewRowLeft}>
        <Text style={formStyles.viewLabel}>{label}</Text>
        {hint && <Text style={formStyles.viewHint}>{hint}</Text>}
      </View>
      <Text style={[formStyles.viewValue, !value && { color: colors.textDisabled }]}>
        {value ? `${currencySymbol}${Number(value).toLocaleString()}` : '—'}
      </Text>
    </View>
  );
};

const InputRow = ({ label, hint, value, onChange, placeholder, currencySymbol, colors, formStyles }: any) => (
  <View style={formStyles.fieldBlock}>
    <Text style={formStyles.fieldLabel}>{label}</Text>
    {hint && <Text style={formStyles.fieldHint}>{hint}</Text>}
    <View style={formStyles.inputRow}>
      <Text style={formStyles.currencySymbol}>{currencySymbol}</Text>
      <TextInput
        style={formStyles.input}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor={colors.textDisabled}
        selectTextOnFocus
      />
    </View>
  </View>
);

// ─────────────────────────────────────────────
// AllocationCard
// ─────────────────────────────────────────────

const AllocationCard = ({ snapshot }: { snapshot: ReturnType<typeof import('../hooks/useBudget').computeSnapshot> }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const styles = useMemo(() => makeAllocStyles(colors), [colors]);

  const rows = [
    { key: 'needs', label: t('budget.needs'), sub: t('budget.needsPct'), amount: snapshot.needs, color: colors.primary, pct: 0.5 },
    { key: 'wants', label: t('budget.wants'), sub: t('budget.wantsPct'), amount: snapshot.wants, color: colors.accentMuted, pct: 0.3 },
    { key: 'savings', label: t('budget.savings'), sub: t('budget.savingsPct'), amount: snapshot.savings, color: colors.teal, pct: 0.2 },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t('budget.allocationTitle')}</Text>

      {/* Monthly income strip */}
      <View style={styles.monthlyStrip}>
        <Text style={styles.monthlyLabel}>{t('budget.monthlyIncome')}</Text>
        <GlowText intensity="subtle" style={styles.monthlyAmount}>
          {formatCurrency(snapshot.monthly)}
        </GlowText>
      </View>

      {/* Stacked proportion bar */}
      <View style={styles.stackedBar}>
        {rows.map((row) => (
          <View
            key={row.key}
            style={[styles.stackedSegment, { flex: row.pct, backgroundColor: row.color }]}
          />
        ))}
      </View>

      {/* Detail rows */}
      {rows.map((row, i) => (
        <View key={row.key} style={[styles.allocRow, i < rows.length - 1 && styles.allocRowBorder]}>
          <View style={[styles.colorDot, { backgroundColor: row.color }]} />
          <View style={styles.allocMeta}>
            <Text style={styles.allocLabel}>{row.label}</Text>
            <Text style={styles.allocSub}>{row.sub}</Text>
          </View>
          <Text style={[styles.allocAmount, { color: row.color }]}>
            {formatCurrency(row.amount)}
          </Text>
        </View>
      ))}
    </View>
  );
};

// ─────────────────────────────────────────────
// MilestoneCard — individual milestone tile
// ─────────────────────────────────────────────

interface MilestoneProps {
  icon: string;
  title: string;
  value: string;
  sub: string;
  done?: boolean;
  accent: string;
  accentBg: string;
}

const MilestoneCard = ({ icon, title, value, sub, done, accent, accentBg }: MilestoneProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeMilestoneStyles(colors), [colors]);
  return (
    <View style={[styles.card, done && { borderColor: accent, borderWidth: 1 }]}>
      <View style={[styles.iconCircle, { backgroundColor: accentBg }]}>
        <Ionicons name={icon as any} size={18} color={done ? accent : colors.textSecondary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={styles.sub}>{sub}</Text>
    </View>
  );
};

// ─────────────────────────────────────────────
// BudgetScreen
// ─────────────────────────────────────────────

export default function BudgetScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const energyState = useEnergyState();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [explainerOpen, setExplainerOpen] = useState(false);

  const { profile, snapshot, autoCCDebt, loading, saving, saveProfile, reload } = useBudget();

  const hasIncome = snapshot.monthly > 0;
  const hasSavings = snapshot.savings > 0;
  const hasAssets = (profile?.total_assets ?? 0) > 0;
  const hasLiabilities = snapshot.liabilities > 0;
  const showNetWorth = hasAssets || hasLiabilities;

  // Net worth bar: ratio of (assets not claimed by liabilities) to total assets
  const netWorthRatio =
    hasAssets
      ? Math.max(0, Math.min(1, snapshot.netWorth / (profile?.total_assets ?? 1)))
      : 0;
  const nwEnergyResult = energyState({ ratio: netWorthRatio });

  // Milestone values
  const emMonths = snapshot.monthsToFundEmergency !== null ? Math.ceil(snapshot.monthsToFundEmergency) : null;
  const ccMonths = snapshot.monthsToPayoffCC !== null ? Math.ceil(snapshot.monthsToPayoffCC) : null;
  const loanYears = snapshot.yearsToPayoffLoans !== null ? Math.ceil(snapshot.yearsToPayoffLoans) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.teal} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('budget.title')}</Text>
            <Text style={styles.subtitle}>{t('budget.subtitle')}</Text>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.teal} />
            </View>
          ) : (
            <>
              {/* ── Profile inputs ── */}
              <ProfileForm
                profile={profile}
                autoCCDebt={autoCCDebt}
                saving={saving}
                onSave={saveProfile}
              />

              {/* ── 50/30/20 Allocation ── */}
              {hasIncome && <AllocationCard snapshot={snapshot} />}

              {/* ── Milestones ── */}
              {hasSavings && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>{t('budget.milestonesTitle')}</Text>
                  <View style={styles.milestoneGrid}>

                    {/* Emergency fund */}
                    <MilestoneCard
                      icon={emMonths === 0 ? 'shield-checkmark' : 'shield-outline'}
                      title={t('budget.emergencyFund')}
                      value={emMonths !== null && emMonths > 0
                        ? t('budget.monthsToFund', { count: emMonths })
                        : t('budget.funded')}
                      sub={t('budget.emergencyFundTarget', { amount: formatCurrency(snapshot.emergencyTarget) })}
                      done={emMonths === 0}
                      accent={emMonths === 0 ? colors.teal : colors.primary}
                      accentBg={emMonths === 0 ? colors.tealLight : colors.primaryLight}
                    />

                    {/* CC payoff */}
                    {snapshot.effectiveCCDebt > 0 && (
                      <MilestoneCard
                        icon={ccMonths === 0 ? 'card' : 'card-outline'}
                        title={t('budget.ccPayoff')}
                        value={ccMonths !== null && ccMonths > 0
                          ? t('budget.monthsToPayoff', { count: ccMonths })
                          : t('budget.paidOff')}
                        sub={formatCurrency(snapshot.effectiveCCDebt)}
                        done={ccMonths === 0}
                        accent={ccMonths === 0 ? colors.teal : colors.warning}
                        accentBg={ccMonths === 0 ? colors.tealLight : colors.warningLight}
                      />
                    )}

                    {/* Loan payoff */}
                    {(profile?.total_other_loans_balance ?? 0) > 0 && (
                      <MilestoneCard
                        icon={loanYears === 0 ? 'checkmark-circle' : 'time-outline'}
                        title={t('budget.loanPayoff')}
                        value={loanYears !== null && loanYears > 0
                          ? t('budget.yearsToPayoff', { count: loanYears })
                          : t('budget.paidOff')}
                        sub={formatCurrency(profile!.total_other_loans_balance!)}
                        done={loanYears === 0}
                        accent={loanYears === 0 ? colors.teal : colors.charged}
                        accentBg={loanYears === 0 ? colors.tealLight : colors.tealLight}
                      />
                    )}

                    {/* Retirement */}
                    <MilestoneCard
                      icon="trending-up"
                      title={t('budget.retirement')}
                      value={`${formatCurrency(snapshot.retirementMonthly)}${t('budget.perMonth')}`}
                      sub={t('budget.retirementSub')}
                      done={false}
                      accent={colors.teal}
                      accentBg={colors.tealLight}
                    />
                  </View>
                </View>
              )}

              {/* ── Net Worth ── */}
              {showNetWorth && (
                <View style={styles.netWorthCard}>
                  <Text style={styles.sectionLabel}>{t('budget.netWorthTitle')}</Text>

                  <View style={styles.nwRow}>
                    <View style={styles.nwMetric}>
                      <Text style={styles.nwMetricLabel}>{t('budget.assets')}</Text>
                      <Text style={[styles.nwMetricValue, { color: colors.teal }]}>
                        {fmt(profile?.total_assets, formatCurrency)}
                      </Text>
                    </View>
                    <View style={styles.nwDivider} />
                    <View style={styles.nwMetric}>
                      <Text style={styles.nwMetricLabel}>{t('budget.liabilities')}</Text>
                      <Text style={[styles.nwMetricValue, { color: snapshot.liabilities > 0 ? colors.danger : colors.textSecondary }]}>
                        {snapshot.liabilities > 0 ? formatCurrency(snapshot.liabilities) : t('budget.dash')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.nwSeparator} />

                  <Text style={styles.nwNetLabel}>{t('budget.netWorth')}</Text>
                  <GlowText
                    intensity={snapshot.netWorth > 0 ? 'soft' : 'subtle'}
                    style={[
                      styles.nwNetValue,
                      { color: snapshot.netWorth >= 0 ? nwEnergyResult.color : colors.danger },
                    ]}
                  >
                    {snapshot.netWorth >= 0
                      ? formatCurrency(snapshot.netWorth)
                      : `-${formatCurrency(Math.abs(snapshot.netWorth))}`}
                  </GlowText>

                  {hasAssets && (
                    <View style={styles.nwBar}>
                      <FlowBar
                        ratio={netWorthRatio}
                        state={nwEnergyResult.state}
                        height={8}
                        trackColor={colors.surfaceAlt}
                      />
                      <Text style={[styles.nwBarLabel, { color: nwEnergyResult.color }]}>
                        {Math.round(netWorthRatio * 100)}% {t('overview.covered')}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* ── Explainer ── */}
              <TouchableOpacity
                style={styles.explainerHeader}
                onPress={() => setExplainerOpen((v) => !v)}
                activeOpacity={0.75}
              >
                <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.explainerTitle}>{t('budget.explainerTitle')}</Text>
                <Ionicons
                  name={explainerOpen ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              {explainerOpen && (
                <View style={styles.explainerBody}>
                  <Text style={styles.explainerText}>{t('budget.explainerBody')}</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const makeStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
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
  center: {
    paddingTop: spacing.xxxl,
    alignItems: 'center',
  },
  section: { gap: spacing.sm },
  sectionLabel: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  milestoneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  netWorthCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card,
  },
  nwRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  nwMetric: { flex: 1, gap: 2 },
  nwMetricLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: typography.medium,
  },
  nwMetricValue: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    letterSpacing: -0.3,
  },
  nwDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  nwSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  nwNetLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: typography.medium,
  },
  nwNetValue: {
    fontSize: typography.xxxl,
    fontWeight: typography.extrabold,
    letterSpacing: -1,
  },
  nwBar: { gap: 4, marginTop: spacing.xs },
  nwBarLabel: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    alignSelf: 'flex-end',
  },
  explainerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  explainerTitle: {
    flex: 1,
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  explainerBody: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  explainerText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

const makeFormStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editBtnText: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: typography.medium,
  },
  emptyHint: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  viewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  viewRowLeft: { flex: 1, gap: 2 },
  viewRowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  viewLabel: {
    fontSize: typography.sm,
    color: colors.textPrimary,
    fontWeight: typography.medium,
  },
  viewHint: {
    fontSize: typography.xs,
    color: colors.textDisabled,
  },
  viewValue: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeAuto: { backgroundColor: colors.tealLight ?? colors.teal + '18' },
  badgeManual: { backgroundColor: colors.primaryLight },
  badgeText: { fontSize: typography.xs, fontWeight: typography.semibold },
  badgeTextAuto: { color: colors.teal },
  badgeTextManual: { color: colors.primary },
  fieldBlock: { gap: 4 },
  fieldLabel: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldHint: {
    fontSize: typography.xs,
    color: colors.textDisabled,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    gap: spacing.xs,
  },
  currencySymbol: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.textSecondary,
  },
  input: {
    flex: 1,
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  ccAutoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ccAutoValue: {
    flex: 1,
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  overrideToggle: {
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  overrideToggleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  overrideToggleText: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
  },
  overrideToggleTextActive: { color: colors.primary },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: {
    fontSize: typography.sm,
    color: colors.textInverse,
    fontWeight: typography.semibold,
  },
});

const makeAllocStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  cardTitle: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  monthlyStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  monthlyLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  monthlyAmount: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  stackedBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: radius.full,
    overflow: 'hidden',
    gap: 2,
  },
  stackedSegment: {
    borderRadius: radius.full,
  },
  allocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  allocRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  allocMeta: { flex: 1, gap: 1 },
  allocLabel: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  allocSub: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  allocAmount: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    letterSpacing: -0.3,
  },
});

const makeMilestoneStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.sm,
    minWidth: '47%',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: typography.xs,
    color: colors.textDisabled,
    lineHeight: 15,
  },
});
