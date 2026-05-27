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
  setStatementBalance,
  fetchCardPaymentsForStatements,
  fetchCardPaymentsByMonth,
  addCardPaymentRecord,
  deleteCardPaymentRecord,
} from '../services/supabase';
import {
  Expense,
  ExpenseRecord,
  ExpenseWithRecord,
  MonthlySummary,
  ExpenseFormData,
  CardPayment,
} from '../types';
import { useAuth } from '../contexts/AuthContext';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

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
    if ((month - 1) % interval !== 0) return false;
  }

  if (expense.end_date) {
    const [ey, em] = expense.end_date.split('-').map(Number);
    if (year > ey || (year === ey && month > em)) return false;
  }
  return true;
};

const mergePayments = (a: CardPayment[], b: CardPayment[]): CardPayment[] =>
  [...new Map([...a, ...b].map((p) => [p.id, p])).values()];

// ─────────────────────────────────────────────
// useExpenses — main data hook
// ─────────────────────────────────────────────

export const useExpenses = (month: number, year: number) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [cardPayments, setCardPayments] = useState<CardPayment[]>([]);
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

      // Fetch card payments: by statement_id (for settlement) + by payment_date (for cash-flow)
      const statementIds = recordData
        .filter((r) => expenseData.find((e) => e.id === r.expense_id)?.is_variable_amount)
        .map((r) => r.id);

      const [byStatement, byDate] = await Promise.all([
        fetchCardPaymentsForStatements(statementIds),
        fetchCardPaymentsByMonth(user.id, month, year),
      ]);
      setCardPayments(mergePayments(byStatement, byDate));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [user, month, year]);

  useEffect(() => {
    load();
  }, [load]);

  /** Join expenses with their monthly records and card payments */
  const expensesWithRecords: ExpenseWithRecord[] = expenses
    .filter((expense) => isExpenseActive(expense, month, year))
    .filter((expense) => {
      const record = records.find((r) => r.expense_id === expense.id);
      return !record?.is_excluded;
    })
    .map((expense) => {
      const record = records.find((r) => r.expense_id === expense.id);
      const payments = expense.is_variable_amount && record
        ? cardPayments.filter((p) => p.statement_id === record.id)
        : undefined;
      return { ...expense, record, cardPayments: payments };
    });

  /** Mark a non-card expense as paid/unpaid for the current month */
  const markAsPaid = useCallback(
    async (expense: Expense, isPaid: boolean, actualAmount?: number, lateFee?: number, creditAmount?: number) => {
      if (!user) return;
      try {
        const record = await getOrCreateExpenseRecord(user.id, expense.id, month, year);
        const updated = await toggleExpensePaid(record.id, isPaid, actualAmount, lateFee, creditAmount);
        setRecords((prev) => {
          const exists = prev.find((r) => r.id === updated.id);
          if (exists) return prev.map((r) => (r.id === updated.id ? updated : r));
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

  /** Mark an expense as waived for the current month */
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

  const updateRecordActualAmount = useCallback(
    async (recordId: string, actualAmount: number) => {
      try {
        const updated = await updateActualAmount(recordId, actualAmount);
        setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update amount');
      }
    },
    []
  );

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

  const editExpense = useCallback(
    async (id: string, formData: Partial<ExpenseFormData>) => {
      try {
        const updated = await updateExpense(id, formData);
        setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update');
        throw err;
      }
    },
    []
  );

  /** Save this month's statement balance for a variable-amount expense (credit card) */
  const enterStatementBalance = useCallback(
    async (expense: ExpenseWithRecord, balance: number) => {
      if (!user) return;
      try {
        const record = await getOrCreateExpenseRecord(user.id, expense.id, month, year);
        const updated = await setStatementBalance(record.id, balance);
        setRecords((prev) => {
          const exists = prev.find((r) => r.id === updated.id);
          if (exists) return prev.map((r) => (r.id === updated.id ? updated : r));
          return [...prev, updated];
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save balance');
        throw err;
      }
    },
    [user, month, year]
  );

  /**
   * Add a payment toward a card statement.
   * statementMonth/Year: which cycle's statement to pay toward (defaults to current).
   */
  const addCardPayment = useCallback(
    async (
      expense: ExpenseWithRecord,
      amount: number,
      paymentDate: string,
      statementMonth: number,
      statementYear: number,
      notes?: string
    ) => {
      if (!user) return;
      try {
        const record = await getOrCreateExpenseRecord(user.id, expense.id, statementMonth, statementYear);
        const newPayment = await addCardPaymentRecord(user.id, record.id, amount, paymentDate, notes);
        setCardPayments((prev) => mergePayments(prev, [newPayment]));
        // Ensure the statement record is tracked locally if it was just created
        setRecords((prev) => {
          const exists = prev.find((r) => r.id === record.id);
          if (exists) return prev;
          return [...prev, record];
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add payment');
        throw err;
      }
    },
    [user]
  );

  /** Delete a card payment */
  const deleteCardPayment = useCallback(async (paymentId: string) => {
    try {
      await deleteCardPaymentRecord(paymentId);
      setCardPayments((prev) => prev.filter((p) => p.id !== paymentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete payment');
      throw err;
    }
  }, []);

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

  /** Compute monthly summary — card settlement based on payment totals */
  const summary: MonthlySummary = expensesWithRecords.reduce(
    (acc, expense) => {
      const isWaived = expense.record?.is_waived ?? false;
      const plannedAmount = expense.is_variable_amount
        ? (expense.record?.statement_balance ?? expense.amount)
        : expense.amount;

      let isSettled: boolean;
      let effectiveAmount: number;

      if (expense.is_variable_amount) {
        const paymentTotal = (expense.cardPayments ?? []).reduce((s, p) => s + p.amount, 0);
        isSettled = isWaived || (plannedAmount > 0 && paymentTotal >= plannedAmount);
        effectiveAmount = Math.min(paymentTotal, plannedAmount);
      } else {
        const isPaid = expense.record?.is_paid ?? false;
        isSettled = isPaid || isWaived;
        const baseAmount = isPaid ? (expense.record?.actual_amount ?? plannedAmount) : plannedAmount;
        const lateFee = (isPaid && expense.record?.late_fee) ? expense.record.late_fee : 0;
        effectiveAmount = baseAmount + lateFee;
      }

      acc.total += plannedAmount;
      acc.expenseCount++;
      if (isSettled) {
        acc.paidCount++;
        if (!isWaived) acc.totalPaid += effectiveAmount;
      } else {
        if (expense.is_variable_amount) {
          const paymentTotal = (expense.cardPayments ?? []).reduce((s, p) => s + p.amount, 0);
          acc.totalUnpaid += Math.max(0, plannedAmount - paymentTotal);
        } else {
          acc.totalUnpaid += plannedAmount;
        }
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
    enterStatementBalance,
    addCardPayment,
    deleteCardPayment,
    allCardPayments: cardPayments,
  };
};
