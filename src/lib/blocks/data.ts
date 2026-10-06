"use client";

/**
 * Incremental Data Gateway accessors for SirenDeck entities.
 * Ownership is enforced by CreatedBy policies on the gateway; these helpers
 * still map platform fields into the existing ItemRow/CategoryRow shapes so
 * Money Map UI can stay unchanged when we flip NEXT_PUBLIC_DATA_PROVIDER.
 *
 * Not wired into server actions yet — those still use Supabase via requireUser.
 * Call from client components after Blocks OIDC session is established.
 */

import { getBlocksClient } from "./client";
import type { CategoryRow, Currency, ItemRow, Recurrence, Status } from "@/lib/validation/item";

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

/** Data backend preference during dual-run. Set NEXT_PUBLIC_DATA_PROVIDER=blocks on Blocks deploys. */
export function getDataProviderPreference(): "blocks" | "supabase" {
  const raw = (process.env.NEXT_PUBLIC_DATA_PROVIDER ?? "").trim().toLowerCase();
  if (raw === "supabase") return "supabase";
  if (raw === "blocks") return "blocks";
  return "blocks";
}
