import React, { useMemo, useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { typography, spacing, radius, shadows } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { useFormatCurrency, useFormatDate, navigateMonth } from '../utils/dateUtils';
import { useSettings } from '../contexts/SettingsContext';
import { useHousehold } from '../contexts/HouseholdContext';
import { useAuth } from '../contexts/AuthContext';
import { FlowBar } from './ui/FlowBar';
import { useEnergyState } from '../utils/energyState';
import { ExpenseWithRecord, CardPayment } from '../types';
import { DateInput } from './DateInput';

interface Props {
  visible: boolean;
  expense: ExpenseWithRecord;
  month: number;
  year: number;
  onClose: () => void;
  onAddPayment: (
    expense: ExpenseWithRecord,
    amount: number,
    paymentDate: string,
    statementMonth: number,
    statementYear: number,
    notes?: string
  ) => Promise<void>;
  onDeletePayment: (paymentId: string) => Promise<void>;
  onEnterBalance: (balance: number, cycleMonth: number, cycleYear: number) => Promise<void>;
}

const todayIso = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const CardPaymentsModal = ({
  visible,
  expense,
  month,
  year,
  onClose,
  onAddPayment,
  onDeletePayment,
  onEnterBalance,
}: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { currencySymbol } = useSettings();
  const formatCurrency = useFormatCurrency();
  const { monthYear, ordinalDay } = useFormatDate();
  const energyState = useEnergyState();
  const { members } = useHousehold();
  const { user } = useAuth();

  const getMemberName = (userId: string): string => {
    if (userId === user?.id) return t('household.you');
    const member = members.find((m) => m.user_id === userId);
    return member?.display_name ?? t('household.unknownMember');
  };
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const next = navigateMonth(month, year, 'next');

  // Progress bar always reflects the CURRENT COMMITMENTS MONTH's data
  const stmtBalance = expense.record?.statement_balance ?? expense.amount;
  const payments = expense.cardPayments ?? [];
  const paymentTotal = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, stmtBalance - paymentTotal);
  const ratio = stmtBalance > 0 ? Math.min(1, paymentTotal / stmtBalance) : 0;
  const isFullyPaid = remaining === 0 && stmtBalance > 0;

  const energyLevel = isFullyPaid ? 'charged' : ratio >= 0.5 ? 'flowing' : ratio > 0 ? 'thinning' : 'draining';
  const barState = energyState({ status: isFullyPaid ? 'paid' : ratio >= 0.5 ? 'upcoming' : 'due-soon' });

  // Cycle picker: which payment month we're managing (statement entry + payments)
  // Smart default: if today's day-of-month is past the card's due_day, the upcoming
  // debit is next month; otherwise it's this month.
  const [stmtMonth, setStmtMonth] = useState(month);
  const [stmtYear, setStmtYear] = useState(year);

  // Statement balance entry state
  const [balanceStr, setBalanceStr] = useState('');
  const [savingBalance, setSavingBalance] = useState(false);

  // Payment form state
  const [amountStr, setAmountStr] = useState('');
  const [paymentDate, setPaymentDate] = useState(todayIso());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const computeSmartDefault = () => {
    const todayDay = new Date().getDate();
    return todayDay < expense.due_day
      ? { month, year }
      : { month: next.month, year: next.year };
  };

  const balanceForCycle = (m: number, y: number): string => {
    const isCurrentMonth = m === month && y === year;
    if (isCurrentMonth && expense.record?.statement_balance) {
      return expense.record.statement_balance.toFixed(2);
    }
    return '';
  };

  useEffect(() => {
    if (visible) {
      const def = computeSmartDefault();
      setStmtMonth(def.month);
      setStmtYear(def.year);
      setBalanceStr(balanceForCycle(def.month, def.year));
      setAmountStr(remaining > 0 ? remaining.toFixed(2) : '');
      setPaymentDate(todayIso());
      setNotes('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, month, year]);

  const handleCycleChange = (m: number, y: number) => {
    setStmtMonth(m);
    setStmtYear(y);
    setBalanceStr(balanceForCycle(m, y));
  };

  const isNextSelected = stmtMonth === next.month && stmtYear === next.year;
  const selectedMonthLabel = monthYear(new Date(stmtYear, stmtMonth - 1, 1));
  const currentMonthLabel  = monthYear(new Date(year, month - 1, 1));
  const nextMonthLabel     = monthYear(new Date(next.year, next.month - 1, 1));

  const parsedBalance = parseFloat(balanceStr);
  const isBalanceValid = !isNaN(parsedBalance) && parsedBalance > 0;

  const parsedAmount = parseFloat(amountStr);
  const isPaymentValid = !isNaN(parsedAmount) && parsedAmount > 0 && paymentDate.length === 10;

  const handleSaveBalance = async () => {
    if (!isBalanceValid) return;
    setSavingBalance(true);
    try {
      await onEnterBalance(parsedBalance, stmtMonth, stmtYear);
    } finally {
      setSavingBalance(false);
    }
  };

  const handleSave = async () => {
    if (!isPaymentValid) return;
    setSaving(true);
    try {
      await onAddPayment(expense, parsedAmount, paymentDate, stmtMonth, stmtYear, notes.trim() || undefined);
      setAmountStr('');
      setNotes('');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkFullyPaid = async () => {
    if (remaining <= 0) return;
    setSaving(true);
    try {
      await onAddPayment(expense, remaining, paymentDate, stmtMonth, stmtYear, undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePayment = (payment: CardPayment) => {
    Alert.alert(
      t('common.delete'),
      t('cardPayments.deletePaymentConfirm', { amount: formatCurrency(payment.amount) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => onDeletePayment(payment.id),
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="card-outline" size={20} color={colors.charged} />
              <View>
                <Text style={styles.cardName}>{expense.name}</Text>
                <Text style={styles.stmtLabel}>
                  {t('cardPayments.statementFor', { month: selectedMonthLabel })}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Progress bar + summary (always shows current Commitments month data) */}
          <View style={styles.progressSection}>
            <FlowBar ratio={ratio} state={energyLevel} height={8} trackColor={colors.surfaceAlt} />
            <View style={styles.progressRow}>
              {isFullyPaid ? (
                <Text style={[styles.progressText, { color: colors.success }]}>
                  <Ionicons name="checkmark-circle" size={13} color={colors.success} />{' '}
                  {t('cardPayments.fullyPaid')}
                </Text>
              ) : (
                <Text style={styles.progressText}>
                  {t('cardPayments.progress', {
                    paid: formatCurrency(paymentTotal),
                    total: formatCurrency(stmtBalance),
                  })}
                </Text>
              )}
              {!isFullyPaid && (
                <Text style={[styles.progressText, { color: barState.color }]}>
                  {t('cardPayments.remaining', { amount: formatCurrency(remaining) })}
                </Text>
              )}
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* ── Payment Cycle ──────────────────────────────────────── */}
            <Text style={styles.sectionLabel}>{t('cardPayments.paymentCycle')}</Text>
            <View style={styles.stmtSelector}>
              <TouchableOpacity
                style={[styles.stmtOption, !isNextSelected && styles.stmtOptionActive]}
                onPress={() => handleCycleChange(month, year)}
              >
                <Text style={[styles.stmtOptionText, !isNextSelected && styles.stmtOptionTextActive]}>
                  {currentMonthLabel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.stmtOption, isNextSelected && styles.stmtOptionActive]}
                onPress={() => handleCycleChange(next.month, next.year)}
              >
                <Text style={[styles.stmtOptionText, isNextSelected && styles.stmtOptionTextActive]}>
                  {nextMonthLabel}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Statement Balance ──────────────────────────────────── */}
            <View style={styles.divider} />
            <Text style={styles.sectionLabel}>{t('cardPayments.statementSection')}</Text>
            <Text style={styles.debitsContext}>
              {t('cardPayments.debitsOn', {
                day: ordinalDay(expense.due_day),
                month: selectedMonthLabel,
              })}
            </Text>
            <View style={styles.inputRow}>
              <Text style={styles.currencySymbol}>{currencySymbol}</Text>
              <TextInput
                style={styles.amountInput}
                value={balanceStr}
                onChangeText={setBalanceStr}
                keyboardType="decimal-pad"
                selectTextOnFocus
                placeholder="0.00"
                placeholderTextColor={colors.textDisabled}
              />
            </View>
            <TouchableOpacity
              style={[styles.saveBalanceBtn, (!isBalanceValid || savingBalance) && styles.btnDisabled]}
              onPress={handleSaveBalance}
              disabled={!isBalanceValid || savingBalance}
            >
              <Text style={styles.saveBalanceBtnText}>
                {savingBalance ? t('common.saving') : t('cardPayments.saveBalance')}
              </Text>
            </TouchableOpacity>

            {/* ── Payment history ────────────────────────────────────── */}
            <View style={styles.divider} />
            <Text style={styles.sectionLabel}>{t('cardPayments.paymentsHistory')}</Text>
            {payments.length === 0 ? (
              <Text style={styles.noPayments}>{t('cardPayments.noPayments')}</Text>
            ) : (
              payments.map((p) => (
                <View key={p.id} style={styles.paymentRow}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentAmount}>{formatCurrency(p.amount)}</Text>
                    <Text style={styles.paymentDate}>
                      {t('cardPayments.paidOn', { date: p.payment_date })}
                      {members.length > 1 && ` · ${getMemberName(p.user_id)}`}
                    </Text>
                    {p.notes && <Text style={styles.paymentNotes}>{p.notes}</Text>}
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeletePayment(p)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* ── Add payment form ───────────────────────────────────── */}
            {!isFullyPaid && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionLabel}>{t('cardPayments.addPayment')}</Text>

                {/* Amount */}
                <Text style={styles.fieldLabel}>{t('cardPayments.amountLabel')}</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.currencySymbol}>{currencySymbol}</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amountStr}
                    onChangeText={setAmountStr}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                    placeholderTextColor={colors.textDisabled}
                    placeholder="0.00"
                  />
                </View>

                {/* Payment date */}
                <Text style={styles.fieldLabel}>{t('cardPayments.paymentDateLabel')}</Text>
                <DateInput
                  value={paymentDate}
                  onChange={setPaymentDate}
                />

                {/* Notes */}
                <Text style={styles.fieldLabel}>
                  {t('cardPayments.notesLabel')}{' '}
                  <Text style={styles.optional}>{t('common.optional')}</Text>
                </Text>
                <TextInput
                  style={styles.notesInput}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={t('cardPayments.notesPlaceholder')}
                  placeholderTextColor={colors.textDisabled}
                  multiline
                  numberOfLines={2}
                />

                {/* Actions */}
                <View style={styles.actions}>
                  {remaining > 0 && (
                    <TouchableOpacity
                      style={[styles.fullPaidBtn, saving && styles.btnDisabled]}
                      onPress={handleMarkFullyPaid}
                      disabled={saving}
                    >
                      <Ionicons name="checkmark-circle-outline" size={15} color={colors.success} />
                      <Text style={[styles.fullPaidText, { color: colors.success }]}>
                        {t('cardPayments.markFullyPaid')}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.saveBtn, (!isPaymentValid || saving) && styles.btnDisabled]}
                    onPress={handleSave}
                    disabled={!isPaymentValid || saving}
                  >
                    <Text style={styles.saveBtnText}>
                      {saving ? t('cardPayments.saving') : t('cardPayments.savePayment')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const makeStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '92%',
    ...shadows.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardName: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  stmtLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  progressSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  sectionLabel: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  debitsContext: {
    fontSize: typography.xs,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
    marginTop: -spacing.xs,
  },
  noPayments: {
    fontSize: typography.sm,
    color: colors.textDisabled,
    marginBottom: spacing.sm,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  paymentInfo: {
    flex: 1,
    gap: 2,
  },
  paymentAmount: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  paymentDate: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  paymentNotes: {
    fontSize: typography.xs,
    color: colors.textDisabled,
    fontStyle: 'italic',
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  optional: {
    fontWeight: typography.regular,
    color: colors.textDisabled,
    textTransform: 'none',
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
    fontSize: typography.lg,
    fontWeight: typography.medium,
    color: colors.textSecondary,
  },
  amountInput: {
    flex: 1,
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  stmtSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  stmtOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  stmtOptionActive: {
    borderColor: colors.charged,
    backgroundColor: colors.charged + '18',
  },
  stmtOptionText: {
    fontSize: typography.xs,
    fontWeight: typography.medium,
    color: colors.textSecondary,
  },
  stmtOptionTextActive: {
    color: colors.charged,
    fontWeight: typography.semibold,
  },
  saveBalanceBtn: {
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  saveBalanceBtnText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textInverse,
  },
  notesInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sm,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    minHeight: 56,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  fullPaidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.success,
    backgroundColor: 'transparent',
  },
  fullPaidText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
  saveBtn: {
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.charged,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textInverse,
  },
  btnDisabled: {
    opacity: 0.45,
  },
});

export default CardPaymentsModal;
