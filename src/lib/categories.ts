import type { SupabaseClient } from "@supabase/supabase-js";

import type { CategoryRow } from "@/lib/validation/item";
import type { Database } from "@/lib/database.types";

/** Neutral starter categories so the add-item form is never empty. */
const DEFAULT_CATEGORIES = [
  { name: "Subscriptions", color: "#22d3ee", icon: "repeat" },
  { name: "Insurance", color: "#14b8a6", icon: "shield" },
  { name: "Domains & SSL", color: "#8b5cf6", icon: "globe" },
  { name: "Bills", color: "#f59e0b", icon: "receipt" },
  { name: "Licenses", color: "#84cc16", icon: "badge-check" },
  { name: "Travel documents", color: "#f43f5e", icon: "plane" },
] as const;

/**
 * Returns the user's categories, seeding the defaults on very first load.
 * Single-user v1: the empty-then-insert race is acceptable.
 */
export async function getOrSeedCategories(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<CategoryRow[]> {
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (data && data.length > 0) return data as CategoryRow[];

  await supabase.from("categories").insert(
    DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: userId })),
  );

  const { data: seeded } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  return (seeded ?? []) as CategoryRow[];
}
