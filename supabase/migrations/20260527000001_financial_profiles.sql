-- Financial profile for 50/30/20 budget snapshot (Phase 1)
-- One row per user. household_id is reserved for Phase 3 (shared household budgets).
-- Run once in the Supabase dashboard SQL editor.

-- 1. Create financial_profiles table
CREATE TABLE IF NOT EXISTS financial_profiles (
  id                          UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                     UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id                UUID,                        -- Phase 3: shared household scope
  annual_after_tax_income     DECIMAL(14,2),               -- manual input
  total_assets                DECIMAL(14,2),               -- manual: cash + home + investments + valuables
  total_other_loans_balance   DECIMAL(14,2),               -- manual: outstanding balance of non-CC loans
  cc_debt_override            DECIMAL(14,2),               -- NULL = auto-derived from card statements
  created_at                  TIMESTAMPTZ   DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE (user_id)                                         -- one profile per user for now
);

CREATE INDEX IF NOT EXISTS idx_financial_profiles_user ON financial_profiles(user_id);

ALTER TABLE financial_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own financial profile" ON financial_profiles;
CREATE POLICY "Users manage own financial profile"
  ON financial_profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
