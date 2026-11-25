import { format, parse } from "date-fns";


/**
 * 
 * formats a date string in the format 'YYYY-MM-DD' to a more readable format like "Nov 14, 2026". The input date is parsed as a local date without any timezone shift.
 * 
 * @param value  a date string in the format 'YYYY-MM-DD'
 * @returns date
 */
export function formatDate(value: string) {
    return format(parse(value, "yyyy-MM-dd", new Date()), "MMM d, yyyy");
}

/**
 * A month and year like "Mar 2024", from a Date or a 'YYYY-MM-DD' string
 * (parsed as a local date, like `formatDate`).
 */
export function formatMonthYear(value: Date | string) {
    const date =
        typeof value === "string" ? parse(value, "yyyy-MM-dd", new Date()) : value;
    return format(date, "MMM yyyy");
}