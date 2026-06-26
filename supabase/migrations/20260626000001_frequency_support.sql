BEGIN;

-- Add frequency columns to expenses table.
-- frequency_type: the repeat pattern (default 'monthly' for all existing data).
-- frequency_interval: used only for 'every_n_weeks' (e.g. 3 for "every 3 weeks").
-- anchor_date: the first occurrence date — replaces due_day as the single source
--              of truth for when a commitment occurs within a period.
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS frequency_type     TEXT    NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS frequency_interval INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS anchor_date        DATE;

-- Backfill: set anchor_date to current-month + due_day, clamped to end of month.
UPDATE expenses
SET anchor_date = MAKE_DATE(
  EXTRACT(YEAR  FROM CURRENT_DATE)::INT,
  EXTRACT(MONTH FROM CURRENT_DATE)::INT,
  LEAST(
    due_day,
    EXTRACT(DAY FROM (
      DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'
    ))::INT
  )
);

ALTER TABLE expenses ALTER COLUMN anchor_date SET NOT NULL;

COMMIT;
