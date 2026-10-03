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

const URGENCY_DOT: Record<UrgencyLevel, string> = {
  calm: "bg-urgency-calm",
  soon: "bg-urgency-soon",
  urgent: "bg-urgency-urgent",
  critical: "bg-urgency-critical",
  overdue: "bg-urgency-overdue",
};

const URGENCY_PILL: Record<UrgencyLevel, string> = {
  calm: "bg-urgency-calm/15 text-urgency-calm",
  soon: "bg-urgency-soon/15 text-urgency-soon",
  urgent: "bg-urgency-urgent/15 text-urgency-urgent",
  critical: "bg-urgency-critical/15 text-urgency-critical",
  overdue: "bg-urgency-overdue/15 text-urgency-overdue",
};

function daysLabel(daysLeft: number): string {
  if (daysLeft < 0) return `${Math.abs(daysLeft)}d overdue`;
  if (daysLeft === 0) return "Today";
  if (daysLeft === 1) return "Tomorrow";
  return `${daysLeft}d left`;
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
          <p className="text-sm text-ink-muted">Nothing here yet.</p>
          <p className="mt-1 text-xs text-ink-muted">Add your first item to see it on the map.</p>
        </div>
      </div>
    );
  }

  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className={`flex-1 overflow-y-auto ${pending ? "opacity-60" : ""}`}>
      <ul className="mx-auto flex w-full max-w-2xl flex-col gap-2 p-4">
        {items.map((item) => {
          const urgency = getUrgency(item.due_date);
          const yearCost = yearlyCost({ amount: Number(item.amount), recurrence: item.recurrence });
          const cost = formatCost(yearCost, item.currency);
          const category = categoryById.get(item.category_id);

          return (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-[var(--radius-control)] border border-border-subtle bg-surface p-3"
            >
              <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${URGENCY_DOT[urgency.level]}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{item.title}</span>
                  {category && (
                    <span className="hidden shrink-0 text-[11px] text-ink-muted sm:inline">
                      {category.name}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
                  <span>{item.due_date}</span>
                  {item.auto_renews && <span>· auto-renews</span>}
                  {item.status === "snoozed" && <span>· snoozed until {item.snoozed_until}</span>}
                </div>
              </div>
              <span className="shrink-0 text-sm tabular-nums">{cost ?? "—"}</span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${URGENCY_PILL[urgency.level]}`}>
                {daysLabel(urgency.daysLeft)}
              </span>

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
            </li>
          );
        })}
      </ul>
    </div>
    );
}
