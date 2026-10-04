"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionState, MutationResult } from "@/lib/actions/types";
import { requireUser } from "@/lib/supabase/require-user";
import { itemInputSchema } from "@/lib/validation/item";

const uuidSchema = z.string().uuid();

type OwnedItemResult =
  | { error: string }
  | {
      item: { id: string };
      supabase: Awaited<ReturnType<typeof requireUser>>["supabase"];
    };

/** Loads an item and verifies ownership; RLS also enforces this server-side. */
async function ownedItem(id: string): Promise<OwnedItemResult> {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return { error: "Invalid item id." } as const;

  const { user, supabase } = await requireUser();
  const { data, error } = await supabase
    .from("items")
    .select("id, user_id")
    .eq("id", parsed.data)
    .single();

  if (error || !data) return { error: "Item not found." };
  if (data.user_id !== user.id) return { error: "Item not found." };
  return { item: data, supabase };
}

/** FormData entries are strings; normalize to the shape itemInputSchema expects. */
function parseFormValue(formData: FormData) {
  const amountRaw = formData.get("amount");
  const amount =
    amountRaw == null || amountRaw === "" ? null : Number(amountRaw);

  return {
    title: formData.get("title"),
    notes: formData.get("notes") === "" ? null : formData.get("notes"),
    categoryId: formData.get("categoryId"),
    dueDate: formData.get("dueDate"),
    recurrence: formData.get("recurrence"),
    autoRenews: formData.get("autoRenews") === "on",
    amount,
    currency: formData.get("currency") ?? "BDT",
  };
}

/** Flattens a Zod error into { fieldName: message } for inline display. */
function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

export async function addItem(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user, supabase } = await requireUser();

  const parsed = itemInputSchema.safeParse(parseFormValue(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const { data: inserted, error } = await supabase
    .from("items")
    .insert({
      user_id: user.id,
      category_id: parsed.data.categoryId,
      title: parsed.data.title,
      notes: parsed.data.notes,
      due_date: parsed.data.dueDate,
      status: "active",
      recurrence: parsed.data.recurrence,
      auto_renews: parsed.data.autoRenews,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { ok: false, error: "Could not save the item. Please try again." };
  }

  // Default reminder offsets (spec: 30, 7, 1). Failures are non-fatal —
  // the item exists; reminders can be managed later.
  await supabase.from("reminders").insert(
    ([30, 7, 1] as const).map((days_before) => ({
      user_id: user.id,
      item_id: inserted.id,
      days_before,
    })),
  );

  revalidatePath("/app");
  return { ok: true };
}

export async function updateItem(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsedId = uuidSchema.safeParse(formData.get("id"));
  if (!parsedId.success) return { ok: false, error: "Invalid item id." };

  const result = await ownedItem(parsedId.data);
  if ("error" in result) return { ok: false, error: result.error };
  const { item, supabase } = result;

  const parsed = itemInputSchema.safeParse(parseFormValue(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const { error } = await supabase
    .from("items")
    .update({
      category_id: parsed.data.categoryId,
      title: parsed.data.title,
      notes: parsed.data.notes,
      due_date: parsed.data.dueDate,
      recurrence: parsed.data.recurrence,
      auto_renews: parsed.data.autoRenews,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
    })
    .eq("id", item.id);

  if (error) {
    return { ok: false, error: "Could not update the item. Please try again." };
  }

  revalidatePath("/app");
  return { ok: true };
}

export async function markDone(id: string): Promise<MutationResult> {
  const result = await ownedItem(id);
  if ("error" in result) return { ok: false, error: result.error };

  const { error } = await result.supabase
    .from("items")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", result.item.id);
  if (error) return { ok: false, error: "Could not mark done." };

  revalidatePath("/app");
  return { ok: true };
}

export async function snoozeItem(
  id: string,
  days: number,
): Promise<MutationResult> {
  const result = await ownedItem(id);
  if ("error" in result) return { ok: false, error: result.error };

  const daysSchema = z.coerce.number().int().min(1).max(90);
  const parsedDays = daysSchema.safeParse(days);
  if (!parsedDays.success) {
    return { ok: false, error: "Snooze must be between 1 and 90 days." };
  }

  const snoozedUntil = new Date();
  snoozedUntil.setDate(snoozedUntil.getDate() + parsedDays.data);

  const { error } = await result.supabase
    .from("items")
    .update({
      status: "snoozed",
      snoozed_until: snoozedUntil.toISOString().slice(0, 10),
    })
    .eq("id", result.item.id);
  if (error) return { ok: false, error: "Could not snooze the item." };

  revalidatePath("/app");
  return { ok: true };
}

export async function deleteItem(id: string): Promise<MutationResult> {
  const result = await ownedItem(id);
  if ("error" in result) return { ok: false, error: result.error };

  const { error } = await result.supabase
    .from("items")
    .delete()
    .eq("id", result.item.id);
  if (error) return { ok: false, error: "Could not delete the item." };

  revalidatePath("/app");
  return { ok: true };
}
