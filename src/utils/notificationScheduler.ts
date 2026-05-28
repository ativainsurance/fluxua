/**
 * Pure scheduling logic for Fluxua local push notifications.
 * No side effects — takes data, returns scheduled notification specs.
 */

import * as Notifications from 'expo-notifications';
import { Expense, ExpenseRecord, NotificationPreferences } from '../types';

export type NotifType =
  | 'stmt_reminder'   // autopay card, 3 days before due, no statement_balance
  | 'pay_3day'        // non-autopay, 3 days before due, unpaid
  | 'pay_today'       // non-autopay, due today morning, still unpaid
  | 'autopay_warn';   // autopay card, due today morning, no statement_balance

export interface ScheduledNotif {
  identifier: string;
  content: Notifications.NotificationContentInput;
  trigger: Notifications.NotificationTriggerInput;
  /** Which user(s) this notification targets — null = all members */
  targetUserId: string | null;
}

interface ScheduleInput {
  expenses: Expense[];
  records: ExpenseRecord[];
  prefs: NotificationPreferences;
  userId: string;
  month: number;
  year: number;
  /** Translated strings — caller passes t() results */
  strings: {
    stmtReminderTitle: string;
    stmtReminderBody: (name: string) => string;
    pay3dayTitle: string;
    pay3dayBody: (name: string) => string;
    payTodayTitle: string;
    payTodayBody: (name: string) => string;
    autopayWarnTitle: string;
    autopayWarnBody: (name: string) => string;
  };
}

/** Returns the calendar date when a notification should fire for a given due day / type */
function triggerDate(
  dueDay: number,
  month: number,
  year: number,
  type: NotifType
): Date | null {
  // Clamp due day to last day of month
  const lastDay = new Date(year, month, 0).getDate();
  const clampedDay = Math.min(dueDay, lastDay);

  let d: Date;
  if (type === 'stmt_reminder' || type === 'pay_3day') {
    d = new Date(year, month - 1, clampedDay - 3, 9, 0, 0);
  } else {
    // pay_today / autopay_warn — morning of due date
    d = new Date(year, month - 1, clampedDay, 9, 0, 0);
  }

  // Skip dates in the past
  if (d.getTime() <= Date.now()) return null;
  return d;
}

/** Deterministic identifier so cancel-and-reschedule is idempotent */
function notifId(type: NotifType, expenseId: string, month: number, year: number): string {
  return `fluxua-${type}-${expenseId}-${year}${String(month).padStart(2, '0')}`;
}

/** Checks whether the current user should be notified for this expense */
function isTargeted(expense: Expense, userId: string): boolean {
  return !expense.holder_user_id || expense.holder_user_id === userId;
}

export function buildScheduledNotifications(input: ScheduleInput): ScheduledNotif[] {
  const { expenses, records, prefs, userId, month, year, strings } = input;
  const result: ScheduledNotif[] = [];

  const recordByExpenseId = new Map<string, ExpenseRecord>();
  for (const r of records) {
    recordByExpenseId.set(r.expense_id, r);
  }

  for (const expense of expenses) {
    if (!isTargeted(expense, userId)) continue;

    const record = recordByExpenseId.get(expense.id);
    const isPaid = record?.is_paid ?? false;
    const isWaived = record?.is_waived ?? false;
    const isExcluded = record?.is_excluded ?? false;
    const hasBalance = (record?.statement_balance ?? null) !== null;

    if (isPaid || isWaived || isExcluded) continue;

    // ── Autopay card types ─────────────────────────────────────────────
    if (expense.is_variable_amount && expense.is_autopay) {
      // Type 1: stmt_reminder — 3 days before, if no statement_balance yet
      if (prefs.push_stmt_reminder && !hasBalance) {
        const t = triggerDate(expense.due_day, month, year, 'stmt_reminder');
        if (t) {
          result.push({
            identifier: notifId('stmt_reminder', expense.id, month, year),
            content: {
              title: strings.stmtReminderTitle,
              body: strings.stmtReminderBody(expense.name),
              data: { type: 'stmt_reminder', expenseId: expense.id, month, year },
              sound: true,
            },
            trigger: { date: t } as Notifications.DateTriggerInput,
            targetUserId: expense.holder_user_id ?? null,
          });
        }
      }

      // Type 4: autopay_warn — morning of due date, if still no balance
      if (prefs.push_autopay_warn && !hasBalance) {
        const t = triggerDate(expense.due_day, month, year, 'autopay_warn');
        if (t) {
          result.push({
            identifier: notifId('autopay_warn', expense.id, month, year),
            content: {
              title: strings.autopayWarnTitle,
              body: strings.autopayWarnBody(expense.name),
              data: { type: 'autopay_warn', expenseId: expense.id, month, year },
              sound: true,
            },
            trigger: { date: t } as Notifications.DateTriggerInput,
            targetUserId: expense.holder_user_id ?? null,
          });
        }
      }
      continue;
    }

    // ── Non-autopay types ──────────────────────────────────────────────
    if (!expense.is_autopay) {
      // Type 2: pay_3day — 3 days before
      if (prefs.push_pay_3day) {
        const t = triggerDate(expense.due_day, month, year, 'pay_3day');
        if (t) {
          result.push({
            identifier: notifId('pay_3day', expense.id, month, year),
            content: {
              title: strings.pay3dayTitle,
              body: strings.pay3dayBody(expense.name),
              data: { type: 'pay_3day', expenseId: expense.id, month, year },
              sound: true,
            },
            trigger: { date: t } as Notifications.DateTriggerInput,
            targetUserId: expense.holder_user_id ?? null,
          });
        }
      }

      // Type 3: pay_today — morning of due date
      if (prefs.push_pay_today) {
        const t = triggerDate(expense.due_day, month, year, 'pay_today');
        if (t) {
          result.push({
            identifier: notifId('pay_today', expense.id, month, year),
            content: {
              title: strings.payTodayTitle,
              body: strings.payTodayBody(expense.name),
              data: { type: 'pay_today', expenseId: expense.id, month, year },
              sound: true,
            },
            trigger: { date: t } as Notifications.DateTriggerInput,
            targetUserId: expense.holder_user_id ?? null,
          });
        }
      }
    }
  }

  return result;
}
