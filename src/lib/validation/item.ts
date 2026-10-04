import { z } from "zod";

/**
 * Application-level enums. These mirror the Postgres CHECK constraints on
 * `public.items` (see migration 20261003211351_phase_2_schema.sql). Keep in
 * sync · drift between the two will surface as 400 errors at insert time.
 */
export const RECURRENCES = ["none", "weekly", "monthly", "quarterly", "yearly"] as const;
export const STATUSES = ["active", "snoozed", "done", "archived"] as const;
export const CURRENCIES = ["BDT", "USD", "EUR"] as const;

export const recurrenceSchema = z.enum(RECURRENCES);
export const statusSchema = z.enum(STATUSES);
export const currencySchema = z.enum(CURRENCIES);

export type Recurrence = (typeof RECURRENCES)[number];
export type Status = (typeof STATUSES)[number];
export type Currency = (typeof CURRENCIES)[number];

export const itemInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  categoryId: z.string().uuid(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  recurrence: recurrenceSchema,
  autoRenews: z.boolean(),
  amount: z.number().min(0).nullable(),
  currency: currencySchema.default("BDT"),
  notes: z.string().max(2000).nullable(),
});
export type ItemInput = z.infer<typeof itemInputSchema>;

// Database row mirrors (snake_case, matches `public.items` columns).
export interface ItemRow {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  notes: string | null;
  due_date: string; // YYYY-MM-DD
  status: Status;
  recurrence: Recurrence;
  auto_renews: boolean;
  amount: string | null; // numeric(14,2) -> string
  currency: Currency;
  snoozed_until: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}
