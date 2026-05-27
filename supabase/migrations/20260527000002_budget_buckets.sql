-- Budget bucket classification for 50/30/20 rule (Phase 2)
-- Adds budget_bucket column to expenses.
-- Values: 'needs' (50%), 'wants' (30%), 'debt' (20% savings+debt bucket).
-- Existing rows are backfilled from their category via the default mapping.
-- Run once in the Supabase dashboard SQL editor.

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS budget_bucket TEXT NOT NULL DEFAULT 'needs'
  CHECK (budget_bucket IN ('needs', 'wants', 'debt'));

-- Backfill existing rows: credit cards always → debt; then by category.
-- Two-pass: category first, then override for is_variable_amount.
UPDATE expenses
SET budget_bucket = CASE category
  WHEN 'housing'        THEN 'needs'
  WHEN 'utilities'      THEN 'needs'
  WHEN 'transport'      THEN 'needs'
  WHEN 'food'           THEN 'needs'
  WHEN 'health'         THEN 'needs'
  WHEN 'insurance'      THEN 'needs'
  WHEN 'education'      THEN 'needs'
  WHEN 'subscriptions'  THEN 'wants'
  WHEN 'entertainment'  THEN 'wants'
  WHEN 'savings'        THEN 'debt'
  WHEN 'business'       THEN 'needs'
  ELSE                       'needs'
END;

-- Credit cards (variable amount) → debt bucket regardless of category.
UPDATE expenses
SET budget_bucket = 'debt'
WHERE is_variable_amount = true;
