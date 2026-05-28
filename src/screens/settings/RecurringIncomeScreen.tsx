import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../contexts/ThemeContext';
import { useRecurringIncomes } from '../../hooks/useRecurringIncomes';
import { useFormatCurrency } from '../../utils/dateUtils';
import { typography, spacing, radius, shadows } from '../../theme';
import { RecurringIncome, RecurringIncomeFormData } from '../../types';

// ─── DayPicker ────────────────────────────────────────────────────────────────

const DayPicker = ({ value, onChange }: { value: number; onChange: (d: number) => void }) => {
  const { colors } = useTheme();
  const days = [1,5,9,10,15,22,23,25,28,30];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
      {days.map((d) => {
        const active = value === d;
        return (
          <TouchableOpacity
            key={d}
            onPress={() => onChange(d)}
            style={{
              minWidth: 44, paddingHorizontal: spacing.sm, paddingVertical: 8,
              borderRadius: radius.full, alignItems: 'center', justifyContent: 'center',
              backgroundColor: active ? colors.primary : colors.surfaceAlt,
              borderWidth: 1.5,
              borderColor: active ? colors.primary : colors.border,
            }}
          >
            <Text style={{ fontSize: typography.sm, fontWeight: typography.semibold, color: active ? colors.textInverse : colors.textSecondary }}>
              {d}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─── IncomeForm ───────────────────────────────────────────────────────────────

interface IncomeFormProps {
  initial?: RecurringIncome;
  onSave: (data: RecurringIncomeFormData) => Promise<void>;
  onCancel: () => void;
}

const IncomeForm = ({ initial, onSave, onCancel }: IncomeFormProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [name, setName] = useState(initial?.name ?? '');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [dayOfMonth, setDayOfMonth] = useState(initial?.day_of_month ?? 15);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setError(t('recurringIncome.errorName')); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError(t('recurringIncome.errorAmount')); return; }
    setSaving(true);
    try {
      await onSave({ name: name.trim(), amount: String(amt), day_of_month: dayOfMonth, is_active: isActive });
    } catch (e) {
      setError(String(e));
      setSaving(false);
    }
  };

  return (
    <View style={{
      backgroundColor: colors.surface, borderRadius: radius.xl,
      padding: spacing.base, gap: spacing.base,
      ...shadows.card, borderWidth: 1, borderColor: colors.border,
    }}>
      {/* Name */}
      <View style={{ gap: spacing.xs }}>
        <Text style={labelStyle(colors)}>{t('recurringIncome.nameLabel')}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('recurringIncome.namePlaceholder')}
          placeholderTextColor={colors.textDisabled}
          style={inputStyle(colors)}
        />
      </View>

      {/* Amount */}
      <View style={{ gap: spacing.xs }}>
        <Text style={labelStyle(colors)}>{t('recurringIncome.amountLabel')}</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={colors.textDisabled}
          keyboardType="decimal-pad"
          style={inputStyle(colors)}
        />
      </View>

      {/* Day of month */}
      <View style={{ gap: spacing.sm }}>
        <Text style={labelStyle(colors)}>{t('recurringIncome.dayLabel')}</Text>
        <DayPicker value={dayOfMonth} onChange={setDayOfMonth} />
      </View>

      {/* Active toggle */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: typography.base, color: colors.textPrimary, fontWeight: typography.medium }}>
          {t('recurringIncome.activeLabel')}
        </Text>
        <Switch
          value={isActive}
          onValueChange={setIsActive}
          trackColor={{ false: colors.border, true: colors.teal }}
          thumbColor={colors.textInverse}
        />
      </View>

      {error ? (
        <Text style={{ fontSize: typography.sm, color: colors.danger }}>{error}</Text>
      ) : null}

      {/* Buttons */}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <TouchableOpacity
          style={{ flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center', backgroundColor: colors.surface }}
          onPress={onCancel}
        >
          <Text style={{ fontSize: typography.sm, fontWeight: typography.semibold, color: colors.textSecondary }}>
            {t('common.cancel')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, opacity: saving ? 0.6 : 1 }}
          onPress={handleSave}
          disabled={saving}
        >
          {saving && <ActivityIndicator size="small" color={colors.textInverse} />}
          <Text style={{ fontSize: typography.sm, fontWeight: typography.semibold, color: colors.textInverse }}>
            {saving ? t('common.saving') : t('common.save')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── IncomeRow ────────────────────────────────────────────────────────────────

const IncomeRow = ({
  income,
  onEdit,
  onDelete,
}: {
  income: RecurringIncome;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: spacing.md,
      paddingHorizontal: spacing.base, paddingVertical: 14,
    }}>
      <View style={{
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: income.is_active ? colors.successLight : colors.surfaceAlt,
        justifyContent: 'center', alignItems: 'center', flexShrink: 0,
      }}>
        <Ionicons
          name="cash-outline"
          size={18}
          color={income.is_active ? colors.success : colors.textDisabled}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: typography.base, fontWeight: typography.semibold, color: income.is_active ? colors.textPrimary : colors.textTertiary }}>
          {income.name}
        </Text>
        <Text style={{ fontSize: typography.xs, color: colors.textSecondary, marginTop: 2 }}>
          {formatCurrency(income.amount)} · {t('recurringIncome.dayShort', { day: income.day_of_month })}
          {!income.is_active ? ` · ${t('recurringIncome.inactive')}` : ''}
        </Text>
      </View>
      <TouchableOpacity onPress={onEdit} hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}>
        <Ionicons name="pencil-outline" size={17} color={colors.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}>
        <Ionicons name="trash-outline" size={17} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RecurringIncomeScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { incomes, loading, addIncome, editIncome, removeIncome } = useRecurringIncomes();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingIncome = editingId ? incomes.find((i) => i.id === editingId) : undefined;

  const handleAdd = async (data: RecurringIncomeFormData) => {
    await addIncome(data);
    setShowForm(false);
  };

  const handleEdit = async (data: RecurringIncomeFormData) => {
    if (!editingId) return;
    await editIncome(editingId, data);
    setEditingId(null);
  };

  const handleDelete = (income: RecurringIncome) => {
    Alert.alert(
      t('recurringIncome.deleteTitle'),
      t('recurringIncome.deleteConfirm', { name: income.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => removeIncome(income.id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing.xxxl, gap: spacing.base }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.md }}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: typography.xl, fontWeight: typography.bold, color: colors.textPrimary, letterSpacing: -0.3 }}>
              {t('recurringIncome.title')}
            </Text>
            <Text style={{ fontSize: typography.sm, color: colors.textSecondary, marginTop: 1 }}>
              {t('recurringIncome.subtitle')}
            </Text>
          </View>
        </View>

        {/* Explainer */}
        <View style={{
          backgroundColor: colors.primaryLight, borderRadius: radius.xl,
          padding: spacing.base, flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
        }}>
          <Ionicons name="swap-horizontal-outline" size={18} color={colors.primary} style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, fontSize: typography.sm, color: colors.primary, lineHeight: 20 }}>
            {t('recurringIncome.explainer')}
          </Text>
        </View>

        {/* Income list */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ paddingVertical: 40 }} />
        ) : (
          <>
            {incomes.length > 0 && (
              <View style={{ backgroundColor: colors.surface, borderRadius: radius.xl, overflow: 'hidden', ...shadows.card }}>
                {incomes.map((income, idx) => (
                  <View key={income.id}>
                    {idx > 0 && <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: spacing.base + 38 + spacing.md }} />}
                    <IncomeRow
                      income={income}
                      onEdit={() => { setShowForm(false); setEditingId(income.id); }}
                      onDelete={() => handleDelete(income)}
                    />
                  </View>
                ))}
              </View>
            )}

            {/* Edit form */}
            {editingId && editingIncome && (
              <IncomeForm
                initial={editingIncome}
                onSave={handleEdit}
                onCancel={() => setEditingId(null)}
              />
            )}

            {/* Add form */}
            {showForm && !editingId && (
              <IncomeForm
                onSave={handleAdd}
                onCancel={() => setShowForm(false)}
              />
            )}

            {/* Add button */}
            {!showForm && !editingId && (
              <TouchableOpacity
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.xl,
                  padding: spacing.base, borderWidth: 1.5, borderColor: colors.border,
                  borderStyle: 'dashed', ...shadows.card,
                }}
                onPress={() => setShowForm(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={{ fontSize: typography.sm, fontWeight: typography.semibold, color: colors.primary }}>
                  {t('recurringIncome.addIncome')}
                </Text>
              </TouchableOpacity>
            )}

            {incomes.length === 0 && !showForm && (
              <Text style={{ textAlign: 'center', fontSize: typography.sm, color: colors.textTertiary, paddingVertical: spacing.sm }}>
                {t('recurringIncome.emptyHint')}
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Style helpers (module-level, colors passed) ───────────────────────────────

const labelStyle = (colors: any) => ({
  fontSize: typography.xs,
  fontWeight: typography.semibold as any,
  color: colors.textTertiary,
  letterSpacing: 0.8,
  textTransform: 'uppercase' as const,
});

const inputStyle = (colors: any) => ({
  fontSize: typography.base,
  color: colors.textPrimary,
  backgroundColor: colors.surfaceAlt,
  borderRadius: radius.md,
  paddingHorizontal: spacing.base,
  paddingVertical: 12,
  borderWidth: 1,
  borderColor: colors.border,
});
