import type { ExpenseRow } from "#/database/expenses/queries.expenses";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface IExpenseTable {
    expenses: ExpenseRow[];
}

export const ExpenseTable = ({
    expenses
} :  IExpenseTable) => {
    return (
        <Table>
            <TableCaption>All your expenses</TableCaption>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                        <TableCell>{expense.occurred_on}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>${(expense.amount / 100).toFixed(2)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}