/**
 * Computes the two bi-weekly transfer cycles for a given month.
 *
 * Cycle 1 — transfer on the 9th, covers personal commitments due 10–22 of M.
 *            W-2 payroll (day 15) contributes to this window.
 * Cycle 2 — transfer on the 23rd, covers personal commitments due 23–31 of M
 *            plus 1–9 of M+1.  Fetches two months of records.
 *
 * Only personal (type='personal') non-card (is_variable_amount=false) commitments
 * are counted toward cycle math; business commitments are excluded.
 */

import { useState, useEffect, useCallback } from 'react';
import { ExpenseWithRecord, RecurringIncome, TransferCycle, CycleCommitment } from '../types';
import { fetchExpenses, fetchExpenseRecords } from '../services/supabase';
import { useHousehold } from '../contexts/HouseholdContext';

// ─── Window helpers ───────────────────────────────────────────────────────────

/** Returns true if `day` falls in the inclusive range [lo, hi] within cycle 1 (10–22). */
const inCycle1Window = (day: number): boolean => day >= 10 && day <= 22;

/** Returns true if `day` of month M falls in cycle-2 window (23–31 of M). */
const inCycle2WindowCurrentMonth = (day: number): boolean => day >= 23;

/** Returns true if `day` of month M+1 falls in cycle-2 window (1–9). */
const inCycle2WindowNextMonth = (day: number): boolean => day >= 1 && day <= 9;

function buildCycle(
  cycleNumber: 1 | 2,
  month: number,
  year: number,
  personalNonCardExpenses: ExpenseWithRecord[],
  nextMonthExpenses: ExpenseWithRecord[],
  incomes: RecurringIncome[]
): TransferCycle {
  // Commitments in this cycle's window
  const commitments: CycleCommitment[] = [];

  const addCommitment = (e: ExpenseWithRecord) => {
    const amount = e.is_variable_amount
      ? (e.record?.statement_balance ?? e.amount)
      : e.amount;
    commitments.push({
      expense: e,
      amount,
      isPaid: e.record?.is_paid ?? false,
      isWaived: e.record?.is_waived ?? false,
    });
  };

  if (cycleNumber === 1) {
    personalNonCardExpenses
      .filter((e) => inCycle1Window(e.due_day))
      .forEach(addCommitment);
  } else {
    personalNonCardExpenses
      .filter((e) => inCycle2WindowCurrentMonth(e.due_day))
      .forEach(addCommitment);
    nextMonthExpenses
      .filter((e) => inCycle2WindowNextMonth(e.due_day))
      .forEach(addCommitment);
  }

  // Income in this window
  const incomeInWindow: { name: string; amount: number; day: number }[] = [];
  incomes
    .filter((inc) => {
      if (!inc.is_active) return false;
      if (cycleNumber === 1) return inCycle1Window(inc.day_of_month);
      return inCycle2WindowCurrentMonth(inc.day_of_month) ||
             inCycle2WindowNextMonth(inc.day_of_month);
    })
    .forEach((inc) => {
      incomeInWindow.push({ name: inc.name, amount: inc.amount, day: inc.day_of_month });
    });

  const totalNeeded = commitments.reduce((s, c) => s + c.amount, 0);
  const totalSettled = commitments
    .filter((c) => c.isPaid || c.isWaived)
    .reduce((s, c) => s + c.amount, 0);
  const incomeTotal = incomeInWindow.reduce((s, i) => s + i.amount, 0);
  const manualTransfer = Math.max(0, totalNeeded - totalSettled - incomeTotal);

  const transferDay = cycleNumber === 1 ? 9 : 23;
  const windowLabel = cycleNumber === 1 ? '10–22' : '23–9';

  return {
    cycleNumber,
    transferDay,
    windowLabel,
    month,
    year,
    commitments,
    incomeInWindow,
    totalNeeded,
    totalSettled,
    incomeTotal,
    manualTransfer,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useTransferCycles = (month: number, year: number) => {
  const { householdId } = useHousehold();

  // Current month + next month for cycle-2 cross-month window
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const [expenses, setExpenses] = useState<ExpenseWithRecord[]>([]);
  const [nextExpenses, setNextExpenses] = useState<ExpenseWithRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!householdId) return;
    setLoading(true);
    try {
      const [allExpenses, recordsCurrent, recordsNext] = await Promise.all([
        fetchExpenses(householdId),
        fetchExpenseRecords(householdId, month, year),
        fetchExpenseRecords(householdId, nextMonth, nextYear),
      ]);

      const recordMapCurrent = new Map(recordsCurrent.map((r) => [r.expense_id, r]));
      const recordMapNext = new Map(recordsNext.map((r) => [r.expense_id, r]));

      const merged = allExpenses.map((e) => ({
        ...e,
        record: recordMapCurrent.get(e.id),
      }));

      const mergedNext = allExpenses.map((e) => ({
        ...e,
        record: recordMapNext.get(e.id),
      }));

      setExpenses(merged);
      setNextExpenses(mergedNext);
    } catch (_) {
      // silent — cycles will just show zeros
    } finally {
      setLoading(false);
    }
  }, [householdId, month, year, nextMonth, nextYear]);

  useEffect(() => { load(); }, [load]);

  return { expenses, nextExpenses, loading, reload: load };
};

/** Pure function that computes both cycles given already-loaded data. */
export const computeTransferCycles = (
  month: number,
  year: number,
  expenses: ExpenseWithRecord[],
  nextMonthExpenses: ExpenseWithRecord[],
  incomes: RecurringIncome[]
): [TransferCycle, TransferCycle] => {
  const personal = expenses.filter(
    (e) => e.type === 'personal' && !(e.record?.is_excluded)
  );
  const nextPersonal = nextMonthExpenses.filter(
    (e) => e.type === 'personal' && !(e.record?.is_excluded)
  );

  const c1 = buildCycle(1, month, year, personal, [], incomes);
  const c2 = buildCycle(2, month, year, personal, nextPersonal, incomes);

  return [c1, c2];
};
