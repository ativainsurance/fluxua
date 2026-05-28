-- Transfer Cycles — Phase 5
-- Adds: recurring_incomes (household-scoped income schedule)
-- Automatically seeds the W-2 payroll ($2 100, day 15) for any existing household
-- that does not yet have a recurring income row.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. RECURRING INCOMES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recurring_incomes (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id   UUID        NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  amount         NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  day_of_month   SMALLINT    NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_incomes_household
  ON recurring_incomes(household_id);

ALTER TABLE recurring_incomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Household members manage recurring incomes" ON recurring_incomes;
CREATE POLICY "Household members manage recurring incomes"
  ON recurring_incomes FOR ALL TO authenticated
  USING  (is_household_member(household_id))
  WITH CHECK (is_household_member(household_id));

-- updated_at trigger
DROP TRIGGER IF EXISTS recurring_incomes_updated_at ON recurring_incomes;
CREATE TRIGGER recurring_incomes_updated_at
  BEFORE UPDATE ON recurring_incomes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SEED: W-2 payroll ($2 100, day 15) for each existing household
--    that does not yet have any recurring income configured.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  hid UUID;
BEGIN
  FOR hid IN
    SELECT h.id
    FROM households h
    WHERE NOT EXISTS (
      SELECT 1 FROM recurring_incomes ri WHERE ri.household_id = h.id
    )
  LOOP
    INSERT INTO recurring_incomes (household_id, name, amount, day_of_month, is_active)
    VALUES (hid, 'W-2 Payroll', 2100.00, 15, true);
  END LOOP;
END;
$$;
