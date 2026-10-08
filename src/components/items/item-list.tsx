"use client";

import { useTransition } from "react";
import { MotionConfig, motion, useReducedMotion } from "motion/react";
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
import { cn } from "cn";
import { deleteItem, markDone, snoozeItem } from "@/lib/actions/items";
import type { UrgencyLevel } from "@/lib/urgency";
import { getUrgency } from "@/lib/urgency";
import { formatCost, yearlyCost } from "@/lib/money";
import type { CategoryRow, ItemRow } from "@/lib/validation/item";

const SNOOZE_OPTIONS = [1, 3, 7, 14, 30] as const;

/** Ink shade swatch per urgency · lightness is urgency. */
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

const RANK_SPRING = { type: "spring", stiffness: 260, damping: 30 } as const;

function daysLabel(daysLeft: number): string {
  if (daysLeft < 0) return `${Math.abs(daysLeft)}d overdue`;
  if (daysLeft === 0) return "Today";
  if (daysLeft === 1) return "Tomorrow";
  return `${daysLeft}d left`;
}

/** Weight ramps inside the action horizon; quiet ink beyond it.
    Overdue gets the full-ink chip · the row alarm. */
function chipClasses(urgency: UrgencyLevel, daysLeft: number): string {
  if (urgency === "overdue") {
    return "bg-ink px-1.5 py-px text-[var(--accent-ink)]";
  }
  const inHorizon = daysLeft <= 14;
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
  const reduced = useReducedMotion();

  function run(
    action: () => Promise<{ ok: boolean; error?: string; rolled?: boolean }>,
    successMsg: string,
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(result.rolled ? "Next cycle started" : successMsg);
      else if (result.error) toast.error(result.error);
    });
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="text-center">
          <p className="ledger-cap text-[11px] text-ink-muted">Nothing entered yet</p>
          <p className="font-display mt-2 text-xl font-semibold tracking-[-0.01em]">
            The ledger is blank
          </p>
          <p className="mt-1 text-sm text-ink-muted">Add your first item to give it a line.</p>
        </div>
      </div>
    );
  }

  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={cn(
          "flex-1 overflow-y-auto transition-opacity duration-150",
          pending && "opacity-60",
        )}
      >
        <div className="mx-auto w-full max-w-3xl px-3 py-3 sm:px-4 sm:py-4">
          {/* Departure-board column ruling */}
          <div
            className="grid grid-cols-[1.6rem_1fr_auto_auto] items-center gap-2 border-b border-rule px-2 pb-2 sm:grid-cols-[2.25rem_minmax(0,1fr)_7rem_6.75rem_auto] sm:gap-3"
            aria-hidden
          >
            <span className="ledger-cap text-[9px] text-ink-muted">#</span>
            <span className="ledger-cap text-[9px] text-ink-muted">Entry</span>
            <span className="ledger-cap hidden text-right text-[9px] text-ink-muted sm:inline">
              Due
            </span>
            <span className="ledger-cap text-right text-[9px] text-ink-muted">
              Yearly / horizon
            </span>
            <span className="w-14" />
          </div>

          <ul className="group/board flex flex-col" role="list" aria-label="Ledger entries">
            {items.map((item, rank) => {
              const urgency = getUrgency(item.due_date);
              const overdue = urgency.level === "overdue";
              const yearCost = yearlyCost({
                amount: Number(item.amount),
                recurrence: item.recurrence,
              });
              const cost = formatCost(yearCost, item.currency);
              const category = categoryById.get(item.category_id);

              return (
                <motion.li
                  key={item.id}
                  layout={!reduced}
                  transition={RANK_SPRING}
                  data-row
                  data-overdue={overdue ? "true" : undefined}
                  className={cn(
                    "group/row grid grid-cols-[1.6rem_1fr_auto_auto] items-center gap-2 border-b border-rule px-2 py-2.5 last:border-b-0 sm:grid-cols-[2.25rem_minmax(0,1fr)_7rem_6.75rem_auto] sm:gap-3 sm:py-3",
                    "transition-[opacity,background-color] duration-150 ease-[var(--ease-standard)]",
                    /* Focus choreography: hovered/focused row holds attention; others quiet.
                       Overdue holds lit — ink is the alarm. */
                    "group-has-[[data-row]:hover]/board:opacity-[0.4] group-has-[[data-row]:focus-within]/board:opacity-[0.4]",
                    "hover:!opacity-100 focus-within:!opacity-100 data-[overdue=true]:!opacity-100",
                    overdue
                      ? "border-l-2 border-l-ink bg-ink/[0.035] hover:bg-ink/[0.055]"
                      : "hover:bg-surface focus-within:bg-surface",
                  )}
                >
                  <span
                    className={cn(
                      "font-display text-lg leading-none font-semibold tabular",
                      overdue ? "text-ink" : "text-ink-muted",
                    )}
                    aria-hidden
                  >
                    {String(rank + 1).padStart(2, "0")}
                  </span>

                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      aria-hidden
                      className={cn(
                        "size-2.5 shrink-0 border",
                        overdue ? "border-ink" : "border-ink/15",
                        URGENCY_SWATCH[urgency.level],
                      )}
                    />
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-baseline gap-2">
                        <span
                          className={cn(
                            "truncate text-sm font-medium tracking-[-0.005em]",
                            overdue && "font-semibold",
                          )}
                        >
                          {item.title}
                        </span>
                        {category && (
                          <span className="hidden shrink-0 text-[11px] text-ink-muted sm:inline">
                            {category.name}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-muted sm:hidden">
                        <span
                          className="tabular"
                          style={{ fontFamily: "var(--font-mono-var)" }}
                        >
                          {item.due_date}
                        </span>
                        {item.auto_renews && <span>· auto-renews</span>}
                        {item.status === "snoozed" && (
                          <span>· snoozed until {item.snoozed_until}</span>
                        )}
                      </div>
                      {(item.auto_renews || item.status === "snoozed") && (
                        <div className="mt-0.5 hidden flex-wrap items-center gap-x-2 text-xs text-ink-muted sm:flex">
                          {item.auto_renews && <span>auto-renews</span>}
                          {item.status === "snoozed" && (
                            <span>snoozed until {item.snoozed_until}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <span
                    className="tabular hidden text-right text-xs text-ink-muted sm:inline"
                    style={{ fontFamily: "var(--font-mono-var)" }}
                  >
                    {item.due_date}
                  </span>

                  <div className="flex flex-col items-end gap-0.5 justify-self-end">
                    <span
                      className="tabular text-sm"
                      style={{ fontFamily: "var(--font-mono-var)" }}
                    >
                      {cost ?? "·"}
                    </span>
                    <span
                      className={cn(
                        "tabular text-xs font-semibold",
                        chipClasses(urgency.level, urgency.daysLeft),
                      )}
                      style={{ fontFamily: "var(--font-mono-var)" }}
                    >
                      {daysLabel(urgency.daysLeft)}
                    </span>
                  </div>

                  <div
                    className={cn(
                      "flex items-center justify-end gap-0.5 justify-self-end",
                      "opacity-100 transition-opacity duration-150",
                      "[@media(pointer:fine)]:opacity-0 [@media(pointer:fine)]:group-focus-within/row:opacity-100 [@media(pointer:fine)]:group-hover/row:opacity-100",
                    )}
                  >
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
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${item.title}`}
                          className="rounded-[var(--radius-control)]"
                        >
                          <PencilIcon />
                        </Button>
                      }
                    />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`More actions for ${item.title}`}
                          disabled={pending}
                          className="rounded-[var(--radius-control)]"
                        >
                          <MoreHorizontalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="rounded-[var(--radius-control)] border-rule shadow-[0_8px_24px_rgb(20_19_17/0.12)]"
                      >
                        <DropdownMenuItem
                          onSelect={() => run(() => markDone(item.id), "Marked done")}
                        >
                          <CircleCheckIcon /> Mark done
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="p-0" onSelect={(e) => e.preventDefault()}>
                          <div className="flex items-center">
                            <span className="ledger-cap pl-2 pr-1 text-[9px] text-ink-muted">
                              Snooze
                            </span>
                            {SNOOZE_OPTIONS.map((d) => (
                              <Button
                                key={d}
                                variant="ghost"
                                size="icon-xs"
                                className="tabular text-xs"
                                onClick={() =>
                                  run(() => snoozeItem(item.id, d), `Snoozed ${d}d`)
                                }
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
                </motion.li>
              );
            })}
          </ul>
        </div>
      </div>
    </MotionConfig>
  );
}
