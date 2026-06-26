/**
 * Computes the two bi-weekly transfer cycles for a given month.
 *
 * Cycle 1 — transfer on the 9th, covers personal commitments due 10–22 of M.
 *            W-2 payroll (day 15) contributes to this window.
 * Cycle 2 — transfer on the 23rd, covers personal commitments due 23–31 of M
 *            plus 1–9 of M+1.  Fetches two months of records.
 *
 * Phase 6 semantics: expense_records.month/year for variable-amount (card)
 * expenses represents the PAYMENT DEBIT month (cycle_month), not the entry
 * month. A card appears in cycle math only when it has an expense_record
 * with month/year matching the target cycle — no fallback to expense.amount.
 * Business commitments are always excluded.
 */

import { useState, useEffect, useCallback } from 'react';
import { ExpenseWithRecord, RecurringIncome, TransferCycle, CycleCommitment } from '../types';
import { fetchExpenses, fetchExpenseRecords } from '../services/supabase';
import { useHousehold } from '../contexts/HouseholdContext';
import { isExpenseActive } from './useExpenses';
import { getOccurrenceDates } from '../utils/occurrences';

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
  personalExpenses: ExpenseWithRecord[],
  nextMonthExpenses: ExpenseWithRecord[],
  incomes: RecurringIncome[]
): TransferCycle {
  // Commitments in this cycle's window
  const commitments: CycleCommitment[] = [];

  const addCommitment = (e: ExpenseWithRecord) => {
    let amount: number;
    if (e.is_variable_amount) {
      // Only include a card when it has a real statement for this cycle_month.
      // expense_records.month = cycle_month after Phase 6 migration; no fallback
      // to expense.amount (which is a placeholder/limit reminder, not a debt).
      const balance = e.record?.statement_balance;
      if (!balance) return;
      amount = balance;
    } else {
      amount = e.amount;
    }
    commitments.push({
      expense: e,
      amount,
      isPaid: e.record?.is_paid ?? false,
      isWaived: e.record?.is_waived ?? false,
    });
  };

  // Use occurrenceDate when set (sub-monthly expenses), else fall back to due_day
  const effectiveDay = (e: ExpenseWithRecord) => e.occurrenceDate?.getDate() ?? e.due_day;

  if (cycleNumber === 1) {
    personalExpenses
      .filter((e) => inCycle1Window(effectiveDay(e)))
      .forEach(addCommitment);
  } else {
    personalExpenses
      .filter((e) => inCycle2WindowCurrentMonth(effectiveDay(e)))
      .forEach(addCommitment);
    nextMonthExpenses
      .filter((e) => inCycle2WindowNextMonth(effectiveDay(e)))
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
  const manualTransfer = Math.max(0, totalNeeded - incomeTotal);

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
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  // isExpenseActive is the shared authoritative check used by both the Commitments
  // tab and Transfer math — enforces start_date, end_date, and recurrence type.
  // is_excluded is intentionally NOT applied: Transfer must count commitments
  // regardless of per-month display exclusion status.
  //
  // Sub-monthly expenses (weekly, every-N-weeks) are expanded into one item per
  // occurrence so each can be placed in the correct cycle window by date.
  const expandOccurrences = (
    exps: ExpenseWithRecord[],
    m: number,
    y: number
  ): ExpenseWithRecord[] =>
    exps
      .filter((e) => e.type === 'personal' && isExpenseActive(e, m, y))
      .flatMap((e) => {
        if (!e.anchor_date) return [e];
        const occs = getOccurrenceDates(e, m, y);
        if (occs.length <= 1) return [e];
        return occs.map((date) => ({ ...e, occurrenceDate: date }));
      });

  const personal = expandOccurrences(expenses, month, year);
  const nextPersonal = expandOccurrences(nextMonthExpenses, nextMonth, nextYear);

  const c1 = buildCycle(1, month, year, personal, [], incomes);
  const c2 = buildCycle(2, month, year, personal, nextPersonal, incomes);

  return [c1, c2];
};
