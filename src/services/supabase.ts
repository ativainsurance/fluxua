import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────
// Supabase Client Setup
// ─────────────────────────────────────────────

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured =
  supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 10;

const StorageAdapter = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key-not-configured',
  {
    auth: {
      storage: StorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// ─────────────────────────────────────────────
// Database Helpers
// ─────────────────────────────────────────────

import {
  Expense,
  ExpenseRecord,
  ExpenseFormData,
  CardPayment,
  FinancialProfile,
  Household,
  HouseholdMember,
  CustomCategory,
  NotificationPreferences,
  RecurringIncome,
  RecurringIncomeFormData,
} from '../types';

// ─────────────────────────────────────────────
// Household Helpers
// ─────────────────────────────────────────────

/** Fetch the household that the current user belongs to (null if none). */
export const fetchUserHousehold = async (userId: string): Promise<Household | null> => {
  const { data, error } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;

  const { data: household, error: hErr } = await supabase
    .from('households')
    .select('*')
    .eq('id', data.household_id)
    .maybeSingle();

  if (hErr) throw hErr;
  return household;
};

/** Fetch all members of a household, joined with their profile display_name / email. */
export const fetchHouseholdMembers = async (householdId: string): Promise<HouseholdMember[]> => {
  const { data, error } = await supabase
    .from('household_members')
    .select('household_id, user_id, role, joined_at')
    .eq('household_id', householdId);

  if (error) throw error;
  if (!data?.length) return [];

  // Enrich with profile display names
  const userIds = data.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name')
    .in('id', userIds);

  const profileMap: Record<string, string | undefined> = {};
  (profiles ?? []).forEach((p: { id: string; first_name: string | null }) => {
    if (p.first_name) profileMap[p.id] = p.first_name;
  });

  return data.map((m) => ({
    household_id: m.household_id,
    user_id: m.user_id,
    role: m.role as 'owner' | 'member',
    joined_at: m.joined_at,
    display_name: profileMap[m.user_id],
  }));
};

/** Create a new household (calls SECURITY DEFINER RPC). */
export const callCreateHousehold = async (name: string): Promise<Household> => {
  const { data, error } = await supabase.rpc('create_household', { household_name: name });
  if (error) throw error;
  return data as Household;
};

/** Join an existing household by join code (calls SECURITY DEFINER RPC). */
export const callJoinHousehold = async (joinCode: string): Promise<Household> => {
  const { data, error } = await supabase.rpc('join_household', { join_code_input: joinCode });
  if (error) throw error;
  return data as Household;
};

// ─────────────────────────────────────────────
// Expense Helpers
// ─────────────────────────────────────────────

/** Fetch all expenses for the current household */
export const fetchExpenses = async (householdId: string): Promise<Expense[]> => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('household_id', householdId)
    .order('due_day', { ascending: true });

  if (error) throw error;
  return data ?? [];
};

/** Fetch a single expense by ID */
export const fetchExpenseById = async (id: string): Promise<Expense | null> => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

/** Create a new expense */
export const createExpense = async (
  userId: string,
  householdId: string,
  formData: ExpenseFormData
): Promise<Expense> => {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: userId,
      household_id: householdId,
      name: formData.name,
      amount: parseFloat(formData.amount),
      category: formData.category,
      type: formData.type,
      due_day: formData.due_day,
      is_recurring: formData.is_recurring,
      recurrence_type: formData.recurrence_type,
      notes: formData.notes || null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      is_autopay: formData.is_autopay,
      autopay_method: formData.is_autopay ? formData.autopay_method : null,
      autopay_last4: formData.is_autopay && formData.autopay_last4 ? formData.autopay_last4 : null,
      is_variable_amount: formData.is_variable_amount ?? false,
      budget_bucket: formData.budget_bucket ?? 'needs',
      emoji: formData.emoji || null,
      holder_user_id: formData.holder_user_id || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/** Update an existing expense */
export const updateExpense = async (
  id: string,
  formData: Partial<ExpenseFormData>
): Promise<Expense> => {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (formData.name !== undefined) updates.name = formData.name;
  if (formData.amount !== undefined) updates.amount = parseFloat(formData.amount);
  if (formData.category !== undefined) updates.category = formData.category;
  if (formData.type !== undefined) updates.type = formData.type;
  if (formData.due_day !== undefined) updates.due_day = formData.due_day;
  if (formData.is_recurring !== undefined) updates.is_recurring = formData.is_recurring;
  if (formData.recurrence_type !== undefined) updates.recurrence_type = formData.recurrence_type;
  if (formData.notes !== undefined) updates.notes = formData.notes || null;
  if (formData.start_date !== undefined) updates.start_date = formData.start_date || null;
  if (formData.end_date !== undefined) updates.end_date = formData.end_date || null;
  if (formData.is_autopay !== undefined) {
    updates.is_autopay = formData.is_autopay;
    updates.autopay_method = formData.is_autopay ? (formData.autopay_method ?? null) : null;
    updates.autopay_last4 = formData.is_autopay && formData.autopay_last4 ? formData.autopay_last4 : null;
  }
  if (formData.is_variable_amount !== undefined) updates.is_variable_amount = formData.is_variable_amount;
  if (formData.budget_bucket !== undefined) updates.budget_bucket = formData.budget_bucket;
  if (formData.emoji !== undefined) updates.emoji = formData.emoji || null;
  if (formData.holder_user_id !== undefined) updates.holder_user_id = formData.holder_user_id || null;

  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/** Delete an expense */
export const deleteExpense = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

/** Fetch all expense records for a given household/month/year */
export const fetchExpenseRecords = async (
  householdId: string,
  month: number,
  year: number
): Promise<ExpenseRecord[]> => {
  const { data, error } = await supabase
    .from('expense_records')
    .select('*')
    .eq('household_id', householdId)
    .eq('month', month)
    .eq('year', year);

  if (error) throw error;
  return data ?? [];
};

/**
 * Get or create an expense record for a given expense/month/year.
 */
export const getOrCreateExpenseRecord = async (
  userId: string,
  householdId: string,
  expenseId: string,
  month: number,
  year: number
): Promise<ExpenseRecord> => {
  const { data: existing, error: fetchError } = await supabase
    .from('expense_records')
    .select('*')
    .eq('expense_id', expenseId)
    .eq('household_id', householdId)
    .eq('month', month)
    .eq('year', year)
    .single();

  if (existing && !fetchError) return existing;

  const { data, error } = await supabase
    .from('expense_records')
    .insert({
      expense_id: expenseId,
      user_id: userId,
      household_id: householdId,
      month,
      year,
      is_paid: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/** Toggle the paid status of an expense record, optionally recording actual amount, late fee, and credit */
export const toggleExpensePaid = async (
  recordId: string,
  isPaid: boolean,
  actualAmount?: number,
  lateFee?: number,
  creditAmount?: number,
): Promise<ExpenseRecord> => {
  const updates: Record<string, unknown> = {
    is_paid: isPaid,
    paid_date: isPaid ? new Date().toISOString() : null,
  };

  if (isPaid) {
    if (actualAmount !== undefined) updates.actual_amount = actualAmount;
    if (lateFee !== undefined && lateFee > 0) updates.late_fee = lateFee;
    if (creditAmount !== undefined && creditAmount > 0) updates.credit_amount = creditAmount;
  } else {
    updates.actual_amount = null;
    updates.late_fee = null;
    updates.credit_amount = null;
    updates.is_waived = false;
  }

  const { data, error } = await supabase
    .from('expense_records')
    .update(updates)
    .eq('id', recordId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/** Mark an expense as excluded from a specific month (does not delete the expense template) */
export const excludeExpenseRecord = async (recordId: string): Promise<void> => {
  const { error } = await supabase
    .from('expense_records')
    .update({ is_excluded: true, is_paid: false, actual_amount: null })
    .eq('id', recordId);
  if (error) throw error;
};

/** Mark an expense as waived for a specific month — resolved at $0, no payment needed */
export const waiveExpenseRecord = async (recordId: string): Promise<ExpenseRecord> => {
  const { data, error } = await supabase
    .from('expense_records')
    .update({
      is_waived: true,
      is_paid: false,
      actual_amount: null,
      late_fee: null,
      credit_amount: null,
    })
    .eq('id', recordId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

/** Set the statement balance for a variable-amount expense record (credit card cycle entry) */
export const setStatementBalance = async (
  recordId: string,
  balance: number
): Promise<ExpenseRecord> => {
  const { data, error } = await supabase
    .from('expense_records')
    .update({ statement_balance: balance })
    .eq('id', recordId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ─────────────────────────────────────────────
// Card Payment Helpers
// ─────────────────────────────────────────────

type CardPaymentRow = {
  id: string;
  statement_id: string;
  user_id: string;
  household_id: string;
  amount: number;
  payment_date: string;
  notes?: string | null;
  created_at: string;
  expense_records: { expense_id: string } | null;
};

const mapPaymentRow = (row: CardPaymentRow): CardPayment => ({
  id: row.id,
  statement_id: row.statement_id,
  expense_id: row.expense_records?.expense_id ?? '',
  user_id: row.user_id,
  amount: row.amount,
  payment_date: row.payment_date,
  notes: row.notes ?? undefined,
  created_at: row.created_at,
});

/** Fetch all card payments for a given set of statement (expense_record) IDs */
export const fetchCardPaymentsForStatements = async (
  statementIds: string[]
): Promise<CardPayment[]> => {
  if (statementIds.length === 0) return [];
  const { data, error } = await supabase
    .from('card_payments')
    .select('*, expense_records!statement_id(expense_id)')
    .in('statement_id', statementIds);
  if (error) throw error;
  return (data ?? []).map(mapPaymentRow);
};

/** Fetch all card payments made within a calendar month (by payment_date) */
export const fetchCardPaymentsByMonth = async (
  householdId: string,
  month: number,
  year: number
): Promise<CardPayment[]> => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const { data, error } = await supabase
    .from('card_payments')
    .select('*, expense_records!statement_id(expense_id)')
    .eq('household_id', householdId)
    .gte('payment_date', startDate)
    .lte('payment_date', endDate);
  if (error) throw error;
  return (data ?? []).map(mapPaymentRow);
};

/** Record a new payment toward a card statement */
export const addCardPaymentRecord = async (
  userId: string,
  householdId: string,
  statementId: string,
  amount: number,
  paymentDate: string,
  notes?: string
): Promise<CardPayment> => {
  const { data, error } = await supabase
    .from('card_payments')
    .insert({
      user_id: userId,
      household_id: householdId,
      statement_id: statementId,
      amount,
      payment_date: paymentDate,
      notes: notes ?? null,
    })
    .select('*, expense_records!statement_id(expense_id)')
    .single();
  if (error) throw error;
  return mapPaymentRow(data as CardPaymentRow);
};

/** Delete a card payment record */
export const deleteCardPaymentRecord = async (id: string): Promise<void> => {
  const { error } = await supabase.from('card_payments').delete().eq('id', id);
  if (error) throw error;
};

/** Update the actual_amount and optional late_fee on an existing record */
export const updateActualAmount = async (
  recordId: string,
  actualAmount: number,
  lateFee?: number,
): Promise<ExpenseRecord> => {
  const updates: Record<string, unknown> = { actual_amount: actualAmount };
  if (lateFee !== undefined) updates.late_fee = lateFee > 0 ? lateFee : null;

  const { data, error } = await supabase
    .from('expense_records')
    .update(updates)
    .eq('id', recordId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ─────────────────────────────────────────────
// Financial Profile Helpers
// ─────────────────────────────────────────────

/**
 * Compute outstanding credit-card debt for the given budget month.
 * After Phase 6: expense_records.month = cycle_month (payment debit month).
 * We query both the given month AND the next month so that a budget view
 * for month M surfaces statements that debit in M+1 (the upcoming cycle).
 * Outstanding = sum over statements of max(0, statement_balance − payments).
 */
export const fetchAutoCCDebt = async (
  householdId: string,
  month: number,
  year: number
): Promise<number> => {
  const { data: expenses } = await supabase
    .from('expenses')
    .select('id')
    .eq('household_id', householdId)
    .eq('is_variable_amount', true);

  if (!expenses?.length) return 0;

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear  = month === 12 ? year + 1 : year;

  const { data: records } = await supabase
    .from('expense_records')
    .select('id, statement_balance')
    .eq('household_id', householdId)
    .in('expense_id', expenses.map((e) => e.id))
    .not('statement_balance', 'is', null)
    .gt('statement_balance', 0)
    .or(
      `and(month.eq.${month},year.eq.${year}),and(month.eq.${nextMonth},year.eq.${nextYear})`
    );

  if (!records?.length) return 0;

  const { data: payments } = await supabase
    .from('card_payments')
    .select('statement_id, amount')
    .in('statement_id', records.map((r) => r.id));

  return records.reduce((total, record) => {
    const paid = (payments ?? [])
      .filter((p) => p.statement_id === record.id)
      .reduce((s, p) => s + p.amount, 0);
    return total + Math.max(0, (record.statement_balance ?? 0) - paid);
  }, 0);
};

/** Fetch the financial profile for the current household (null if not yet created) */
export const fetchFinancialProfile = async (householdId: string): Promise<FinancialProfile | null> => {
  const { data, error } = await supabase
    .from('financial_profiles')
    .select('*')
    .eq('household_id', householdId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

/** Create or update the financial profile for the current household */
export const upsertFinancialProfile = async (
  userId: string,
  householdId: string,
  updates: Partial<Omit<FinancialProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<FinancialProfile> => {
  const { data, error } = await supabase
    .from('financial_profiles')
    .upsert(
      { ...updates, user_id: userId, household_id: householdId, updated_at: new Date().toISOString() },
      { onConflict: 'household_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ─────────────────────────────────────────────
// Custom Category Helpers
// ─────────────────────────────────────────────

/** Fetch all custom categories for a household */
export const fetchCustomCategories = async (householdId: string): Promise<CustomCategory[]> => {
  const { data, error } = await supabase
    .from('custom_categories')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
};

/** Add a custom category to a household */
export const addCustomCategory = async (
  userId: string,
  householdId: string,
  key: string,
  label: string,
  emoji?: string
): Promise<CustomCategory> => {
  const { data, error } = await supabase
    .from('custom_categories')
    .upsert(
      { created_by: userId, household_id: householdId, key, label, emoji: emoji ?? null },
      { onConflict: 'household_id,key' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
};

/** Remove a custom category from a household */
export const removeCustomCategory = async (
  householdId: string,
  key: string
): Promise<void> => {
  const { error } = await supabase
    .from('custom_categories')
    .delete()
    .eq('household_id', householdId)
    .eq('key', key);
  if (error) throw error;
};

// ─────────────────────────────────────────────
// Notification Preferences Helpers
// ─────────────────────────────────────────────

/** Fetch notification preferences for the current user; returns null if none saved yet */
export const fetchNotificationPrefs = async (
  userId: string
): Promise<NotificationPreferences | null> => {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

/** Upsert notification preferences for the current user */
export const upsertNotificationPrefs = async (
  userId: string,
  updates: Partial<Omit<NotificationPreferences, 'user_id' | 'created_at' | 'updated_at'>>
): Promise<NotificationPreferences> => {
  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ─────────────────────────────────────────────
// Recurring Income Helpers
// ─────────────────────────────────────────────

/** Fetch all recurring incomes for a household */
export const fetchRecurringIncomes = async (
  householdId: string
): Promise<RecurringIncome[]> => {
  const { data, error } = await supabase
    .from('recurring_incomes')
    .select('*')
    .eq('household_id', householdId)
    .order('day_of_month', { ascending: true });
  if (error) throw error;
  return data ?? [];
};

/** Create a new recurring income for a household */
export const createRecurringIncome = async (
  householdId: string,
  formData: RecurringIncomeFormData
): Promise<RecurringIncome> => {
  const { data, error } = await supabase
    .from('recurring_incomes')
    .insert({
      household_id: householdId,
      name: formData.name,
      amount: parseFloat(formData.amount),
      day_of_month: formData.day_of_month,
      is_active: formData.is_active,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

/** Update an existing recurring income */
export const updateRecurringIncome = async (
  id: string,
  updates: Partial<RecurringIncomeFormData>
): Promise<RecurringIncome> => {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.amount !== undefined) payload.amount = parseFloat(updates.amount);
  if (updates.day_of_month !== undefined) payload.day_of_month = updates.day_of_month;
  if (updates.is_active !== undefined) payload.is_active = updates.is_active;

  const { data, error } = await supabase
    .from('recurring_incomes')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

/** Delete a recurring income */
export const deleteRecurringIncome = async (id: string): Promise<void> => {
  const { error } = await supabase.from('recurring_incomes').delete().eq('id', id);
  if (error) throw error;
};
