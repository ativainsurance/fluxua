import React, { useMemo, useState, useEffect } from 'react';
import { Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius, shadows } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../utils/dateUtils';

interface Props {
  visible: boolean;
  expenseName: string;
  plannedAmount: number;
  monthLabel: string;
  onConfirm: (actualAmount: number, lateFee?: number, creditAmount?: number) => void;
  onSkip: () => void;
  onCancel: () => void;
}

export const PaidAmountModal = ({
  visible,
  expenseName,
  plannedAmount,
  monthLabel,
  onConfirm,
  onSkip,
  onCancel }: Props) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [value, setValue] = useState('');
  const [lateFeeValue, setLateFeeValue] = useState('');
  const [creditValue, setCreditValue] = useState('');

  useEffect(() => {
    if (visible) {
      setValue(plannedAmount.toFixed(2));
      setLateFeeValue('');
      setCreditValue('');
    }
  }, [visible, plannedAmount]);

  const parsed = parseFloat(value);
  const isValid = !isNaN(parsed) && parsed > 0;
  const isDifferent = isValid && parsed !== plannedAmount;

  const parsedLateFee = parseFloat(lateFeeValue);
  const hasLateFee = lateFeeValue.trim() !== '' && !isNaN(parsedLateFee) && parsedLateFee > 0;

  const parsedCredit = parseFloat(creditValue);
  const hasCredit = creditValue.trim() !== '' && !isNaN(parsedCredit) && parsedCredit > 0;

  const handleConfirm = () => {
    if (isValid) onConfirm(parsed, hasLateFee ? parsedLateFee : undefined, hasCredit ? parsedCredit : undefined);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconBadge}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            </View>
            <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Mark as Paid</Text>
          <Text style={styles.subtitle}>
            How much did you actually pay for{' '}
            <Text style={styles.bold}>{expenseName}</Text> in {monthLabel}?
          </Text>

          {/* Planned amount hint */}
          <Text style={styles.hint}>
            Planned: {formatCurrency(plannedAmount)}
          </Text>

          {/* Actual amount input */}
          <Text style={styles.fieldLabel}>Amount paid</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              selectTextOnFocus
              autoFocus
            />
          </View>

          {isDifferent && (
            <View style={styles.diffRow}>
              <Ionicons
                name={parsed > plannedAmount ? 'trending-up' : 'trending-down'}
                size={14}
                color={parsed > plannedAmount ? colors.danger : colors.success}
              />
              <Text
                style={[
                  styles.diffText,
                  { color: parsed > plannedAmount ? colors.danger : colors.success },
                ]}
              >
                {parsed > plannedAmount ? '+' : ''}
                {formatCurrency(parsed - plannedAmount)} vs planned
              </Text>
            </View>
          )}

          {/* Credit applied input */}
          <Text style={styles.fieldLabel}>Credit applied <Text style={styles.optional}>(optional)</Text></Text>
          <View style={[styles.inputWrapper, styles.creditWrapper]}>
            <Ionicons name="gift-outline" size={16} color={colors.primary} style={styles.lateFeeIcon} />
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.input}
              value={creditValue}
              onChangeText={setCreditValue}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textDisabled}
            />
          </View>

          {hasCredit && (
            <View style={styles.diffRow}>
              <Ionicons name="checkmark-circle-outline" size={14} color={colors.primary} />
              <Text style={[styles.diffText, { color: colors.primary }]}>
                {formatCurrency(parsedCredit)} credit applied
                {isValid ? ` · Net out of pocket: ${formatCurrency(Math.max(0, parsed - parsedCredit))}` : ''}
              </Text>
            </View>
          )}

          {/* Late fee input */}
          <Text style={styles.fieldLabel}>Late fee <Text style={styles.optional}>(optional)</Text></Text>
          <View style={[styles.inputWrapper, styles.lateFeeWrapper]}>
            <Ionicons name="warning-outline" size={16} color={colors.warning} style={styles.lateFeeIcon} />
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.input}
              value={lateFeeValue}
              onChangeText={setLateFeeValue}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textDisabled}
            />
          </View>

          {hasLateFee && (
            <View style={styles.diffRow}>
              <Ionicons name="alert-circle-outline" size={14} color={colors.warning} />
              <Text style={[styles.diffText, { color: colors.warning }]}>
                Total out: {formatCurrency(parsed + parsedLateFee)}
                {' '}({formatCurrency(parsed)} + {formatCurrency(parsedLateFee)} fee)
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
              <Text style={styles.skipText}>Use planned amount</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, !isValid && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={!isValid}
            >
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const makeStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    ...shadows.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.successLight,
    justifyContent: 'center',
    alignItems: 'center' },
  title: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs },
  subtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xs },
  bold: {
    fontWeight: typography.semibold,
    color: colors.textPrimary },
  hint: {
    fontSize: typography.xs,
    color: colors.textDisabled,
    marginBottom: spacing.md },
  fieldLabel: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5 },
  optional: {
    fontWeight: typography.regular,
    color: colors.textDisabled,
    textTransform: 'none' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    marginBottom: spacing.sm },
  creditWrapper: {
    borderColor: colors.primary,
    borderStyle: 'dashed' },
  lateFeeWrapper: {
    borderColor: colors.warning },
  lateFeeIcon: {
    marginRight: 4 },
  currencySymbol: {
    fontSize: typography.xxl,
    fontWeight: typography.medium,
    color: colors.textSecondary,
    marginRight: spacing.xs },
  input: {
    flex: 1,
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.textPrimary },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm },
  diffText: {
    fontSize: typography.xs,
    fontWeight: typography.medium },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm },
  skipBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center' },
  skipText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium },
  confirmBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.success,
    alignItems: 'center' },
  confirmBtnDisabled: {
    opacity: 0.5 },
  confirmText: {
    fontSize: typography.sm,
    color: colors.textInverse,
    fontWeight: typography.semibold } });
