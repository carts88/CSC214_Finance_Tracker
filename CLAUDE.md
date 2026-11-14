# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Naming conventions

| Kind | Convention | Examples |
| --- | --- | --- |
| Files and folders | kebab-case | `add-expense-form.tsx`, `server-fn/`, `queries.expenses.ts` |
| React components | PascalCase | `AddExpenseForm`, `ExpenseTable` |
| Functions and variables | camelCase | `getUserExpenses`, `useSaveExpense`, `accountId` |
| Properties | snake_case | `occurred_on`, `account_id`, `expense_id`, `base_currency` |

"Properties" means the fields of data objects: database rows, Zod schemas and
the form values built from them, server-function payloads, and the argument
objects passed to query functions. Database columns are already snake_case, so
rows flow from SQL to the UI without renaming. Don't alias columns to camelCase.

- When you pull a property into a local variable, rename it while
  destructuring so variables stay camelCase:
  `({ account_id: accountId }) => ...`, then `{ account_id: accountId }` when
  passing it back on.
- React component props stay camelCase (`accountId`, `onSaved`, `canEdit`).
  JSX and every shadcn/library prop use camelCase, so mixing styles there
  would be confusing.
- Properties defined by third-party libraries (`context.user.sub`,
  `queryKey`, `onSubmit`) keep whatever name the library uses.
