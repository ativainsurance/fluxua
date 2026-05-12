// ─────────────────────────────────────────────
// Core Data Types
// ─────────────────────────────────────────────

export type ExpenseType = 'personal' | 'business';

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

/** Returns the display label for any category (built-in or custom) */
export const getCategoryLabel = (category: string): string =>
  CATEGORY_LABELS[category] ?? category;

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
  created_at: string;
}

/**
 * ExpenseWithRecord — expense joined with its record for the current month.
 * Used in UI rendering.
 */
export interface ExpenseWithRecord extends Expense {
  record?: ExpenseRecord;
}

/**
 * WeeklyBreakdown — splits a monthly amount into weekly chunks.
 */
export interface WeeklyBreakdown {
  week: number;         // 1–4 or 1–5
  startDay: number;
  endDay: number;
  amount: number;
  label: string;        // e.g., "Week 1 · May 1–7"
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
}

// ─────────────────────────────────────────────
// Auth Types
// ─────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
}
