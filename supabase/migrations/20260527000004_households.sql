-- Household shared-data model (Phase 3)
-- Two users sharing one household see the same commitments, cards, payments,
-- budget profile, and custom categories.
-- Run once in the Supabase dashboard SQL editor.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. HOUSEHOLDS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS households (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT        NOT NULL,
  join_code  TEXT        NOT NULL UNIQUE
               DEFAULT UPPER(LEFT(REPLACE(gen_random_uuid()::text, '-', ''), 8)),
  created_by UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_households_join_code ON households(join_code);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. HOUSEHOLD MEMBERS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS household_members (
  household_id UUID        NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT        NOT NULL DEFAULT 'member'
                             CHECK (role IN ('owner', 'member')),
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (household_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_household_members_user ON household_members(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. SECURITY DEFINER MEMBERSHIP HELPER
-- Avoids recursive RLS when policies check household_members itself.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_household_member(hid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = hid AND user_id = auth.uid()
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ADD household_id TO EXISTING TABLES
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE expenses       ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id) ON DELETE CASCADE;
ALTER TABLE expense_records ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id) ON DELETE CASCADE;
ALTER TABLE card_payments   ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id) ON DELETE CASCADE;

-- financial_profiles already has a nullable household_id column (reserved in Phase 1).
-- Add the FK constraint if not already present.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'financial_profiles_household_fk'
      AND table_name = 'financial_profiles'
  ) THEN
    ALTER TABLE financial_profiles
      ADD CONSTRAINT financial_profiles_household_fk
      FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
  END IF;
END;
$$;

-- Drop old unique-per-user constraint; household_id becomes the conflict key.
ALTER TABLE financial_profiles DROP CONSTRAINT IF EXISTS financial_profiles_user_id_key;
ALTER TABLE financial_profiles ADD CONSTRAINT financial_profiles_household_id_key UNIQUE (household_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. DATA MIGRATION
-- For each existing user, create one household, make them the owner,
-- and backfill every row they own.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  r        RECORD;
  new_hid  UUID;
BEGIN
  FOR r IN
    SELECT DISTINCT user_id FROM (
      SELECT user_id FROM expenses
      UNION
      SELECT user_id FROM expense_records
      UNION
      SELECT user_id FROM card_payments
      UNION
      SELECT user_id FROM financial_profiles
    ) t
    WHERE user_id IS NOT NULL
  LOOP
    -- Skip if this user already has a household (idempotent re-run).
    CONTINUE WHEN EXISTS (
      SELECT 1 FROM household_members WHERE user_id = r.user_id
    );

    INSERT INTO households (name, created_by)
    VALUES ('My Household', r.user_id)
    RETURNING id INTO new_hid;

    INSERT INTO household_members (household_id, user_id, role)
    VALUES (new_hid, r.user_id, 'owner');

    UPDATE expenses        SET household_id = new_hid WHERE user_id = r.user_id AND household_id IS NULL;
    UPDATE expense_records SET household_id = new_hid WHERE user_id = r.user_id AND household_id IS NULL;
    UPDATE card_payments   SET household_id = new_hid WHERE user_id = r.user_id AND household_id IS NULL;
    UPDATE financial_profiles SET household_id = new_hid WHERE user_id = r.user_id AND household_id IS NULL;
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. INDEXES ON household_id COLUMNS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_expenses_household        ON expenses(household_id);
CREATE INDEX IF NOT EXISTS idx_expense_records_household ON expense_records(household_id);
CREATE INDEX IF NOT EXISTS idx_card_payments_household   ON card_payments(household_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. CUSTOM CATEGORIES TABLE
-- Replaces AsyncStorage per-device storage — now shared within a household.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS custom_categories (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID        NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  created_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  key          TEXT        NOT NULL,
  label        TEXT        NOT NULL,
  emoji        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (household_id, key)
);

CREATE INDEX IF NOT EXISTS idx_custom_categories_household ON custom_categories(household_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. ROW LEVEL SECURITY — HOUSEHOLDS & MEMBERS
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE households        ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- households: members can view, only owner can update, nobody can delete (use RPCs).
DROP POLICY IF EXISTS "Household members can view their household" ON households;
CREATE POLICY "Household members can view their household"
  ON households FOR SELECT
  USING (is_household_member(id));

DROP POLICY IF EXISTS "Household owner can update name" ON households;
CREATE POLICY "Household owner can update name"
  ON households FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_id = households.id AND user_id = auth.uid() AND role = 'owner'
    )
  );

-- household_members: members can see peers, RPCs handle insert/delete.
DROP POLICY IF EXISTS "Household members can view peers" ON household_members;
CREATE POLICY "Household members can view peers"
  ON household_members FOR SELECT
  USING (is_household_member(household_id));

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. REWRITE RLS ON EXISTING TABLES (household scope)
-- ─────────────────────────────────────────────────────────────────────────────

-- EXPENSES
DROP POLICY IF EXISTS "Users can view their own expenses"   ON expenses;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses;

CREATE POLICY "Household members can view expenses"
  ON expenses FOR SELECT
  USING (is_household_member(household_id));

CREATE POLICY "Household members can insert expenses"
  ON expenses FOR INSERT
  WITH CHECK (is_household_member(household_id) AND auth.uid() = user_id);

CREATE POLICY "Household members can update expenses"
  ON expenses FOR UPDATE
  USING (is_household_member(household_id));

CREATE POLICY "Household members can delete expenses"
  ON expenses FOR DELETE
  USING (is_household_member(household_id));

-- EXPENSE RECORDS
DROP POLICY IF EXISTS "Users can view their own records"   ON expense_records;
DROP POLICY IF EXISTS "Users can insert their own records" ON expense_records;
DROP POLICY IF EXISTS "Users can update their own records" ON expense_records;
DROP POLICY IF EXISTS "Users can delete their own records" ON expense_records;

CREATE POLICY "Household members can view expense records"
  ON expense_records FOR SELECT
  USING (is_household_member(household_id));

CREATE POLICY "Household members can insert expense records"
  ON expense_records FOR INSERT
  WITH CHECK (is_household_member(household_id) AND auth.uid() = user_id);

CREATE POLICY "Household members can update expense records"
  ON expense_records FOR UPDATE
  USING (is_household_member(household_id));

CREATE POLICY "Household members can delete expense records"
  ON expense_records FOR DELETE
  USING (is_household_member(household_id));

-- CARD PAYMENTS
DROP POLICY IF EXISTS "Users manage own card payments" ON card_payments;

CREATE POLICY "Household members can view card payments"
  ON card_payments FOR SELECT
  USING (is_household_member(household_id));

CREATE POLICY "Household members can insert card payments"
  ON card_payments FOR INSERT
  WITH CHECK (is_household_member(household_id) AND auth.uid() = user_id);

CREATE POLICY "Household members can update card payments"
  ON card_payments FOR UPDATE
  USING (is_household_member(household_id));

CREATE POLICY "Household members can delete card payments"
  ON card_payments FOR DELETE
  USING (is_household_member(household_id));

-- FINANCIAL PROFILES
DROP POLICY IF EXISTS "Users manage own financial profile" ON financial_profiles;

CREATE POLICY "Household members can manage financial profile"
  ON financial_profiles FOR ALL TO authenticated
  USING (is_household_member(household_id))
  WITH CHECK (is_household_member(household_id));

-- CUSTOM CATEGORIES
ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Household members can view custom categories" ON custom_categories;
CREATE POLICY "Household members can view custom categories"
  ON custom_categories FOR SELECT
  USING (is_household_member(household_id));

DROP POLICY IF EXISTS "Household members can insert custom categories" ON custom_categories;
CREATE POLICY "Household members can insert custom categories"
  ON custom_categories FOR INSERT
  WITH CHECK (is_household_member(household_id));

DROP POLICY IF EXISTS "Household members can delete custom categories" ON custom_categories;
CREATE POLICY "Household members can delete custom categories"
  ON custom_categories FOR DELETE
  USING (is_household_member(household_id));

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. RPCs — create_household / join_household
-- Run as SECURITY DEFINER so they can insert into household_members
-- without a SELECT policy loop on that table.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_household(household_name TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_hid UUID;
  result  json;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- If the caller already belongs to a household, error out.
  IF EXISTS (SELECT 1 FROM household_members WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'User already belongs to a household';
  END IF;

  INSERT INTO households (name, created_by)
  VALUES (TRIM(household_name), auth.uid())
  RETURNING id INTO new_hid;

  INSERT INTO household_members (household_id, user_id, role)
  VALUES (new_hid, auth.uid(), 'owner');

  SELECT row_to_json(h) INTO result FROM households h WHERE h.id = new_hid;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION join_household(join_code_input TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_hid UUID;
  result     json;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO target_hid
  FROM households
  WHERE join_code = UPPER(TRIM(join_code_input));

  IF target_hid IS NULL THEN
    RAISE EXCEPTION 'Invalid join code';
  END IF;

  -- Idempotent — do nothing if already a member.
  INSERT INTO household_members (household_id, user_id, role)
  VALUES (target_hid, auth.uid(), 'member')
  ON CONFLICT (household_id, user_id) DO NOTHING;

  SELECT row_to_json(h) INTO result FROM households h WHERE h.id = target_hid;
  RETURN result;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. updated_at trigger for households
-- ─────────────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS households_updated_at ON households;
CREATE TRIGGER households_updated_at
  BEFORE UPDATE ON households
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
