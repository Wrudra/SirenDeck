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

export async function listCategories(): Promise<CategoryRow[]> {
  const page = await categoriesCollection().list({ pageNo: 1, pageSize: 100 });
  const items = (page as { items?: BlocksRecord[] }).items ?? [];
  return items.map(mapCategory).sort((a, b) => a.name.localeCompare(b.name));
}

export async function listItems(): Promise<ItemRow[]> {
  const page = await itemsCollection().list({ pageNo: 1, pageSize: 200 });
  const items = (page as { items?: BlocksRecord[] }).items ?? [];
  return items.map(mapItem);
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
  const existing = await listCategories();
  if (existing.length > 0) return existing;
  for (const c of DEFAULT_CATEGORIES) {
    await createCategory({ name: c.name, color: c.color, icon: c.icon });
  }
  return listCategories();
}

export async function createCategory(input: {
  name: string;
  color: string;
  icon: string;
}): Promise<CategoryRow> {
  const res = await categoriesCollection().create(input);
  const id = str((res as { itemId?: string }).itemId);
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
  return str((res as { itemId?: string }).itemId);
}

/** Data backend preference during dual-run. Set NEXT_PUBLIC_DATA_PROVIDER=blocks on Blocks deploys. */
export function getDataProviderPreference(): "blocks" | "supabase" {
  const raw = (process.env.NEXT_PUBLIC_DATA_PROVIDER ?? "").trim().toLowerCase();
  if (raw === "blocks") return "blocks";
  return "supabase";
}
