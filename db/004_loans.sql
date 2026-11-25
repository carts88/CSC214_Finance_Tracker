-- migrations/004_loans.sql
-- Loan management: loans linked to their payments, which are expenses.
--
-- Run this once in the Neon SQL Editor, after init.sql (and the recurring
-- expenses migration that adds expenses.frequency / end_date).
--
--   * A loan's balance isn't stored: the app works it out from
--     principal_amount on started_on, plus a month's interest at
--     annual_interest_rate on each monthly anniversary, minus every payment.
--   * A payment is an expense with loan_id set (its category is the loan's
--     name); a repeating one counts once each time it occurs. Deleting a
--     loan keeps its payments as ordinary expenses (SET NULL).
--   * autopay_expense_id is the monthly repeating expense the app creates
--     for the loan's payment. Deleting that expense just clears the link.

BEGIN;

ALTER TABLE loans DROP COLUMN outstanding_balance;

ALTER TABLE loans ADD COLUMN started_on DATE;   -- when the loan was taken out
UPDATE loans SET started_on = created_at::date;
ALTER TABLE loans
    ALTER COLUMN started_on SET NOT NULL,
    ALTER COLUMN started_on SET DEFAULT current_date;

ALTER TABLE expenses
    ADD COLUMN loan_id UUID REFERENCES loans(id) ON DELETE SET NULL;
CREATE INDEX expenses_loan_idx ON expenses (loan_id) WHERE loan_id IS NOT NULL;

ALTER TABLE loans
    ADD COLUMN autopay_expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL;

COMMIT;
