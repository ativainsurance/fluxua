-- Credit card payment tracking (Phase 2)
-- Separates statement (what is owed) from payments (when cash left the account).
-- Run once in the Supabase dashboard SQL editor.

-- 1. Create card_payments table
CREATE TABLE IF NOT EXISTS card_payments (
  id            UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  statement_id  UUID          NOT NULL REFERENCES expense_records(id) ON DELETE CASCADE,
  user_id       UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount        DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_date  DATE          NOT NULL DEFAULT CURRENT_DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_card_payments_statement ON card_payments(statement_id);
CREATE INDEX IF NOT EXISTS idx_card_payments_user_date ON card_payments(user_id, payment_date);

ALTER TABLE card_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own card payments" ON card_payments;
CREATE POLICY "Users manage own card payments"
  ON card_payments FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Migrate existing Phase 1 paid variable statements → one payment row each
-- Skips records where actual_amount and statement_balance are both null/zero.
INSERT INTO card_payments (statement_id, user_id, amount, payment_date, notes)
SELECT
  er.id                                                    AS statement_id,
  er.user_id,
  GREATEST(COALESCE(er.actual_amount, er.statement_balance, e.amount), 0.01) AS amount,
  COALESCE(er.paid_date::DATE, CURRENT_DATE)               AS payment_date,
  'Migrated from Phase 1 paid status'                      AS notes
FROM expense_records er
JOIN expenses e ON e.id = er.expense_id
WHERE e.is_variable_amount = true
  AND er.is_paid = true
  AND COALESCE(er.actual_amount, er.statement_balance) IS NOT NULL
  AND COALESCE(er.actual_amount, er.statement_balance) > 0
ON CONFLICT DO NOTHING;
