import { z } from "zod";

export const RECURRENCES = ["none", "weekly", "monthly", "quarterly", "yearly"] as const;
export const STATUSES = ["active", "snoozed", "done", "archived"] as const;
export const CURRENCIES = ["BDT", "USD", "EUR"] as const;

export const recurrenceSchema = z.enum(RECURRENCES);
export const statusSchema = z.enum(STATUSES);
export const currencySchema = z.enum(CURRENCIES);

export type Recurrence = (typeof RECURRENCES)[number];
export type Status = (typeof STATUSES)[number];

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
