-- ─────────────────────────────────────────────────────────────────────────────
-- Expense Tracker — Supabase Database Schema
-- Run this in your Supabase project: Dashboard → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────
-- 1. EXPENSES TABLE
-- The "template" for each recurring bill.
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id              UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT          NOT NULL,
  amount          DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  category        TEXT          NOT NULL DEFAULT 'other',
  type            TEXT          NOT NULL DEFAULT 'personal' CHECK (type IN ('personal', 'business')),
  due_day         INTEGER       NOT NULL DEFAULT 1 CHECK (due_day >= 1 AND due_day <= 31),
  is_recurring    BOOLEAN       NOT NULL DEFAULT true,
  recurrence_type TEXT          NOT NULL DEFAULT 'monthly'
                    CHECK (recurrence_type IN ('weekly', 'monthly', 'quarterly', 'semiannual', 'yearly', 'one-time')),
  notes           TEXT,
  -- Date this expense first applies (null = always active from the beginning)
  start_date      DATE          DEFAULT CURRENT_DATE,
  -- Date this expense ends (null = ongoing with no end)
  end_date        DATE,
  -- Autopay tracking
  is_autopay      BOOLEAN       NOT NULL DEFAULT false,
  autopay_method  TEXT          CHECK (autopay_method IN ('card', 'ach')),
  autopay_last4   CHAR(4)       CHECK (autopay_last4 ~ '^[0-9]{4}$'),
  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   DEFAULT NOW()
);

-- ─────────────────────────────
-- 2. EXPENSE RECORDS TABLE
-- Tracks paid/unpaid status per expense per month.
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS expense_records (
  id             UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id     UUID          NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id        UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month          INTEGER       NOT NULL CHECK (month >= 1 AND month <= 12),
  year           INTEGER       NOT NULL CHECK (year >= 2020),
  is_paid        BOOLEAN       NOT NULL DEFAULT false,
  paid_date      TIMESTAMPTZ,
  -- Actual amount paid this month — may differ from the planned expenses.amount
  actual_amount  DECIMAL(10,2),
  -- Late fee charged on top of the actual amount
  late_fee       DECIMAL(10,2),
  -- Credit applied toward this expense (informational — actual_amount is the net paid)
  credit_amount  DECIMAL(10,2),
  -- Expense was fully waived this month (no payment needed)
  is_waived      BOOLEAN       NOT NULL DEFAULT false,
  -- Manually excluded from this month (e.g. cancelled, skipped, not applicable)
  is_excluded    BOOLEAN       NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ   DEFAULT NOW(),
  -- One record per expense per month
  UNIQUE (expense_id, month, year)
);

-- ─────────────────────────────
-- 3. PROFILES TABLE
-- Stores user preferences set at signup.
-- Auto-created via trigger when auth.users row is inserted.
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name    TEXT,
  business_name TEXT,
  account_type  TEXT          NOT NULL DEFAULT 'personal'
                                CHECK (account_type IN ('personal', 'business', 'both')),
  currency      TEXT          NOT NULL DEFAULT 'USD',
  language      TEXT          NOT NULL DEFAULT 'en',
  created_at    TIMESTAMPTZ   DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ─────────────────────────────
-- 4. AUTO-UPDATE updated_at
-- ─────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile row when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, business_name, account_type, currency, language)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'business_name',
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'personal'),
    COALESCE(NEW.raw_user_meta_data->>'currency', 'USD'),
    COALESCE(NEW.raw_user_meta_data->>'language', 'en')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────
-- 4. ROW LEVEL SECURITY (RLS)
-- Users can only see/edit their own data.
-- ─────────────────────────────
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_records ENABLE ROW LEVEL SECURITY;

-- Expenses policies
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Expense records policies
CREATE POLICY "Users can view their own records"
  ON expense_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own records"
  ON expense_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own records"
  ON expense_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own records"
  ON expense_records FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────
-- 5. INDEXES for performance
-- ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_records_user_month ON expense_records(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_expense_records_expense_id ON expense_records(expense_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION — run these if you already have the tables from a prior version:
-- ─────────────────────────────────────────────────────────────────────────────
-- ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_recurrence_type_check;
-- ALTER TABLE expenses ADD CONSTRAINT expenses_recurrence_type_check
--   CHECK (recurrence_type IN ('weekly', 'monthly', 'quarterly', 'semiannual', 'yearly', 'one-time'));
-- ALTER TABLE expenses ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;
-- ALTER TABLE expenses ADD COLUMN IF NOT EXISTS end_date DATE;
-- ALTER TABLE expense_records ADD COLUMN IF NOT EXISTS actual_amount DECIMAL(10,2);
-- ALTER TABLE expense_records ADD COLUMN IF NOT EXISTS late_fee DECIMAL(10,2);
-- ALTER TABLE expense_records ADD COLUMN IF NOT EXISTS credit_amount DECIMAL(10,2);
-- ALTER TABLE expense_records ADD COLUMN IF NOT EXISTS is_waived BOOLEAN NOT NULL DEFAULT false;
-- ALTER TABLE expense_records ADD COLUMN IF NOT EXISTS is_excluded BOOLEAN NOT NULL DEFAULT false;
-- Autopay columns (added in autopay feature update):
-- ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_autopay BOOLEAN NOT NULL DEFAULT false;
-- ALTER TABLE expenses ADD COLUMN IF NOT EXISTS autopay_method TEXT CHECK (autopay_method IN ('card', 'ach'));
-- ALTER TABLE expenses ADD COLUMN IF NOT EXISTS autopay_last4 CHAR(4) CHECK (autopay_last4 ~ '^[0-9]{4}$');
-- ─────────────────────────────────────────────────────────────────────────────
