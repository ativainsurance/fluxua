-- Fix: anchor_date should derive from start_date + due_day, not be set to current month
UPDATE expenses
SET anchor_date = (
  CASE
    WHEN EXTRACT(DAY FROM start_date) <= due_day THEN
      DATE_TRUNC('month', start_date)::date + (due_day - 1) * INTERVAL '1 day'
    ELSE
      (DATE_TRUNC('month', start_date) + INTERVAL '1 month')::date + (due_day - 1) * INTERVAL '1 day'
  END
)
WHERE frequency_type = 'monthly';