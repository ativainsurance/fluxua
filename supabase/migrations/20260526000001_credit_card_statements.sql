-- Credit card statement tracking
-- Adds is_variable_amount flag to expenses and statement_balance to expense_records.
-- Run once in the Supabase dashboard SQL editor.

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS is_variable_amount BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE expense_records
  ADD COLUMN IF NOT EXISTS statement_balance DECIMAL(10,2);
