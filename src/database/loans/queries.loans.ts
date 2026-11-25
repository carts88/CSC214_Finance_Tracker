import { EXPENSE_COLUMNS } from "#/database/expenses/queries.expenses";
import {
	occurrencesThrough,
	type SqlFragment,
} from "#/database/finances/queries.finances";
import type { Frequency } from "#/database/schemas.recurrence";
import { getSql } from "#/db";
import { loanBalance } from "#/lib/utils/helpers/loan-payoff";

/**
 * A loan, with its balance and payment stats worked out from its payments.
 * Columns come from the `loans` table (db/init.sql + db/004_loans.sql).
 * Payments are expenses linked by `expenses.loan_id`; a repeating one counts
 * once each time it occurs.
 * - Money is whole cents, cast to float8 so it arrives as a JS number.
 * - `annual_interest_rate` is NUMERIC(6,4): 0.0525 = 5.25%.
 * - Dates are 'YYYY-MM-DD' text so they aren't shifted by the server's
 *   timezone.
 */
export interface LoanRow {
	id: string;
	name: string;
	/** Amount originally borrowed, in cents. */
	principal_amount: number;
	/** When the loan was taken out. */
	started_on: string;
	/** Yearly rate as a fraction, e.g. 0.0525 for 5.25%. */
	annual_interest_rate: number;
	/** Planned monthly payment, in cents. */
	payment_amount: number;
	/**
	 * The monthly repeating expense paying this loan, or null. It may have
	 * ended; see `autopay_next_on`.
	 */
	autopay_expense_id: string | null;
	/** Next autopay payment, today or later; null when autopay is off or ended. */
	autopay_next_on: string | null;
	created_at: string;
	/** What is still owed today, in cents (see `loanBalance`). */
	outstanding_balance: number;
	/** Sum of all payments so far, in cents. */
	total_paid: number;
	/** Interest added since the loan started, in cents. */
	interest_charged: number;
	/** Number of payments made so far. */
	payment_count: number;
	/** Date of the most recent payment, or null if none. */
	last_paid_on: string | null;
}

type LoanColumns = Omit<
	LoanRow,
	| "outstanding_balance"
	| "total_paid"
	| "interest_charged"
	| "payment_count"
	| "last_paid_on"
>;

/**
 * One payment made on a loan: one occurrence of an expense linked to it. A
 * repeating expense (autopay) gives one row per time it has happened.
 */
export interface LoanPaymentRow {
	/** The linked expense. Shared by every occurrence of a repeating one. */
	expense_id: string;
	/** Whole cents. */
	amount: number;
	paid_on: string;
	/** The expense's description. */
	note: string | null;
	/** 'never' for a one-off payment; otherwise how often it repeats. */
	frequency: Frequency;
}

/** The loan columns, as stored. `autopay_next_on` reuses the expense's own. */
const LOAN_COLUMNS = `
	loans.id
	, loans.name
	, loans.principal_amount::float8 AS principal_amount
	, loans.started_on::text AS started_on
	, loans.annual_interest_rate::float8 AS annual_interest_rate
	, loans.payment_amount::float8 AS payment_amount
	, loans.autopay_expense_id
	, (
		SELECT e.next_occurrence
		FROM (
			SELECT ${EXPENSE_COLUMNS} FROM expenses
			WHERE id = loans.autopay_expense_id
		) e
	) AS autopay_next_on
	, loans.created_at
`;

/**
 * The statements that read an account's loans (or just `loanId`): the loans,
 * every payment on them through today, and the database's today. Run them
 * in one `sql.transaction` (on their own, or at the end of a write) and pass
 * the last three results to `toLoanRows`.
 */
function loanReads(accountId: string, loanId: string | null = null) {
	const sql = getSql();
	return [
		sql`
			SELECT ${sql.unsafe(LOAN_COLUMNS)}
			FROM loans
			WHERE account_id = ${accountId}
				AND (${loanId}::uuid IS NULL OR id = ${loanId})
			ORDER BY annual_interest_rate DESC, principal_amount DESC, name
		`,
		sql`
			SELECT o.loan_id, o.on_date::text AS paid_on, o.amount::float8 AS amount
			FROM (${occurrencesThrough("expenses", accountId, sql`current_date`)}) o
			WHERE o.loan_id IS NOT NULL
				AND (${loanId}::uuid IS NULL OR o.loan_id = ${loanId})
		`,
		sql`SELECT current_date::text AS today`,
	];
}

/** Combines `loanReads` results into loans with their balances. */
function toLoanRows(results: readonly unknown[]): LoanRow[] {
	const [loans, payments, [{ today }]] = results.slice(-3) as [
		LoanColumns[],
		{ loan_id: string; paid_on: string; amount: number }[],
		{ today: string }[],
	];

	const byLoan = new Map<string, { paidOn: string; amount: number }[]>();
	for (const p of payments) {
		const list = byLoan.get(p.loan_id) ?? [];
		list.push({ paidOn: p.paid_on, amount: p.amount });
		byLoan.set(p.loan_id, list);
	}

	return loans.map((loan) => {
		const paid = byLoan.get(loan.id) ?? [];
		const { balance, totalPaid, interestCharged } = loanBalance({
			principal: loan.principal_amount,
			annualInterestRate: loan.annual_interest_rate,
			startedOn: loan.started_on,
			payments: paid,
			asOf: today,
		});
		return {
			...loan,
			outstanding_balance: balance,
			total_paid: totalPaid,
			interest_charged: interestCharged,
			payment_count: paid.length,
			// 'YYYY-MM-DD' strings compare correctly as text.
			last_paid_on: paid.reduce<string | null>(
				(latest, p) => (latest && latest > p.paidOn ? latest : p.paidOn),
				null,
			),
		};
	});
}

/**
 * All loans on a finance account with their balances, highest interest rate
 * first (the most expensive debt is usually the one to pay down first).
 */
export const getUserLoans = async ({
	accountId,
}: {
	accountId: string;
}): Promise<LoanRow[]> => {
	const sql = getSql();
	return toLoanRows(await sql.transaction(loanReads(accountId)));
};

/**
 * One loan on a finance account, with its balance.
 * @returns the loan, or null if it isn't on this account
 */
export const getUserLoan = async ({
	accountId,
	loanId,
}: {
	accountId: string;
	loanId: string;
}): Promise<LoanRow | null> => {
	const sql = getSql();
	const [loan] = toLoanRows(
		await sql.transaction(loanReads(accountId, loanId)),
	);
	return loan ?? null;
};

/** What saving a loan does to its autopay (monthly repeating expense). */
export type AutopayChange =
	/** Leave it as it is: running, stopped, or none. */
	| { kind: "keep" }
	/**
	 * Start a series on `startsOn` at the loan's monthly payment, ending any
	 * current one the day before so earlier payments keep their amount.
	 */
	| { kind: "start"; startsOn: string }
	/** End the current series after today's payment (if any). */
	| { kind: "stop" };

/**
 * Statements that end the loan's autopay series so it has no occurrence on
 * or after `cutoff`: a series that hasn't started by then is deleted, an
 * earlier one gets end_date = cutoff - 1. No-ops if there is no series.
 */
function endAutopay(accountId: string, loanId: string, cutoff: SqlFragment) {
	const sql = getSql();
	const series = sql`(
		SELECT autopay_expense_id FROM loans
		WHERE id = ${loanId} AND account_id = ${accountId}
	)`;
	return [
		sql`
			DELETE FROM expenses
			WHERE id = ${series} AND occurred_on >= ${cutoff}
		`,
		sql`
			UPDATE expenses
			SET end_date = ${cutoff} - 1
			WHERE id = ${series}
				AND occurred_on < ${cutoff}
				AND (end_date IS NULL OR end_date >= ${cutoff})
		`,
	];
}

/**
 * Creates or updates a loan and applies `autopay`, then reads it back, all
 * in one transaction. An update only applies if the loan belongs to
 * `accountId`, so one account can't overwrite another account's loan.
 * Renaming a loan also renames the category on its payment expenses.
 *
 * @param loanId the loan's id; for a new loan, a fresh `crypto.randomUUID()`
 * @returns the saved loan, or null if `loanId` belongs to another account
 */
export const saveUserLoan = async ({
	accountId,
	loanId,
	name,
	principalAmount,
	startedOn,
	annualInterestRate,
	paymentAmount,
	autopay,
}: {
	accountId: string;
	loanId: string;
	name: string;
	/** Whole cents. */
	principalAmount: number;
	/** 'YYYY-MM-DD'. */
	startedOn: string;
	/** Fraction, e.g. 0.0525. */
	annualInterestRate: number;
	/** Whole cents. */
	paymentAmount: number;
	autopay: AutopayChange;
}): Promise<LoanRow | null> => {
	const sql = getSql();
	// Every statement after the upsert checks account_id, so if the upsert
	// was refused (another account's loan) they all do nothing.
	const statements = [
		sql`
			INSERT INTO loans (id, account_id, name, principal_amount, started_on, annual_interest_rate, payment_amount)
			VALUES (
				${loanId}
				, ${accountId}
				, ${name}
				, ${principalAmount}
				, ${startedOn}::date
				, ${annualInterestRate}
				, ${paymentAmount}
			)
			ON CONFLICT (id) DO UPDATE SET
				name = EXCLUDED.name
				, principal_amount = EXCLUDED.principal_amount
				, started_on = EXCLUDED.started_on
				, annual_interest_rate = EXCLUDED.annual_interest_rate
				, payment_amount = EXCLUDED.payment_amount
			WHERE loans.account_id = EXCLUDED.account_id
		`,
		sql`
			UPDATE expenses
			SET category = left(${name}, 100)
			WHERE loan_id = ${loanId} AND account_id = ${accountId}
		`,
	];

	if (autopay.kind === "start") {
		const seriesId = crypto.randomUUID();
		statements.push(
			...endAutopay(accountId, loanId, sql`${autopay.startsOn}::date`),
			sql`
				INSERT INTO expenses (id, account_id, amount, occurred_on, category, description, frequency, loan_id)
				SELECT ${seriesId}, account_id, payment_amount, ${autopay.startsOn}::date,
					left(name, 100), 'Monthly loan payment (autopay)', 'monthly', id
				FROM loans
				WHERE id = ${loanId} AND account_id = ${accountId}
			`,
			sql`
				UPDATE loans SET autopay_expense_id = ${seriesId}
				WHERE id = ${loanId} AND account_id = ${accountId}
			`,
		);
	} else if (autopay.kind === "stop") {
		statements.push(...endAutopay(accountId, loanId, sql`(current_date + 1)`));
	}

	const [loan] = toLoanRows(
		await sql.transaction([...statements, ...loanReads(accountId, loanId)]),
	);
	return loan ?? null;
};

/**
 * Deletes a loan. Its autopay stops after today, and its payment expenses
 * are kept (their loan_id becomes NULL), since the money was still spent.
 *
 * @returns the deleted loan's id, or null if it isn't on this account
 */
export const removeUserLoan = async ({
	accountId,
	loanId,
}: {
	accountId: string;
	loanId: string;
}): Promise<{ id: string } | null> => {
	const sql = getSql();
	const results = (await sql.transaction([
		...endAutopay(accountId, loanId, sql`(current_date + 1)`),
		sql`
			DELETE FROM loans
			WHERE account_id = ${accountId} AND id = ${loanId}
			RETURNING id
		`,
	])) as { id: string }[][];
	return results.at(-1)?.[0] ?? null;
};

/**
 * Every payment made on a loan through today, newest first. A repeating
 * expense gives one row per occurrence. Empty if the loan isn't on this
 * account.
 */
export const getLoanPayments = async ({
	accountId,
	loanId,
}: {
	accountId: string;
	loanId: string;
}): Promise<LoanPaymentRow[]> => {
	const sql = getSql();
	return (await sql`
		SELECT
			o.id AS expense_id
			, o.amount::float8 AS amount
			, o.on_date::text AS paid_on
			, o.description AS note
			, o.frequency
		FROM (${occurrencesThrough("expenses", accountId, sql`current_date`)}) o
		WHERE o.loan_id = ${loanId}
		ORDER BY o.on_date DESC, o.created_at DESC
	`) as LoanPaymentRow[];
};
