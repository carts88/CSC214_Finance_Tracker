-- migrations/001_init.sql
-- Finance Tracking App (Group 2, CSC 214) — initial schema for Neon Postgres.
-- This was built from the class diagram in Final_UMLSequence_sheets.
--
-- Conventions
--   * Money is stored as whole cents in BIGINT ($12.50 -> 1250).
--   * Every financial record belongs to an ACCOUNT, not a user.
--     Users reach accounts through account_members (personal and business alike).
--   * ON DELETE CASCADE from finance_accounts -> records means deleting an account, and all of its attached records
--     deletes all of its data (the "delete my account and all data" requirement).
--   * gen_random_uuid() is built into Postgres 13+ (Neon supports it).

BEGIN;

-- ---------- Enums (the diagram's enum types) ----------

CREATE TYPE account_type        AS ENUM ('personal', 'business');
CREATE TYPE membership_role     AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE membership_status   AS ENUM ('invited', 'active', 'removed');
CREATE TYPE recurrence_frequency AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled');
CREATE TYPE goal_status         AS ENUM ('active', 'completed', 'abandoned');
CREATE TYPE contribution_source AS ENUM ('manual', 'automatic');
CREATE TYPE theme               AS ENUM ('light', 'dark', 'system');

-- ---------- Identity & access ----------

-- Users, sessions and passwords live in Neon Auth (Better Auth), in the
-- neon_auth schema. We do NOT create a users table; we reference
-- neon_auth."user"(id) instead. The diagram's User class maps to that table.
--
-- CHECK FIRST: run this in the Neon SQL Editor before running this file:
--   SELECT data_type FROM information_schema.columns
--   WHERE table_schema = 'neon_auth' AND table_name = 'user' AND column_name = 'id';
-- If it says 'uuid', leave this file alone. If it says 'text', replace
-- "UUID NOT NULL REFERENCES neon_auth" with "TEXT NOT NULL REFERENCES neon_auth"
-- and "UUID PRIMARY KEY REFERENCES neon_auth" with "TEXT PRIMARY KEY REFERENCES neon_auth" (2 places).

-- Named finance_accounts (not "accounts") so it is never confused with
-- Better Auth's own neon_auth.account table, which stores login credentials.
-- Account + PersonalAccount + BusinessAccount collapsed into ONE table
-- ("single-table inheritance"). Business-only columns are nullable.
-- PersonalAccount.ownerId is replaced by an 'owner' row in account_members.
CREATE TABLE finance_accounts (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    type          account_type NOT NULL,
    base_currency CHAR(3) NOT NULL DEFAULT 'USD',   -- ISO 4217 code
    legal_name    TEXT,                             -- business only
    tax_id        TEXT,                             -- business only
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (type = 'business' OR (legal_name IS NULL AND tax_id IS NULL))
);

-- Junction table for the many-to-many User <-> Account relationship.
-- Deleting a user removes their memberships; the app should also delete
-- any finance_accounts where they were the only owner (e.g. their personal one).
CREATE TABLE account_members (
    user_id    UUID NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
    role       membership_role   NOT NULL DEFAULT 'member',
    status     membership_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, account_id)
);
CREATE INDEX account_members_account_idx ON account_members (account_id);

-- 1-to-1 with users: user_id is both the primary key and the foreign key.
CREATE TABLE user_preferences (
    user_id      UUID PRIMARY KEY REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
    currency     CHAR(3) NOT NULL DEFAULT 'USD',
    theme        theme   NOT NULL DEFAULT 'system',
    compact_mode BOOLEAN NOT NULL DEFAULT false,
    font_size    TEXT    NOT NULL DEFAULT 'md' CHECK (font_size IN ('sm', 'md', 'lg'))
);

-- ---------- Financial records (Account 1 ---- 0..* Record) ----------

CREATE TABLE incomes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id  UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
    amount      BIGINT NOT NULL CHECK (amount > 0),
    occurred_on DATE   NOT NULL,
    source      TEXT   NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX incomes_account_date_idx ON incomes (account_id, occurred_on);

CREATE TABLE expenses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id  UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
    amount      BIGINT NOT NULL CHECK (amount > 0),
    occurred_on DATE   NOT NULL,
    category    TEXT   NOT NULL,
    description TEXT,                                 -- not in diagram
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX expenses_account_date_idx ON expenses (account_id, occurred_on);

-- Also holds other recurring charges (utilities, food budget): the diagram's
-- "recurring charges" association points here.
CREATE TABLE subscriptions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id   UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
    name         TEXT   NOT NULL,                     -- not in diagram
    amount       BIGINT NOT NULL CHECK (amount > 0),
    frequency    recurrence_frequency NOT NULL,
    status       subscription_status  NOT NULL DEFAULT 'active',
    next_renewal DATE   NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX subscriptions_account_idx ON subscriptions (account_id);

CREATE TABLE loans (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id           UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
    name                 TEXT   NOT NULL,             -- not in diagram
    principal_amount     BIGINT NOT NULL CHECK (principal_amount > 0),
    outstanding_balance  BIGINT NOT NULL CHECK (outstanding_balance >= 0),
    annual_interest_rate NUMERIC(6,4) NOT NULL CHECK (annual_interest_rate >= 0), -- 0.0525 = 5.25%
    payment_amount       BIGINT NOT NULL CHECK (payment_amount > 0),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX loans_account_idx ON loans (account_id);

CREATE TABLE assets (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
    name       TEXT    NOT NULL,
    value      BIGINT  NOT NULL CHECK (value >= 0),
    is_cash    BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX assets_account_idx ON assets (account_id);

-- saved_amount is NOT stored: compute it as SUM(savings_contributions.amount)
-- so it can never drift out of sync with the contributions.
CREATE TABLE savings_goals (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id    UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
    name          TEXT   NOT NULL,                    -- not in diagram
    target_amount BIGINT NOT NULL CHECK (target_amount > 0),
    target_date   DATE,
    status        goal_status NOT NULL DEFAULT 'active',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX savings_goals_account_idx ON savings_goals (account_id);

-- SavingsGoal 1 ---- 0..* SavingsContribution
CREATE TABLE savings_contributions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id        UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
    amount         BIGINT NOT NULL CHECK (amount > 0),
    contributed_on DATE   NOT NULL,
    source         contribution_source NOT NULL DEFAULT 'manual',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX savings_contributions_goal_idx ON savings_contributions (goal_id);

COMMIT;