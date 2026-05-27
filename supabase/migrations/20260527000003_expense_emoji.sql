-- Optional emoji / visual identity for commitments (Phase 3 visual identity)
-- Adds a nullable emoji text column to expenses.
-- No RLS changes needed — inherits the existing expenses policy.
-- Run once in the Supabase dashboard SQL editor.

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS emoji TEXT;
