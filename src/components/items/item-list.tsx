"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  CircleCheckIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";

import { ItemFormDialog } from "@/components/items/item-form-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteItem, markDone, snoozeItem } from "@/lib/actions/items";
import type { UrgencyLevel } from "@/lib/urgency";
import { getUrgency } from "@/lib/urgency";
import { formatCost, yearlyCost } from "@/lib/money";
import type { CategoryRow, ItemRow } from "@/lib/validation/item";

const SNOOZE_OPTIONS = [1, 3, 7, 14, 30] as const;

/** Ink shade swatch per urgency — lightness is urgency. */
const URGENCY_SWATCH: Record<UrgencyLevel, string> = {
  calm: "bg-urgency-calm",
  soon: "bg-urgency-soon",
  urgent: "bg-urgency-urgent",
  critical: "bg-urgency-critical",
  overdue: "bg-urgency-overdue",
};

/** Text-safe twin for chips directly on paper. */
const URGENCY_TEXT: Record<UrgencyLevel, string> = {
  calm: "text-urgency-calm-text",
  soon: "text-urgency-soon-text",
  urgent: "text-urgency-urgent-text",
  critical: "text-urgency-critical-text",
  overdue: "text-urgency-overdue-text",
};

function daysLabel(daysLeft: number): string {
  if (daysLeft < 0) return `${Math.abs(daysLeft)}d overdue`;
  if (daysLeft === 0) return "Today";
  if (daysLeft === 1) return "Tomorrow";
  return `${daysLeft}d left`;
}

/** Weight ramps inside the action horizon; quiet ink beyond it.
    Overdue gets the full-ink chip — the row alarm. */
function chipClasses(urgency: UrgencyLevel, daysLeft: number): string {
  const inHorizon = daysLeft <= 14;
  if (urgency === "overdue") return "text-urgency-overdue-text";
  if (!inHorizon) return "text-ink-muted";
  return URGENCY_TEXT[urgency];
}

export function ItemList({
  items,
  categories,
}: {
  items: ItemRow[];
  categories: CategoryRow[];
}) {
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>, successMsg: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(successMsg);
      else if (result.error) toast.error(result.error);
    });
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="ledger-cap text-[11px] text-ink-muted">Nothing entered yet</p>
          <p className="font-display mt-2 text-xl font-semibold">The ledger is blank</p>
          <p className="mt-1 text-sm text-ink-muted">Add your first item to give it a line.</p>
        </div>
      </div>
    );
  }

  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className={`flex-1 overflow-y-auto ${pending ? "opacity-60" : ""}`}>
      <ul className="mx-auto flex w-full max-w-3xl flex-col p-4">
        {items.map((item, rank) => {
          const urgency = getUrgency(item.due_date);
          const yearCost = yearlyCost({ amount: Number(item.amount), recurrence: item.recurrence });
          const cost = formatCost(yearCost, item.currency);
          const category = categoryById.get(item.category_id);

          return (
            <li
              key={item.id}
              className={`group grid grid-cols-[1.6rem_1fr_auto_auto] items-center gap-2 border-b border-rule px-2 py-3 transition-colors last:border-b-0 hover:bg-surface sm:grid-cols-[2.25rem_1fr_auto_auto] sm:gap-3 ${
                urgency.level === "overdue" ? "border-l-2 border-l-ink" : ""
              }`}
            >
              <span
                className="font-display text-lg leading-none font-semibold text-ink-muted"
                aria-hidden
              >
                {String(rank + 1).padStart(2, "0")}
              </span>
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  aria-hidden
                  className={`size-2.5 shrink-0 border border-ink/15 ${
                    urgency.level === "overdue" ? "border-ink" : ""
                  } ${URGENCY_SWATCH[urgency.level]}`}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{item.title}</span>
                    {category && (
                      <span className="hidden shrink-0 text-[11px] text-ink-muted sm:inline">
                        {category.name}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
                    <span className="tabular" style={{ fontFamily: "var(--font-mono-var)" }}>{item.due_date}</span>
                    {item.auto_renews && <span>· auto-renews</span>}
                    {item.status === "snoozed" && <span>· snoozed until {item.snoozed_until}</span>}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span
                  className="tabular text-sm"
                  style={{ fontFamily: "var(--font-mono-var)" }}
                >
                  {cost ?? "—"}
                </span>
                <span
                  className={`tabular text-xs font-semibold ${chipClasses(urgency.level, urgency.daysLeft)}`}
                >
                  {daysLabel(urgency.daysLeft)}
                </span>
              </div>
              <div className="flex items-center gap-0.5 opacity-100 transition-opacity [@media(pointer:fine)]:opacity-0 [@media(pointer:fine)]:group-focus-within:opacity-100 [@media(pointer:fine)]:group-hover:opacity-100">
                <ItemFormDialog
                  categories={categories}
                  item={{
                    id: item.id,
                    title: item.title,
                    notes: item.notes,
                    categoryId: item.category_id,
                    dueDate: item.due_date,
                    recurrence: item.recurrence,
                    autoRenews: item.auto_renews,
                    amount: item.amount == null ? null : Number(item.amount),
                    currency: item.currency,
                  }}
                  trigger={
                    <Button variant="ghost" size="icon-sm" aria-label={`Edit ${item.title}`}>
                      <PencilIcon />
                    </Button>
                  }
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${item.title}`} disabled={pending}>
                      <MoreHorizontalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => run(() => markDone(item.id), "Marked done")}>
                      <CircleCheckIcon /> Mark done
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="p-0">
                      <div className="flex items-center">
                        <span className="pl-2 pr-1 text-xs text-ink-muted">Snooze</span>
                        {SNOOZE_OPTIONS.map((d) => (
                          <Button
                            key={d}
                            variant="ghost"
                            size="icon-xs"
                            className="text-xs"
                            onClick={() => run(() => snoozeItem(item.id, d), `Snoozed ${d}d`)}
                          >
                            {d}d
                          </Button>
                        ))}
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => {
                        if (confirm(`Delete "${item.title}"? This cannot be undone.`)) {
                          run(() => deleteItem(item.id), "Deleted");
                        }
                      }}
                    >
                      <Trash2Icon /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
