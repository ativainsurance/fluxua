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
} from '../types';

/** Fetch all expenses for the current user */
export const fetchExpenses = async (userId: string): Promise<Expense[]> => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
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
  formData: ExpenseFormData
): Promise<Expense> => {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: userId,
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

/** Fetch all expense records for a given month/year */
export const fetchExpenseRecords = async (
  userId: string,
  month: number,
  year: number
): Promise<ExpenseRecord[]> => {
  const { data, error } = await supabase
    .from('expense_records')
    .select('*')
    .eq('user_id', userId)
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
  expenseId: string,
  month: number,
  year: number
): Promise<ExpenseRecord> => {
  const { data: existing, error: fetchError } = await supabase
    .from('expense_records')
    .select('*')
    .eq('expense_id', expenseId)
    .eq('user_id', userId)
    .eq('month', month)
    .eq('year', year)
    .single();

  if (existing && !fetchError) return existing;

  const { data, error } = await supabase
    .from('expense_records')
    .insert({
      expense_id: expenseId,
      user_id: userId,
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
