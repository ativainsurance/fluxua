// ─────────────────────────────────────────────
// Core Data Types
// ─────────────────────────────────────────────

export type ExpenseType = 'personal' | 'business';

/** The three fixed 50/30/20 budget buckets. Never user-editable as a set. */
export type BudgetBucket = 'needs' | 'wants' | 'debt';

/**
 * Default bucket for each built-in category.
 * Credit cards (is_variable_amount) always override to 'debt' regardless of category.
 */
export const CATEGORY_BUCKET_DEFAULT: Record<string, BudgetBucket> = {
  housing:       'needs',
  utilities:     'needs',
  transport:     'needs',
  food:          'needs',
  health:        'needs',
  insurance:     'needs',
  education:     'needs',
  subscriptions: 'wants',
  entertainment: 'wants',
  savings:       'debt',
  business:      'needs',
  other:         'needs',
};

/** Smart default bucket for a new or edited commitment. */
export const defaultBudgetBucket = (
  category: string,
  isVariableAmount: boolean
): BudgetBucket => {
  if (isVariableAmount) return 'debt';
  return CATEGORY_BUCKET_DEFAULT[category] ?? 'needs';
};

export type RecurrenceType = 'monthly' | 'weekly' | 'quarterly' | 'semiannual' | 'yearly' | 'one-time';

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semiannual: 'Semiannual',
  yearly: 'Yearly',
  'one-time': 'One-time',
};

export type ExpenseCategory = string;

export const BUILT_IN_CATEGORIES = [
  'housing', 'utilities', 'transport', 'food',
  'health', 'subscriptions', 'education', 'entertainment',
  'insurance', 'savings', 'business', 'other',
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  housing: 'Housing',
  utilities: 'Utilities',
  transport: 'Transport',
  food: 'Food & Dining',
  health: 'Health & Medical',
  subscriptions: 'Subscriptions',
  education: 'Education',
  entertainment: 'Entertainment',
  insurance: 'Insurance',
  savings: 'Savings',
  business: 'Business',
  other: 'Other',
};

export const CATEGORY_ICONS: Record<string, string> = {
  housing: 'home',
  utilities: 'flash',
  transport: 'car',
  food: 'restaurant',
  health: 'medkit',
  subscriptions: 'repeat',
  education: 'school',
  entertainment: 'game-controller',
  insurance: 'shield',
  savings: 'wallet',
  business: 'briefcase',
  other: 'ellipsis-horizontal',
};

/** Returns the icon name for any category (built-in or custom) */
export const getCategoryIcon = (category: string): string =>
  CATEGORY_ICONS[category] ?? 'tag-outline';

export type AutopayMethod = 'card' | 'ach';

/**
 * Expense — the "template" that defines a recurring bill.
 * Stored in the `expenses` table.
 */
export interface Expense {
  id: string;
  user_id: string;
  /** Household member who "owns" this commitment — null = all members notified */
  holder_user_id?: string | null;
  name: string;
  amount: number;
  category: string;
  type: ExpenseType;
  /** Day of month when bill is due (1–31) */
  due_day: number;
  is_recurring: boolean;
  recurrence_type: RecurrenceType;
  notes?: string;
  /** Date this expense becomes active (ISO date 'YYYY-MM-DD') */
  start_date?: string;
  /** Date this expense ends — omit if ongoing (ISO date 'YYYY-MM-DD') */
  end_date?: string;
  /** Whether this bill is on autopay */
  is_autopay: boolean;
  /** Payment method used for autopay — card or ACH bank transfer */
  autopay_method?: AutopayMethod;
  /** Last 4 digits of the card or bank account number used for autopay */
  autopay_last4?: string;
  /** True when this expense's amount changes each cycle (e.g. credit card statement balance) */
  is_variable_amount: boolean;
  /** Which 50/30/20 bucket this commitment belongs to */
  budget_bucket: BudgetBucket;
  /** Optional emoji displayed as the commitment's leading icon */
  emoji?: string;
  created_at: string;
  updated_at: string;
}

/**
 * ExpenseRecord — tracks paid/unpaid status for a specific month.
 * Stored in the `expense_records` table.
 */
export interface ExpenseRecord {
  id: string;
  expense_id: string;
  user_id: string;
  month: number;   // 1–12
  year: number;
  is_paid: boolean;
  paid_date?: string;
  /** Actual amount paid this month — may differ from the planned Expense.amount */
  actual_amount?: number;
  /** Late fee charged on top of the actual amount */
  late_fee?: number;
  /** Credit applied toward this expense before paying the remainder */
  credit_amount?: number;
  /** True when the expense was fully waived (no payment needed) */
  is_waived?: boolean;
  /** True when the expense is manually excluded from this specific month */
  is_excluded?: boolean;
  /** Pre-payment statement balance for variable-amount expenses (credit cards) */
  statement_balance?: number;
  created_at: string;
}

/**
 * CardPayment — one payment made toward a credit card statement.
 * Stored in the `card_payments` table.
 */
export interface CardPayment {
  id: string;
  statement_id: string;
  expense_id: string;  // resolved via join with expense_records, not stored in DB
  user_id: string;
  amount: number;
  payment_date: string;  // ISO YYYY-MM-DD
  notes?: string;
  created_at: string;
}

/**
 * ExpenseWithRecord — expense joined with its record for the current month.
 * Used in UI rendering.
 */
export interface ExpenseWithRecord extends Expense {
  record?: ExpenseRecord;
  /** Populated for is_variable_amount expenses when record exists */
  cardPayments?: CardPayment[];
}

/**
 * WeeklyBreakdown — splits a monthly amount into weekly chunks.
 */
export interface WeeklyBreakdown {
  week: number;         // 1–4 or 1–5
  startDay: number;
  endDay: number;
  amount: number;
  monthIndex: number;   // 0-based (for Date construction)
  year: number;
}

/**
 * MonthlySummary — aggregated totals for a given month.
 */
export interface MonthlySummary {
  total: number;
  totalPaid: number;
  totalUnpaid: number;
  personalTotal: number;
  businessTotal: number;
  expenseCount: number;
  paidCount: number;
}

// ─────────────────────────────────────────────
// Form Types
// ─────────────────────────────────────────────

export interface ExpenseFormData {
  name: string;
  amount: string;
  category: string;
  type: ExpenseType;
  due_day: number;
  is_recurring: boolean;
  recurrence_type: RecurrenceType;
  notes: string;
  /** ISO date string 'YYYY-MM-DD' — when this expense first applies */
  start_date: string;
  /** ISO date string 'YYYY-MM-DD' — when this expense ends; empty = ongoing */
  end_date: string;
  /** Whether this bill is on autopay */
  is_autopay: boolean;
  /** card or ach — only relevant when is_autopay is true */
  autopay_method: AutopayMethod;
  /** Last 4 digits of the card or bank account used for autopay */
  autopay_last4: string;
  /** True when this expense's amount changes each cycle (e.g. credit card statement balance) */
  is_variable_amount: boolean;
  /** Which 50/30/20 bucket this commitment belongs to */
  budget_bucket: BudgetBucket;
  /** Optional emoji icon — empty string means none */
  emoji: string;
  /** User ID of the household member responsible for this commitment (empty = all) */
  holder_user_id: string;
}

// ─────────────────────────────────────────────
// Budget / Financial Profile Types
// ─────────────────────────────────────────────

/**
 * FinancialProfile — one row per user, stores manual inputs for the 50/30/20 snapshot.
 * cc_debt_override: null = auto-derive from active card statements.
 * household_id: reserved for Phase 3 shared household budgets.
 */
export interface FinancialProfile {
  id: string;
  user_id: string;
  household_id?: string;
  annual_after_tax_income: number | null;
  total_assets: number | null;
  total_other_loans_balance: number | null;
  cc_debt_override: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * BudgetSnapshot — all computed 50/30/20 outputs. Never stored, always derived.
 */
export interface BudgetSnapshot {
  monthly: number;
  needs: number;
  wants: number;
  savings: number;
  emergencyTarget: number;
  /** null when savings === 0 */
  monthsToFundEmergency: number | null;
  /** null when savings === 0 or no CC debt */
  monthsToPayoffCC: number | null;
  /** null when savings === 0 or no other loans */
  yearsToPayoffLoans: number | null;
  retirementMonthly: number;
  effectiveCCDebt: number;
  liabilities: number;
  netWorth: number;
}

// ─────────────────────────────────────────────
// Household Types
// ─────────────────────────────────────────────

export interface Household {
  id: string;
  name: string;
  join_code: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface HouseholdMember {
  household_id: string;
  user_id: string;
  display_name?: string;
  email?: string;
  role: 'owner' | 'member';
  joined_at: string;
}

// ─────────────────────────────────────────────
// Custom Category Type (shared via Supabase)
// ─────────────────────────────────────────────

export interface CustomCategory {
  id: string;
  household_id: string;
  created_by: string | null;
  key: string;
  label: string;
  emoji?: string;
  created_at: string;
}

// ─────────────────────────────────────────────
// Recurring Income Types
// ─────────────────────────────────────────────

/**
 * RecurringIncome — a periodic income that arrives in the personal bank account
 * on a fixed day each month (e.g. W-2 payroll on the 15th).
 */
export interface RecurringIncome {
  id: string;
  household_id: string;
  name: string;
  amount: number;
  day_of_month: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecurringIncomeFormData {
  name: string;
  amount: string;
  day_of_month: number;
  is_active: boolean;
}

/** One commitment inside a transfer cycle (personal only, non-card). */
export interface CycleCommitment {
  expense: ExpenseWithRecord;
  /** Effective amount (statement_balance ?? amount) */
  amount: number;
  isPaid: boolean;
  isWaived: boolean;
}

/** One of the two bi-weekly transfer cycles per month. */
export interface TransferCycle {
  /** 1 = transfer on 9th, covers 10–22; 2 = transfer on 23rd, covers 23–9 next */
  cycleNumber: 1 | 2;
  /** Day the manual transfer should be made */
  transferDay: number;
  /** Human-readable window label */
  windowLabel: string;
  /** Calendar month this cycle is anchored to */
  month: number;
  year: number;
  /** Personal commitments (non-card) whose due_day falls in this window */
  commitments: CycleCommitment[];
  /** Recurring incomes whose day_of_month falls in this window */
  incomeInWindow: { name: string; amount: number; day: number }[];
  /** Sum of all personal commitments in window (paid + unpaid) */
  totalNeeded: number;
  /** Sum of already-paid / waived personal commitments */
  totalSettled: number;
  /** Sum of recurring income amounts in this window */
  incomeTotal: number;
  /**
   * Cash that must come from the business account:
   * max(0, totalNeeded - totalSettled - incomeTotal)
   */
  manualTransfer: number;
}

// ─────────────────────────────────────────────
// Notification Types
// ─────────────────────────────────────────────

export interface NotificationPreferences {
  user_id: string;
  push_stmt_reminder: boolean;
  push_pay_3day: boolean;
  push_pay_today: boolean;
  push_autopay_warn: boolean;
  email_weekly_digest: boolean;
  /** 0 = Sunday … 6 = Saturday */
  email_digest_day: number;
  /** 0–23 hour of day (local) */
  email_digest_hour: number;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────
// Auth Types
// ─────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
}
