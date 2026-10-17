"use client";

/**
 * Blocks Data Gateway accessors for SirenDeck entities — the app's only data
 * backend. Ownership is enforced by CreatedBy policies on the gateway; these
 * helpers map platform fields into the existing ItemRow/CategoryRow shapes.
 *
 * Call from client components after the Blocks OIDC session is established.
 */

import { getBlocksClient } from "./client";
import { completeCycle } from "@/lib/map/cycle";
import {
  CURRENCIES,
  RECURRENCES,
  type CategoryRow,
  type Currency,
  type ItemRow,
  type Recurrence,
  type Status,
} from "@/lib/validation/item";

type BlocksRecord = Record<string, unknown>;

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function bool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function asDateOnly(v: unknown): string {
  if (typeof v !== "string" || !v) return "";
  // DateTime from gateway → YYYY-MM-DD for existing UI
  return v.slice(0, 10);
}

export function mapCategory(row: BlocksRecord): CategoryRow {
  return {
    id: str(row.ItemId ?? row.itemId),
    user_id: str(row.CreatedBy ?? row.createdBy),
    name: str(row.name),
    color: str(row.color),
    icon: str(row.icon),
    created_at: str(row.CreatedDate ?? row.createdDate),
    updated_at: str(row.LastUpdatedDate ?? row.lastUpdatedDate),
  };
}

export function mapItem(row: BlocksRecord): ItemRow {
  const status = str(row.status, "active") as Status;
  const recurrence = str(row.recurrence, "none") as Recurrence;
  const currency = str(row.currency, "BDT") as Currency;
  const amount = row.amount;
  return {
    id: str(row.ItemId ?? row.itemId),
    user_id: str(row.CreatedBy ?? row.createdBy),
    category_id: str(row.categoryId),
    title: str(row.title),
    notes: row.notes == null || row.notes === "" ? null : str(row.notes),
    due_date: asDateOnly(row.dueDate),
    status,
    recurrence,
    auto_renews: bool(row.autoRenews),
    amount: amount == null || amount === "" ? null : String(amount),
    currency,
    snoozed_until: row.snoozedUntil ? asDateOnly(row.snoozedUntil) : null,
    completed_at: row.completedAt ? str(row.completedAt) : null,
    created_at: str(row.CreatedDate ?? row.createdDate),
    updated_at: str(row.LastUpdatedDate ?? row.lastUpdatedDate),
  };
}

const CATEGORY_FIELDS = ["name", "color", "icon"] as const;
const ITEM_FIELDS = [
  "categoryId",
  "title",
  "notes",
  "dueDate",
  "status",
  "recurrence",
  "autoRenews",
  "amount",
  "currency",
  "snoozedUntil",
  "completedAt",
] as const;

/**
 * The SDK returns the raw GraphQL body (`{ data: { getXs: { items } }, errors }`).
 * Unwrap it here so callers see the page/mutation payload, and surface GraphQL errors.
 */
function gqlPayload(res: unknown, field: string): BlocksRecord {
  const body = (res ?? {}) as { data?: Record<string, unknown>; errors?: { message?: string }[] };
  if (Array.isArray(body.errors) && body.errors.length) {
    throw new Error(body.errors.map((e) => e?.message ?? "GraphQL error").join("; "));
  }
  const payload = body.data?.[field] ?? (res as Record<string, unknown> | undefined)?.[field];
  if (payload && typeof payload === "object") return payload as BlocksRecord;
  // Older/unwrapped shape: the page itself.
  return (res ?? {}) as BlocksRecord;
}

function pageItems(res: unknown, field: string): BlocksRecord[] {
  const items = gqlPayload(res, field).items;
  return Array.isArray(items) ? (items as BlocksRecord[]) : [];
}

function mutationItemId(res: unknown, field: string): string {
  const payload = gqlPayload(res, field);
  if (payload.acknowledged === false) {
    throw new Error(str(payload.message, `${field} was not acknowledged`));
  }
  return str(payload.itemId);
}

/** Surface gateway rejections the SDK resolves without throwing. */
function assertMutationOk(res: unknown, label: string): void {
  const body = res as { isSuccess?: unknown; message?: unknown; httpStatusCode?: unknown } | null;
  if (body && body.isSuccess === false) {
    throw new Error(
      `${label} failed: ${str(body.message) || `HTTP ${String(body.httpStatusCode ?? "error")}`}`,
    );
  }
}

export function categoriesCollection() {
  return getBlocksClient().data.collection<BlocksRecord>("Category", {
    fields: [...CATEGORY_FIELDS],
  });
}

export function itemsCollection() {
  return getBlocksClient().data.collection<BlocksRecord>("Item", {
    fields: [...ITEM_FIELDS],
  });
}

async function fetchCategoryRows(): Promise<BlocksRecord[]> {
  const page = await categoriesCollection().list({ pageNo: 1, pageSize: 200 });
  return pageItems(page, "getCategorys");
}

function toCategoryList(raw: BlocksRecord[]): CategoryRow[] {
  const rows = raw.map(mapCategory).filter((c) => c.id && c.name);
  // Dedupe by name (keep first): earlier builds re-seeded on every load.
  const seen = new Set<string>();
  const unique = rows.filter((c) => {
    const key = c.name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return unique.sort((a, b) => a.name.localeCompare(b.name));
}

export async function listCategories(): Promise<CategoryRow[]> {
  return toCategoryList(await fetchCategoryRows());
}

export async function listItems(): Promise<ItemRow[]> {
  const page = await itemsCollection().list({ pageNo: 1, pageSize: 200 });
  return pageItems(page, "getItems").map(mapItem).filter((i) => i.id);
}

/** Neutral starter categories (parity with src/lib/categories.ts). */
const DEFAULT_CATEGORIES = [
  { name: "Subscriptions", color: "#22d3ee", icon: "repeat" },
  { name: "Insurance", color: "#14b8a6", icon: "shield" },
  { name: "Domains & SSL", color: "#8b5cf6", icon: "globe" },
  { name: "Bills", color: "#f59e0b", icon: "receipt" },
  { name: "Licenses", color: "#84cc16", icon: "badge-check" },
  { name: "Travel documents", color: "#f43f5e", icon: "plane" },
] as const;

/**
 * Returns categories, seeding defaults on first empty load for this user.
 * Ownership is enforced by CreatedBy policies; empty-then-insert race is OK for v1.
 */
export async function getOrSeedCategories(): Promise<CategoryRow[]> {
  const raw = await fetchCategoryRows();
  // Seed only when the collection truly has no rows for this user. A row whose
  // fields read back null (gateway field-cache lag) still counts as existing.
  if (raw.length > 0) {
    const existing = toCategoryList(raw);
    if (existing.length > 0) return existing;
    // Rows exist but fields came back empty: re-read once instead of re-seeding.
    return listCategories();
  }
  for (const c of DEFAULT_CATEGORIES) {
    await categoriesCollection().create({ name: c.name, color: c.color, icon: c.icon });
  }
  return listCategories();
}

export async function createCategory(input: {
  name: string;
  color: string;
  icon: string;
}): Promise<CategoryRow> {
  const res = await categoriesCollection().create(input);
  const id = mutationItemId(res, "insertCategory");
  const rows = await listCategories();
  const found = rows.find((c) => c.id === id);
  if (found) return found;
  return {
    id,
    user_id: "",
    name: input.name,
    color: input.color,
    icon: input.icon,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function createItem(input: {
  categoryId: string;
  title: string;
  notes?: string | null;
  dueDate: string; // YYYY-MM-DD
  recurrence: Recurrence;
  autoRenews: boolean;
  amount?: string | null;
  currency: Currency;
}): Promise<string> {
  const res = await itemsCollection().create({
    categoryId: input.categoryId,
    title: input.title,
    notes: input.notes ?? "",
    dueDate: `${input.dueDate}T00:00:00.000Z`,
    status: "active",
    recurrence: input.recurrence,
    autoRenews: input.autoRenews,
    amount: input.amount ?? "",
    currency: input.currency,
    snoozedUntil: null,
    completedAt: null,
  });
  return mutationItemId(res, "insertItem");
}

/**
 * Manual "done" on a Blocks item, mirroring the former Supabase markDone action:
 * renewing items roll to the next cycle via completeCycle; one-offs are
 * marked done. Returns the mapped row so callers can update local state.
 */
export async function markDoneItem(item: ItemRow): Promise<ItemRow> {
  if (item.auto_renews && item.recurrence !== "none") {
    const dueDate = completeCycle(item.due_date, item.recurrence, new Date());
    if (!dueDate) throw new Error("Could not mark done.");
    const res = await itemsCollection().update(item.id, {
      dueDate: `${dueDate}T00:00:00.000Z`,
      status: "active",
      snoozedUntil: null,
    });
    assertMutationOk(res, "Mark done");
    return { ...item, due_date: dueDate, status: "active", snoozed_until: null };
  }
  const completedAt = new Date().toISOString();
  const res = await itemsCollection().update(item.id, {
    status: "done",
    snoozedUntil: null,
    completedAt,
  });
  assertMutationOk(res, "Mark done");
  return { ...item, status: "done", snoozed_until: null, completed_at: completedAt };
}

/** Pause a deadline for 1–90 days, mirroring the former Supabase snoozeItem action. */
export async function snoozeItem(
  item: ItemRow,
  days: number,
): Promise<ItemRow> {
  if (!Number.isInteger(days) || days < 1 || days > 90) {
    throw new Error("Snooze must be between 1 and 90 days.");
  }
  const snoozedUntil = new Date();
  snoozedUntil.setDate(snoozedUntil.getDate() + days);
  // DateTime fields expect a full ISO timestamp; a date-only string is
  // silently dropped by the gateway (observed live: snooze no-ops).
  const iso = `${snoozedUntil.toISOString().slice(0, 10)}T00:00:00.000Z`;
  const res = await itemsCollection().update(item.id, {
    status: "snoozed",
    snoozedUntil: iso,
  });
  assertMutationOk(res, "Snooze");
  return { ...item, status: "snoozed", snoozed_until: asDateOnly(iso) };
}

export async function deleteItem(id: string): Promise<void> {
  const res = await itemsCollection().delete(id);
  assertMutationOk(res, "Delete");
}

/**
 * Server-action-shaped CRUD so the shared UI (form dialog, list actions)
 * stays provider-agnostic. Mirrors the former Supabase addItem/updateItem actions.
 */
export type ActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export const idleState: ActionState = { ok: false };

export async function addItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, fieldErrors: { title: "Title is required." } };
  const categoryId = String(formData.get("categoryId") ?? "");
  if (!categoryId) {
    return { ok: false, fieldErrors: { categoryId: "Choose one of your categories." } };
  }
  const recurrenceRaw = String(formData.get("recurrence") ?? "none");
  const recurrence = (RECURRENCES as readonly string[]).includes(recurrenceRaw)
    ? (recurrenceRaw as Recurrence)
    : "none";
  const dueDate = String(formData.get("dueDate") ?? "");
  if (!dueDate) return { ok: false, fieldErrors: { dueDate: "Due date is required." } };
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const currencyRaw = String(formData.get("currency") ?? "BDT");
  const currency = (CURRENCIES as readonly string[]).includes(currencyRaw)
    ? (currencyRaw as Currency)
    : "BDT";
  try {
    await createItem({
      categoryId,
      title,
      notes: String(formData.get("notes") ?? "") || null,
      dueDate,
      recurrence,
      autoRenews: formData.get("autoRenews") === "on" || formData.get("autoRenews") === "true",
      amount: amountRaw || null,
      currency,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not add the item." };
  }
}

export async function updateItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Invalid item id." };
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, fieldErrors: { title: "Title is required." } };
  const dueDate = String(formData.get("dueDate") ?? "");
  if (!dueDate) return { ok: false, fieldErrors: { dueDate: "Due date is required." } };
  try {
    const res = await itemsCollection().update(id, {
      categoryId: String(formData.get("categoryId") ?? ""),
      title,
      notes: String(formData.get("notes") ?? ""),
      dueDate: `${dueDate}T00:00:00.000Z`,
      recurrence: String(formData.get("recurrence") ?? "none"),
      autoRenews:
        formData.get("autoRenews") === "on" || formData.get("autoRenews") === "true",
      amount: String(formData.get("amount") ?? ""),
      currency: String(formData.get("currency") ?? "BDT"),
    });
    assertMutationOk(res, "Update");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not update the item." };
  }
}

