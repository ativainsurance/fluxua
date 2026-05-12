import { useState, useEffect, useCallback } from 'react';
import {
  fetchExpenses,
  fetchExpenseRecords,
  getOrCreateExpenseRecord,
  toggleExpensePaid,
  createExpense,
  updateExpense,
  deleteExpense,
  updateActualAmount,
  excludeExpenseRecord,
  waiveExpenseRecord,
} from '../services/supabase';
import {
  Expense,
  ExpenseRecord,
  ExpenseWithRecord,
  MonthlySummary,
  ExpenseFormData,
} from '../types';
import { useAuth } from '../contexts/AuthContext';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Returns true if the expense is active during the given month/year.
 * For quarterly/semiannual recurrences the start_date month is used as the
 * cycle anchor — the expense only appears every 3 or 6 months from there.
 */
const isExpenseActive = (expense: Expense, month: number, year: number): boolean => {
  const interval =
    expense.recurrence_type === 'quarterly' ? 3
    : expense.recurrence_type === 'semiannual' ? 6
    : null;

  if (expense.start_date) {
    const [sy, sm] = expense.start_date.split('-').map(Number);
    if (year < sy || (year === sy && month < sm)) return false;
    if (interval !== null) {
      const monthsElapsed = (year - sy) * 12 + (month - sm);
      if (monthsElapsed % interval !== 0) return false;
    }
  } else if (interval !== null) {
    // No start_date: anchor cycle to January
    if ((month - 1) % interval !== 0) return false;
  }

  if (expense.end_date) {
    const [ey, em] = expense.end_date.split('-').map(Number);
    if (year > ey || (year === ey && month > em)) return false;
  }
  return true;
};

// ─────────────────────────────────────────────
// useExpenses — main data hook
// ─────────────────────────────────────────────

export const useExpenses = (month: number, year: number) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [expenseData, recordData] = await Promise.all([
        fetchExpenses(user.id),
        fetchExpenseRecords(user.id, month, year),
      ]);
      setExpenses(expenseData);
      setRecords(recordData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [user, month, year]);

  useEffect(() => {
    load();
  }, [load]);

  /** Join expenses with their monthly records, filtered to those active and not excluded this month */
  const expensesWithRecords: ExpenseWithRecord[] = expenses
    .filter((expense) => isExpenseActive(expense, month, year))
    .filter((expense) => {
      const record = records.find((r) => r.expense_id === expense.id);
      return !record?.is_excluded;
    })
    .map((expense) => ({
      ...expense,
      record: records.find((r) => r.expense_id === expense.id),
    }));

  /** Mark an expense as paid/unpaid for the current month */
  const markAsPaid = useCallback(
    async (expense: Expense, isPaid: boolean, actualAmount?: number, lateFee?: number, creditAmount?: number) => {
      if (!user) return;
      try {
        const record = await getOrCreateExpenseRecord(
          user.id,
          expense.id,
          month,
          year
        );
        const updated = await toggleExpensePaid(record.id, isPaid, actualAmount, lateFee, creditAmount);

        setRecords((prev) => {
          const exists = prev.find((r) => r.id === updated.id);
          if (exists) {
            return prev.map((r) => (r.id === updated.id ? updated : r));
          }
          return [...prev, updated];
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update');
      }
    },
    [user, month, year]
  );

  /** Remove an expense from a specific month without deleting the expense template */
  const excludeFromMonth = useCallback(
    async (expense: Expense) => {
      if (!user) return;
      try {
        const record = await getOrCreateExpenseRecord(user.id, expense.id, month, year);
        await excludeExpenseRecord(record.id);
        setRecords((prev) =>
          prev.map((r) =>
            r.id === record.id
              ? { ...r, is_excluded: true, is_paid: false, actual_amount: undefined }
              : r
          )
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove');
        throw err;
      }
    },
    [user, month, year]
  );

  /** Mark an expense as waived for the current month — resolved at $0, no payment needed */
  const waiveExpense = useCallback(
    async (expense: Expense) => {
      if (!user) return;
      try {
        const record = await getOrCreateExpenseRecord(user.id, expense.id, month, year);
        const updated = await waiveExpenseRecord(record.id);
        setRecords((prev) => {
          const exists = prev.find((r) => r.id === updated.id);
          if (exists) return prev.map((r) => (r.id === updated.id ? updated : r));
          return [...prev, updated];
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to waive');
        throw err;
      }
    },
    [user, month, year]
  );

  /** Update only the actual amount for an already-paid record */
  const updateRecordActualAmount = useCallback(
    async (recordId: string, actualAmount: number) => {
      try {
        const updated = await updateActualAmount(recordId, actualAmount);
        setRecords((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update amount');
      }
    },
    []
  );

  /** Add a new expense */
  const addExpense = useCallback(
    async (formData: ExpenseFormData) => {
      if (!user) return;
      try {
        const newExpense = await createExpense(user.id, formData);
        setExpenses((prev) => [...prev, newExpense]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create');
        throw err;
      }
    },
    [user]
  );

  /** Edit an existing expense */
  const editExpense = useCallback(
    async (id: string, formData: Partial<ExpenseFormData>) => {
      try {
        const updated = await updateExpense(id, formData);
        setExpenses((prev) =>
          prev.map((e) => (e.id === updated.id ? updated : e))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update');
        throw err;
      }
    },
    []
  );

  /** Remove an expense */
  const removeExpense = useCallback(async (id: string) => {
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      setRecords((prev) => prev.filter((r) => r.expense_id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      throw err;
    }
  }, []);

  /** Compute monthly summary — uses actual_amount when available */
  const summary: MonthlySummary = expensesWithRecords.reduce(
    (acc, expense) => {
      const isPaid = expense.record?.is_paid ?? false;
      const isWaived = expense.record?.is_waived ?? false;
      const isResolved = isPaid || isWaived;
      const plannedAmount = expense.amount;
      const baseAmount = isPaid
        ? (expense.record?.actual_amount ?? plannedAmount)
        : plannedAmount;
      const lateFee = (isPaid && expense.record?.late_fee) ? expense.record.late_fee : 0;
      const effectiveAmount = baseAmount + lateFee;

      acc.total += plannedAmount;
      acc.expenseCount++;
      if (isResolved) {
        acc.paidCount++;
        if (isPaid) acc.totalPaid += effectiveAmount;
        // waived: $0 out of pocket, nothing added to totalPaid
      } else {
        acc.totalUnpaid += plannedAmount;
      }
      if (expense.type === 'personal') acc.personalTotal += plannedAmount;
      if (expense.type === 'business') acc.businessTotal += plannedAmount;
      return acc;
    },
    {
      total: 0,
      totalPaid: 0,
      totalUnpaid: 0,
      personalTotal: 0,
      businessTotal: 0,
      expenseCount: 0,
      paidCount: 0,
    } as MonthlySummary
  );

  return {
    expenses: expensesWithRecords,
    summary,
    loading,
    error,
    reload: load,
    markAsPaid,
    updateRecordActualAmount,
    excludeFromMonth,
    waiveExpense,
    addExpense,
    editExpense,
    removeExpense,
  };
};
