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
// Auth Types
// ─────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
}
