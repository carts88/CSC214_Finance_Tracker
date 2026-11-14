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