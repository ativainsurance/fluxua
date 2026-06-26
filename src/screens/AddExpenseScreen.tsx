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

import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../contexts/HouseholdContext';
import { useExpenses } from '../hooks/useExpenses';
import { useCustomCategories } from '../hooks/useCustomCategories';
import { getCurrentMonthYear } from '../utils/dateUtils';
import {typography, spacing, radius, shadows } from '../theme';
import { DateInput } from '../components/DateInput';
import { EmojiPicker } from '../components/EmojiPicker';
import {
  ExpenseFormData,
  ExpenseType,
  RecurrenceType,
  FrequencyType,
  AutopayMethod,
  BudgetBucket,
  BUILT_IN_CATEGORIES,
  getCategoryIcon,
  defaultBudgetBucket,
  Expense,
} from '../types';
import { useCategoryLabel } from '../utils/categories';

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
  is_variable_amount: false,
  budget_bucket: 'needs',
  emoji: '',
  holder_user_id: '',
  frequency_type: 'monthly',
  frequency_interval: 1,
  anchor_date: todayIso(),
};

const frequencyToRecurrenceType = (ft: FrequencyType): RecurrenceType => {
  switch (ft) {
    case 'weekly': case 'biweekly': case 'every_n_weeks': return 'weekly';
    case 'bimonthly': case 'monthly': return 'monthly';
    case 'quarterly': return 'quarterly';
    case 'semiannual': return 'semiannual';
    case 'annual': return 'yearly';
    default: return 'monthly';
  }
};

const BUCKET_COLORS: Record<string, string> = {
  needs: '#2563EB',
  wants: '#0D9488',
  debt:  '#D97706',
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function AddExpenseScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { currencySymbol } = useSettings();
  const { user } = useAuth();
  const { members } = useHousehold();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const existingExpense = route.params?.expense;
  const isEditing = Boolean(existingExpense);

  const { month, year } = getCurrentMonthYear();
  const { addExpense, editExpense } = useExpenses(month, year);
  const { customCategories, addCategory, getCategoryEmoji } = useCustomCategories();
  const getCategoryLabel = useCategoryLabel();

  const [form, setForm] = useState<ExpenseFormData>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('');
  const [showCategoryEmojiPicker, setShowCategoryEmojiPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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
        is_variable_amount: existingExpense.is_variable_amount ?? false,
        budget_bucket: existingExpense.budget_bucket ?? defaultBudgetBucket(existingExpense.category, existingExpense.is_variable_amount),
        emoji: existingExpense.emoji ?? '',
        holder_user_id: existingExpense.holder_user_id ?? '',
        frequency_type: existingExpense.frequency_type ?? 'monthly',
        frequency_interval: existingExpense.frequency_interval ?? 1,
        anchor_date: existingExpense.anchor_date ?? todayIso(),
      });
    }
  }, [existingExpense]);

  const set = (key: keyof ExpenseFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setCategory = (cat: string) =>
    setForm((prev) => ({
      ...prev,
      category: cat,
      budget_bucket: defaultBudgetBucket(cat, prev.is_variable_amount),
    }));

  const setVariableAmount = (v: boolean) =>
    setForm((prev) => ({
      ...prev,
      is_variable_amount: v,
      budget_bucket: defaultBudgetBucket(prev.category, v),
    }));

  const setFrequencyType = (ft: FrequencyType) => {
    setForm((prev) => ({
      ...prev,
      frequency_type: ft,
      // Default interval to 3 when first selecting every_n_weeks
      ...(ft === 'every_n_weeks' && (prev.frequency_interval || 1) < 2
        ? { frequency_interval: 3 }
        : {}),
    }));
  };

  // Sync anchor_date when due_day changes (monthly only)
  const setDueDay = (day: number) => {
    setForm((prev) => {
      const base = prev.start_date || todayIso();
      const parts = base.split('-');
      const [sy, sm] = [Number(parts[0]), Number(parts[1])];
      const daysInMonth = new Date(sy, sm, 0).getDate();
      const clamped = Math.min(day, daysInMonth);
      const anchor = `${parts[0]}-${parts[1]}-${String(clamped).padStart(2, '0')}`;
      return { ...prev, due_day: day, anchor_date: anchor };
    });
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return t('addExpense.errorNameRequired');
    if (!form.amount || isNaN(parseFloat(form.amount)))
      return t('addExpense.errorInvalidAmount');
    if (parseFloat(form.amount) <= 0) return t('addExpense.errorAmountZero');
    if (!form.is_recurring || form.frequency_type === 'monthly') {
      if (form.due_day < 1 || form.due_day > 31)
        return t('addExpense.errorDueDayRange');
    }
    if (form.is_recurring && form.frequency_type !== 'monthly' && !form.anchor_date)
      return t('addExpense.errorAnchorDateRequired');
    if (!form.start_date) return t('addExpense.errorStartDateRequired');
    if (form.end_date && form.end_date < form.start_date)
      return t('addExpense.errorEndDateOrder');
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      Alert.alert(t('addExpense.invalidInput'), err);
      return;
    }
    setLoading(true);
    try {
      // For monthly (recurring or one-time): anchor_date derives from due_day + start_date month
      let anchorDate = form.anchor_date;
      if (!form.is_recurring || form.frequency_type === 'monthly') {
        const base = form.start_date || todayIso();
        const parts = base.split('-');
        const [sy, sm] = [Number(parts[0]), Number(parts[1])];
        const daysInMonth = new Date(sy, sm, 0).getDate();
        const day = Math.min(form.due_day, daysInMonth);
        anchorDate = `${parts[0]}-${parts[1]}-${String(day).padStart(2, '0')}`;
      }
      const formToSave: ExpenseFormData = {
        ...form,
        anchor_date: anchorDate,
        recurrence_type: frequencyToRecurrenceType(form.frequency_type),
      };
      if (isEditing && existingExpense) {
        await editExpense(existingExpense.id, formToSave);
      } else {
        await addExpense(formToSave);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('addExpense.failedSave'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomCategory = async () => {
    if (!newCategoryLabel.trim()) return;
    const key = await addCategory(newCategoryLabel, newCategoryEmoji || undefined);
    if (key) {
      set('category', key);
      setShowCategories(false);
    }
    setNewCategoryLabel('');
    setNewCategoryEmoji('');
    setShowCategoryEmojiPicker(false);
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
            {isEditing ? t('addExpense.titleEdit') : t('addExpense.titleNew')}
          </Text>
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Text style={styles.saveBtnText}>{t('common.save')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Name + Emoji */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('addExpense.name')}</Text>
            <View style={styles.nameEmojiRow}>
              <TouchableOpacity
                style={[styles.emojiBtn, form.emoji ? styles.emojiBtnActive : undefined]}
                onPress={() => setShowEmojiPicker((v) => !v)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                {form.emoji ? (
                  <Text style={styles.emojiBtnText}>{form.emoji}</Text>
                ) : (
                  <Ionicons name="happy-outline" size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
              <TextInput
                style={[styles.input, styles.nameInput]}
                value={form.name}
                onChangeText={(v) => set('name', v)}
                placeholder={t('addExpense.namePlaceholder')}
                placeholderTextColor={colors.textDisabled}
              />
            </View>
            {form.emoji ? (
              <TouchableOpacity
                style={styles.emojiClearBtn}
                onPress={() => { set('emoji', ''); setShowEmojiPicker(false); }}
              >
                <Text style={styles.emojiClearText}>{t('addExpense.emojiClear')}</Text>
              </TouchableOpacity>
            ) : null}
            {showEmojiPicker && (
              <View style={styles.emojiPickerWrap}>
                <EmojiPicker
                  selected={form.emoji}
                  onSelect={(emoji) => {
                    set('emoji', emoji);
                    setShowEmojiPicker(false);
                  }}
                />
              </View>
            )}
          </View>

          {/* Amount */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {form.is_variable_amount ? t('addExpense.fallbackAmount') : t('addExpense.amount')}
            </Text>
            <View style={styles.amountWrapper}>
              <Text style={styles.currencySymbol}>{currencySymbol}</Text>
              <TextInput
                style={[styles.input, styles.amountInput]}
                value={form.amount}
                onChangeText={(v) => set('amount', v)}
                placeholder={t('addExpense.amountPlaceholder')}
                placeholderTextColor={colors.textDisabled}
                keyboardType="decimal-pad"
              />
            </View>
            <Text style={styles.fieldHint}>
              {form.is_variable_amount ? t('addExpense.variableAmountFieldHint') : t('addExpense.amountHint')}
            </Text>
          </View>

          {/* Variable Amount toggle */}
          <View style={[styles.section, styles.row]}>
            <View style={styles.flex}>
              <Text style={styles.toggleLabel}>{t('addExpense.variableAmount')}</Text>
              <Text style={styles.toggleSub}>{t('addExpense.variableAmountHint')}</Text>
            </View>
            <Switch
              value={form.is_variable_amount}
              onValueChange={setVariableAmount}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={form.is_variable_amount ? colors.primary : colors.textInverse}
            />
          </View>

          {/* Start Date */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('addExpense.startDate')}</Text>
            <DateInput
              value={form.start_date}
              onChange={(iso) => set('start_date', iso)}
            />
          </View>

          {/* End Date */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {t('addExpense.endDate')} <Text style={styles.optionalLabel}>({t('addExpense.optional')})</Text>
            </Text>
            <Text style={styles.fieldHint}>
              {t('addExpense.endDateHint')}
            </Text>
            <DateInput
              value={form.end_date}
              onChange={(iso) => set('end_date', iso)}
              minimumDate={form.start_date || undefined}
              optional
            />
          </View>

          {/* Paid From (formerly "Type") */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('addExpense.paidFrom')}</Text>
            <View style={styles.typeRow}>
              {(['personal', 'business'] as ExpenseType[]).map((typeKey) => (
                <TouchableOpacity
                  key={typeKey}
                  style={[
                    styles.typeBtn,
                    form.type === typeKey && {
                      backgroundColor:
                        typeKey === 'personal' ? colors.personal : colors.business,
                      borderColor:
                        typeKey === 'personal' ? colors.personal : colors.business,
                    },
                  ]}
                  onPress={() => set('type', typeKey)}
                >
                  <Ionicons
                    name={typeKey === 'personal' ? 'person' : 'briefcase'}
                    size={16}
                    color={form.type === typeKey ? colors.textInverse : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      form.type === typeKey && { color: colors.textInverse },
                    ]}
                  >
                    {typeKey === 'personal' ? t('addExpense.personal') : t('addExpense.business')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('addExpense.category')}</Text>
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
                {allCategories.map((cat) => {
                  const catEmoji = getCategoryEmoji(cat);
                  const isActive = form.category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catItem, isActive && styles.catItemActive]}
                      onPress={() => {
                        setCategory(cat);
                        setShowCategories(false);
                      }}
                    >
                      {catEmoji ? (
                        <Text style={styles.catItemEmoji}>{catEmoji}</Text>
                      ) : (
                        <Ionicons
                          name={getCategoryIcon(cat) as any}
                          size={16}
                          color={isActive ? colors.primary : colors.textSecondary}
                        />
                      )}
                      <Text
                        style={[
                          styles.catItemText,
                          isActive && { color: colors.primary, fontWeight: typography.semibold },
                        ]}
                      >
                        {getCategoryLabel(cat)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {/* Add custom category */}
                {showAddCategory ? (
                  <View style={styles.addCategoryBlock}>
                    <View style={styles.addCategoryRow}>
                      <TouchableOpacity
                        style={styles.catEmojiBtn}
                        onPress={() => setShowCategoryEmojiPicker((v) => !v)}
                      >
                        {newCategoryEmoji ? (
                          <Text style={{ fontSize: 18 }}>{newCategoryEmoji}</Text>
                        ) : (
                          <Ionicons name="happy-outline" size={18} color={colors.textSecondary} />
                        )}
                      </TouchableOpacity>
                      <TextInput
                        style={styles.addCategoryInput}
                        value={newCategoryLabel}
                        onChangeText={setNewCategoryLabel}
                        placeholder={t('addExpense.categoryNamePlaceholder')}
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
                          setNewCategoryEmoji('');
                          setShowCategoryEmojiPicker(false);
                        }}
                      >
                        <Ionicons name="close" size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                    {showCategoryEmojiPicker && (
                      <EmojiPicker
                        compact
                        selected={newCategoryEmoji}
                        onSelect={(emoji) => {
                          setNewCategoryEmoji(emoji);
                          setShowCategoryEmojiPicker(false);
                        }}
                      />
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addCategoryBtn}
                    onPress={() => setShowAddCategory(true)}
                  >
                    <Ionicons name="add" size={16} color={colors.primary} />
                    <Text style={styles.addCategoryBtnText}>{t('commitments.addCategory')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Budget Bucket */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('addExpense.budgetBucket')}</Text>
            <Text style={styles.fieldHint}>{t('addExpense.budgetBucketHint')}</Text>
            <View style={styles.typeRow}>
              {(['needs', 'wants', 'debt'] as BudgetBucket[]).map((bucket) => (
                <TouchableOpacity
                  key={bucket}
                  style={[
                    styles.typeBtn,
                    form.budget_bucket === bucket && {
                      backgroundColor: BUCKET_COLORS[bucket],
                      borderColor: BUCKET_COLORS[bucket],
                    },
                  ]}
                  onPress={() => set('budget_bucket', bucket)}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      form.budget_bucket === bucket && { color: colors.textInverse },
                    ]}
                  >
                    {t(`addExpense.bucket_${bucket}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recurring toggle */}
          <View style={[styles.section, styles.row]}>
            <View style={styles.flex}>
              <Text style={styles.toggleLabel}>{t('addExpense.recurring')}</Text>
              <Text style={styles.toggleSub}>{t('addExpense.recurringHint')}</Text>
            </View>
            <Switch
              value={form.is_recurring}
              onValueChange={(v) => set('is_recurring', v)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={form.is_recurring ? colors.primary : colors.textInverse}
            />
          </View>

          {/* Frequency — shown for recurring commitments */}
          {form.is_recurring && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('addExpense.frequency')}</Text>
              <View style={styles.recurrGrid}>
                <View style={styles.recurrRow}>
                  {(['weekly', 'biweekly', 'every_n_weeks'] as FrequencyType[]).map((ft) => (
                    <TouchableOpacity
                      key={ft}
                      style={[styles.recurrBtn, form.frequency_type === ft && styles.recurrBtnActive]}
                      onPress={() => setFrequencyType(ft)}
                    >
                      <Text style={[styles.recurrText, form.frequency_type === ft && styles.recurrTextActive]}>
                        {t(`addExpense.freq_${ft}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.recurrRow}>
                  {(['monthly', 'bimonthly', 'quarterly'] as FrequencyType[]).map((ft) => (
                    <TouchableOpacity
                      key={ft}
                      style={[styles.recurrBtn, form.frequency_type === ft && styles.recurrBtnActive]}
                      onPress={() => setFrequencyType(ft)}
                    >
                      <Text style={[styles.recurrText, form.frequency_type === ft && styles.recurrTextActive]}>
                        {t(`addExpense.freq_${ft}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.recurrRow}>
                  {(['semiannual', 'annual'] as FrequencyType[]).map((ft) => (
                    <TouchableOpacity
                      key={ft}
                      style={[styles.recurrBtn, form.frequency_type === ft && styles.recurrBtnActive]}
                      onPress={() => setFrequencyType(ft)}
                    >
                      <Text style={[styles.recurrText, form.frequency_type === ft && styles.recurrTextActive]}>
                        {t(`addExpense.freq_${ft}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Interval stepper — only for every_n_weeks */}
              {form.frequency_type === 'every_n_weeks' && (
                <View style={{ marginTop: spacing.md }}>
                  <Text style={[styles.sectionLabel, { marginBottom: spacing.sm }]}>{t('addExpense.repeatEvery')}</Text>
                  <View style={styles.dueDayRow}>
                    <TouchableOpacity
                      style={styles.dueDayBtn}
                      onPress={() => set('frequency_interval', Math.max(2, (form.frequency_interval || 2) - 1))}
                    >
                      <Ionicons name="remove" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.dueDayValue}>
                      <Text style={styles.dueDayNum}>{form.frequency_interval || 2}</Text>
                      <Text style={styles.dueDaySub}>{t('addExpense.weeksUnit')}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.dueDayBtn}
                      onPress={() => set('frequency_interval', Math.min(26, (form.frequency_interval || 2) + 1))}
                    >
                      <Ionicons name="add" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Due Day — shown for monthly (recurring) and all non-recurring commitments */}
          {(!form.is_recurring || form.frequency_type === 'monthly') && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('addExpense.dueDay')}</Text>
              <View style={styles.dueDayRow}>
                <TouchableOpacity
                  style={styles.dueDayBtn}
                  onPress={() => setDueDay(Math.max(1, form.due_day - 1))}
                >
                  <Ionicons name="remove" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
                <View style={styles.dueDayValue}>
                  <Text style={styles.dueDayNum}>{form.due_day}</Text>
                  <Text style={styles.dueDaySub}>{t('addExpense.ofEachMonth')}</Text>
                </View>
                <TouchableOpacity
                  style={styles.dueDayBtn}
                  onPress={() => setDueDay(Math.min(31, form.due_day + 1))}
                >
                  <Ionicons name="add" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Anchor date — shown for non-monthly recurring commitments */}
          {form.is_recurring && form.frequency_type !== 'monthly' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('addExpense.anchorDateLabel')}</Text>
              <Text style={styles.fieldHint}>{t('addExpense.anchorDateHint')}</Text>
              <DateInput
                value={form.anchor_date}
                onChange={(iso) => set('anchor_date', iso)}
              />
            </View>
          )}

          {/* Autopay */}
          <View style={styles.section}>
            <View style={[styles.row, { marginBottom: form.is_autopay ? spacing.md : 0 }]}>
              <View style={styles.flex}>
                <Text style={styles.toggleLabel}>{t('addExpense.autopay')}</Text>
                <Text style={styles.toggleSub}>{t('addExpense.autopayHint')}</Text>
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
                <Text style={[styles.sectionLabel, { marginBottom: spacing.sm }]}>{t('addExpense.autopayMethod')}</Text>
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
                        {method === 'card' ? t('addExpense.card') : t('addExpense.bankTransfer')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Last 4 digits */}
                <Text style={[styles.sectionLabel, { marginTop: spacing.md, marginBottom: spacing.xs }]}>
                  {t('addExpense.last4')}
                </Text>
                <Text style={styles.fieldHint}>{t('addExpense.last4Hint')}</Text>
                <TextInput
                  style={styles.input}
                  value={form.autopay_last4}
                  onChangeText={(v) => set('autopay_last4', v.replace(/\D/g, '').slice(0, 4))}
                  placeholder={t('addExpense.last4Placeholder')}
                  placeholderTextColor={colors.textDisabled}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </>
            )}
          </View>

          {/* Assign to — only when household has 2+ members */}
          {members.length > 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('addExpense.assignTo')}</Text>
              <View style={styles.typeRow}>
                {[
                  { id: '', label: t('addExpense.assignAll') },
                  ...members.map(m => ({
                    id: m.user_id,
                    label: m.user_id === user?.id
                      ? t('addExpense.assignYou')
                      : (m.display_name ?? t('household.unknownMember')),
                  })),
                ].map(opt => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.typeBtn,
                      form.holder_user_id === opt.id && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => set('holder_user_id', opt.id)}
                  >
                    <Text style={[
                      styles.typeBtnText,
                      form.holder_user_id === opt.id && { color: colors.textInverse },
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('addExpense.notes')}</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={form.notes}
              onChangeText={(v) => set('notes', v)}
              placeholder={t('addExpense.notesPlaceholder')}
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
  nameEmojiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nameInput: {
    flex: 1,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  emojiBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  emojiBtnText: {
    fontSize: 22,
    lineHeight: 26,
  },
  emojiClearBtn: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  emojiClearText: {
    fontSize: typography.xs,
    color: colors.danger,
    fontWeight: typography.medium,
  },
  emojiPickerWrap: {
    marginTop: spacing.sm,
  },
  catItemEmoji: {
    fontSize: 14,
    lineHeight: 18,
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
  addCategoryBlock: {
    width: '100%',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  addCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    width: '100%',
  },
  catEmojiBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
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
