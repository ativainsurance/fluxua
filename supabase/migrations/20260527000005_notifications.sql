-- Notifications support (Phase 4)
-- Adds: notification_preferences (per-user) + holder_user_id on expenses
-- Run once in the Supabase dashboard SQL editor.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. NOTIFICATION PREFERENCES (per-user, not per-household)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Push notification toggles
  push_stmt_reminder   BOOLEAN     NOT NULL DEFAULT true,
  push_pay_3day        BOOLEAN     NOT NULL DEFAULT true,
  push_pay_today       BOOLEAN     NOT NULL DEFAULT true,
  push_autopay_warn    BOOLEAN     NOT NULL DEFAULT true,
  -- Email digest
  email_weekly_digest  BOOLEAN     NOT NULL DEFAULT false,
  -- 0 = Sunday … 6 = Saturday
  email_digest_day     SMALLINT    NOT NULL DEFAULT 0 CHECK (email_digest_day BETWEEN 0 AND 6),
  -- 0–23 in user's local time (stored as UTC hour, Edge Function adjusts)
  email_digest_hour    SMALLINT    NOT NULL DEFAULT 18 CHECK (email_digest_hour BETWEEN 0 AND 23),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notification prefs" ON notification_preferences;
CREATE POLICY "Users manage own notification prefs"
  ON notification_preferences FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
DROP TRIGGER IF EXISTS notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. holder_user_id ON expenses
-- Identifies which household member "owns" / is responsible for a commitment.
-- NULL = unassigned (all members get notified).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS holder_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_holder_user ON expenses(holder_user_id);
