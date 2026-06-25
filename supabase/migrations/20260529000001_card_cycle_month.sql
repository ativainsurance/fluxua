-- Phase 6: credit-card cycle_month semantics
--
-- expense_records.month/year for is_variable_amount expenses now represents
-- the PAYMENT DEBIT month (cycle_month), not the statement entry month.
--
-- All existing statements were entered for May 2026 but will autopay-debit
-- in June 2026, so we advance their month/year by one.
--
-- card_payments are wiped for a clean reset — they referenced statements
-- anchored to the wrong month and cannot be meaningfully preserved.
--
-- Verification after running:
--   SELECT expense_id, month, year, statement_balance
--   FROM expense_records er
--   JOIN expenses e ON e.id = er.expense_id
--   WHERE e.is_variable_amount = TRUE
--   ORDER BY year, month;
--   -- Expected: NO rows with month < 6 / year 2026. All previously-May
--   -- statements now show June 2026.
--
--   SELECT COUNT(*) FROM card_payments;
--   -- Expected: 0

BEGIN;

DO $$
DECLARE
  stmts_updated  INT := 0;
  pmts_deleted   INT := 0;
  conflicts_removed INT := 0;
BEGIN

  -- 1. Delete all card_payments first (they reference expense_records rows
  --    that are about to have their month/year changed).
  DELETE FROM card_payments;
  GET DIAGNOSTICS pmts_deleted = ROW_COUNT;
  RAISE NOTICE '% card payment(s) deleted (clean reset).', pmts_deleted;

  -- 2. Remove any EMPTY variable-amount records that sit in the TARGET months
  --    (months that source statements are being shifted into) to prevent
  --    unique-constraint conflicts during the advance.
  DELETE FROM expense_records er
  WHERE er.id IN (
    SELECT er_target.id
    FROM expense_records er_target
    JOIN expenses e_target ON e_target.id = er_target.expense_id
    WHERE e_target.is_variable_amount = TRUE
      AND (er_target.statement_balance IS NULL OR er_target.statement_balance = 0)
      AND EXISTS (
        SELECT 1
        FROM expense_records er_src
        JOIN expenses e_src ON e_src.id = er_src.expense_id
        WHERE e_src.is_variable_amount = TRUE
          AND er_src.statement_balance IS NOT NULL
          AND er_src.statement_balance > 0
          AND er_src.expense_id = er_target.expense_id
          AND (CASE WHEN er_src.month = 12 THEN 1  ELSE er_src.month + 1 END) = er_target.month
          AND (CASE WHEN er_src.month = 12 THEN er_src.year + 1 ELSE er_src.year END) = er_target.year
      )
  );
  GET DIAGNOSTICS conflicts_removed = ROW_COUNT;
  IF conflicts_removed > 0 THEN
    RAISE NOTICE '% empty target-month record(s) removed to avoid conflicts.', conflicts_removed;
  END IF;

  -- 3. Advance every variable-amount statement record by one calendar month.
  UPDATE expense_records
  SET
    month = CASE WHEN month = 12 THEN 1       ELSE month + 1 END,
    year  = CASE WHEN month = 12 THEN year + 1 ELSE year      END
  WHERE id IN (
    SELECT er.id
    FROM expense_records er
    JOIN expenses e ON e.id = er.expense_id
    WHERE e.is_variable_amount = TRUE
      AND er.statement_balance IS NOT NULL
      AND er.statement_balance > 0
  );
  GET DIAGNOSTICS stmts_updated = ROW_COUNT;
  RAISE NOTICE '% card statement record(s) advanced by one cycle month.', stmts_updated;

END $$;

COMMIT;
