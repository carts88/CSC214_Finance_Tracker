-- migrations/003_assets.sql
-- Adds the fields the asset management page needs to the `assets` table
-- created in init.sql (which only had name, value and is_cash).
--
-- Run this once in the Neon SQL Editor.
-- Existing rows get category 'Other' and an acquired date of the day they
-- were created.

BEGIN;

ALTER TABLE assets
    ADD COLUMN category    TEXT NOT NULL DEFAULT 'Other',
    ADD COLUMN description TEXT,
    ADD COLUMN acquired_on DATE;

UPDATE assets SET acquired_on = created_at::date WHERE acquired_on IS NULL;

ALTER TABLE assets
    ALTER COLUMN acquired_on SET NOT NULL,
    ALTER COLUMN acquired_on SET DEFAULT current_date;

COMMIT;
