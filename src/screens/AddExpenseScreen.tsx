import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../contexts/ThemeContext';
import { useExpenses } from '../hooks/useExpenses';
import { useCustomCategories } from '../hooks/useCustomCategories';
import { getCurrentMonthYear } from '../utils/dateUtils';
import {typography, spacing, radius, shadows } from '../theme';
import { DateInput } from '../components/DateInput';
import {
  ExpenseFormData,
  ExpenseType,
  RecurrenceType,
  AutopayMethod,
  RECURRENCE_LABELS,
  BUILT_IN_CATEGORIES,
  getCategoryLabel,
  getCategoryIcon,
  Expense,
} from '../types';

// Route types
type RouteParams = { expense?: Expense };

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const todayIso = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const defaultForm: ExpenseFormData = {
  name: '',
  amount: '',
  category: 'other',
  type: 'personal',
  due_day: 1,
  is_recurring: true,
  recurrence_type: 'monthly',
  notes: '',
  start_date: todayIso(),
  end_date: '',
  is_autopay: false,
  autopay_method: 'card',
  autopay_last4: '',
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function AddExpenseScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const existingExpense = route.params?.expense;
  const isEditing = Boolean(existingExpense);

  const { month, year } = getCurrentMonthYear();
  const { addExpense, editExpense } = useExpenses(month, year);
  const { customCategories, addCategory } = useCustomCategories();

  const [form, setForm] = useState<ExpenseFormData>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');

  // Pre-fill form when editing
  useEffect(() => {
    if (existingExpense) {
      setForm({
        name: existingExpense.name,
        amount: existingExpense.amount.toString(),
        category: existingExpense.category,
        type: existingExpense.type,
        due_day: existingExpense.due_day,
        is_recurring: existingExpense.is_recurring,
        recurrence_type: existingExpense.recurrence_type,
        notes: existingExpense.notes ?? '',
        start_date: existingExpense.start_date ?? todayIso(),
        end_date: existingExpense.end_date ?? '',
        is_autopay: existingExpense.is_autopay ?? false,
        autopay_method: existingExpense.autopay_method ?? 'card',
        autopay_last4: existingExpense.autopay_last4 ?? '',
      });
    }
  }, [existingExpense]);

  const set = (key: keyof ExpenseFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Please enter a name for this expense.';
    if (!form.amount || isNaN(parseFloat(form.amount)))
      return 'Please enter a valid amount.';
    if (parseFloat(form.amount) <= 0) return 'Amount must be greater than 0.';
    if (form.due_day < 1 || form.due_day > 31)
      return 'Due day must be between 1 and 31.';
    if (!form.start_date) return 'Please enter a start date.';
    if (form.end_date && form.end_date < form.start_date)
      return 'End date must be after the start date.';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Invalid input', err);
      return;
    }
    setLoading(true);
    try {
      if (isEditing && existingExpense) {
        await editExpense(existingExpense.id, form);
      } else {
        await addExpense(form);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomCategory = async () => {
    if (!newCategoryLabel.trim()) return;
    const key = await addCategory(newCategoryLabel);
    if (key) {
      set('category', key);
      setShowCategories(false);
    }
    setNewCategoryLabel('');
    setShowAddCategory(false);
  };

  const allCategories: string[] = [
    ...(BUILT_IN_CATEGORIES as readonly string[]),
    ...customCategories.map((c) => c.key),
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Commitment' : 'New Commitment'}
          </Text>
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Name */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>COMMITMENT NAME</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(v) => set('name', v)}
              placeholder="e.g., Netflix, Rent, Car Insurance"
              placeholderTextColor={colors.textDisabled}
            />
          </View>

          {/* Amount */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PLANNED MONTHLY AMOUNT</Text>
            <View style={styles.amountWrapper}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={[styles.input, styles.amountInput]}
                value={form.amount}
                onChangeText={(v) => set('amount', v)}
                placeholder="0.00"
                placeholderTextColor={colors.textDisabled}
                keyboardType="decimal-pad"
              />
            </View>
            <Text style={styles.fieldHint}>
              You can record the actual amount paid each month when marking it as paid.
            </Text>
          </View>

          {/* Start Date */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>START DATE</Text>
            <DateInput
              value={form.start_date}
              onChange={(iso) => set('start_date', iso)}
            />
          </View>

          {/* End Date */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              END DATE <Text style={styles.optionalLabel}>(OPTIONAL)</Text>
            </Text>
            <Text style={styles.fieldHint}>
              Set if this commitment has a known end date — leave blank for ongoing.
            </Text>
            <DateInput
              value={form.end_date}
              onChange={(iso) => set('end_date', iso)}
              minimumDate={form.start_date || undefined}
              optional
            />
          </View>

          {/* Type */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TYPE</Text>
            <View style={styles.typeRow}>
              {(['personal', 'business'] as ExpenseType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeBtn,
                    form.type === t && {
                      backgroundColor:
                        t === 'personal' ? colors.personal : colors.business,
                      borderColor:
                        t === 'personal' ? colors.personal : colors.business,
                    },
                  ]}
                  onPress={() => set('type', t)}
                >
                  <Ionicons
                    name={t === 'personal' ? 'person' : 'briefcase'}
                    size={16}
                    color={form.type === t ? colors.textInverse : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      form.type === t && { color: colors.textInverse },
                    ]}
                  >
                    {t === 'personal' ? 'Personal' : 'Business'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CATEGORY</Text>
            <TouchableOpacity
              style={styles.categoryPicker}
              onPress={() => setShowCategories(!showCategories)}
            >
              <Ionicons
                name={getCategoryIcon(form.category) as any}
                size={20}
                color={colors.primary}
              />
              <Text style={styles.categoryText}>
                {getCategoryLabel(form.category)}
              </Text>
              <Ionicons
                name={showCategories ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {showCategories && (
              <View style={styles.categoryGrid}>
                {allCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catItem,
                      form.category === cat && styles.catItemActive,
                    ]}
                    onPress={() => {
                      set('category', cat);
                      setShowCategories(false);
                    }}
                  >
                    <Ionicons
                      name={getCategoryIcon(cat) as any}
                      size={16}
                      color={
                        form.category === cat ? colors.primary : colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.catItemText,
                        form.category === cat && {
                          color: colors.primary,
                          fontWeight: typography.semibold,
                        },
                      ]}
                    >
                      {getCategoryLabel(cat)}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* Add custom category */}
                {showAddCategory ? (
                  <View style={styles.addCategoryRow}>
                    <TextInput
                      style={styles.addCategoryInput}
                      value={newCategoryLabel}
                      onChangeText={setNewCategoryLabel}
                      placeholder="Category name…"
                      placeholderTextColor={colors.textDisabled}
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={handleAddCustomCategory}
                    />
                    <TouchableOpacity
                      style={styles.addCategoryConfirm}
                      onPress={handleAddCustomCategory}
                    >
                      <Ionicons name="checkmark" size={18} color={colors.textInverse} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setShowAddCategory(false);
                        setNewCategoryLabel('');
                      }}
                    >
                      <Ionicons name="close" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addCategoryBtn}
                    onPress={() => setShowAddCategory(true)}
                  >
                    <Ionicons name="add" size={16} color={colors.primary} />
                    <Text style={styles.addCategoryBtnText}>Add category</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Due Day */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DUE DAY OF MONTH</Text>
            <View style={styles.dueDayRow}>
              <TouchableOpacity
                style={styles.dueDayBtn}
                onPress={() => set('due_day', Math.max(1, form.due_day - 1))}
              >
                <Ionicons name="remove" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <View style={styles.dueDayValue}>
                <Text style={styles.dueDayNum}>{form.due_day}</Text>
                <Text style={styles.dueDaySub}>of each month</Text>
              </View>
              <TouchableOpacity
                style={styles.dueDayBtn}
                onPress={() => set('due_day', Math.min(31, form.due_day + 1))}
              >
                <Ionicons name="add" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Recurring toggle */}
          <View style={[styles.section, styles.row]}>
            <View style={styles.flex}>
              <Text style={styles.toggleLabel}>Recurring</Text>
              <Text style={styles.toggleSub}>Repeat this commitment every month</Text>
            </View>
            <Switch
              value={form.is_recurring}
              onValueChange={(v) => set('is_recurring', v)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={form.is_recurring ? colors.primary : colors.textInverse}
            />
          </View>

          {/* Recurrence type */}
          {form.is_recurring && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>RECURRENCE</Text>
              <View style={styles.recurrGrid}>
                <View style={styles.recurrRow}>
                  {(['weekly', 'monthly', 'quarterly'] as RecurrenceType[]).map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.recurrBtn, form.recurrence_type === r && styles.recurrBtnActive]}
                      onPress={() => set('recurrence_type', r)}
                    >
                      <Text style={[styles.recurrText, form.recurrence_type === r && styles.recurrTextActive]}>
                        {RECURRENCE_LABELS[r]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.recurrRow}>
                  {(['semiannual', 'yearly'] as RecurrenceType[]).map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.recurrBtn, form.recurrence_type === r && styles.recurrBtnActive]}
                      onPress={() => set('recurrence_type', r)}
                    >
                      <Text style={[styles.recurrText, form.recurrence_type === r && styles.recurrTextActive]}>
                        {RECURRENCE_LABELS[r]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Autopay */}
          <View style={styles.section}>
            <View style={[styles.row, { marginBottom: form.is_autopay ? spacing.md : 0 }]}>
              <View style={styles.flex}>
                <Text style={styles.toggleLabel}>Autopay</Text>
                <Text style={styles.toggleSub}>This bill is paid automatically</Text>
              </View>
              <Switch
                value={form.is_autopay}
                onValueChange={(v) => set('is_autopay', v)}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={form.is_autopay ? colors.primary : colors.textInverse}
              />
            </View>

            {form.is_autopay && (
              <>
                {/* Method: Card / ACH */}
                <Text style={[styles.sectionLabel, { marginBottom: spacing.sm }]}>PAYMENT METHOD</Text>
                <View style={styles.typeRow}>
                  {(['card', 'ach'] as AutopayMethod[]).map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.typeBtn,
                        form.autopay_method === method && {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => set('autopay_method', method)}
                    >
                      <Ionicons
                        name={method === 'card' ? 'card' : 'git-merge'}
                        size={16}
                        color={form.autopay_method === method ? colors.textInverse : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.typeBtnText,
                          form.autopay_method === method && { color: colors.textInverse },
                        ]}
                      >
                        {method === 'card' ? 'Credit / Debit Card' : 'ACH / Bank Transfer'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Last 4 digits */}
                <Text style={[styles.sectionLabel, { marginTop: spacing.md, marginBottom: spacing.xs }]}>
                  LAST 4 DIGITS <Text style={styles.optionalLabel}>(OPTIONAL)</Text>
                </Text>
                <Text style={styles.fieldHint}>
                  {form.autopay_method === 'card'
                    ? 'Helps identify which card to update if lost or replaced.'
                    : 'Helps identify which bank account to update if changed.'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={form.autopay_last4}
                  onChangeText={(v) => set('autopay_last4', v.replace(/\D/g, '').slice(0, 4))}
                  placeholder="e.g. 4242"
                  placeholderTextColor={colors.textDisabled}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </>
            )}
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NOTES (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={form.notes}
              onChangeText={(v) => set('notes', v)}
              placeholder="Add any notes..."
              placeholderTextColor={colors.textDisabled}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    minWidth: 60,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    color: colors.textInverse,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  sectionLabel: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  optionalLabel: {
    fontWeight: typography.regular,
    color: colors.textDisabled,
  },
  fieldHint: {
    fontSize: typography.xs,
    color: colors.textDisabled,
    marginBottom: spacing.sm,
    lineHeight: 16,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.base,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  amountWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  currencySymbol: {
    fontSize: typography.xl,
    fontWeight: typography.medium,
    color: colors.textSecondary,
  },
  amountInput: {
    flex: 1,
    fontSize: typography.xl,
    fontWeight: typography.bold,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  typeBtnText: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.textSecondary,
  },
  categoryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.background,
  },
  categoryText: {
    flex: 1,
    fontSize: typography.base,
    color: colors.textPrimary,
  },
  categoryGrid: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  catItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  catItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  catItemText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  addCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: colors.primaryLight,
  },
  addCategoryBtnText: {
    fontSize: typography.xs,
    color: colors.primary,
    fontWeight: typography.medium,
  },
  addCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    width: '100%',
    marginTop: spacing.xs,
  },
  addCategoryInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: typography.sm,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  addCategoryConfirm: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dueDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  dueDayBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dueDayValue: { alignItems: 'center' },
  dueDayNum: {
    fontSize: typography.xxxl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  dueDaySub: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.textPrimary,
  },
  toggleSub: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  recurrGrid: {
    gap: spacing.sm,
  },
  recurrRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  recurrBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  recurrBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  recurrText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  recurrTextActive: {
    color: colors.primary,
    fontWeight: typography.semibold,
  },
  notesInput: {
    height: 80,
    paddingTop: spacing.sm,
  },
});
