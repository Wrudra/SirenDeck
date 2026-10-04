"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig } from "motion/react";
import {
  BadgeCheckIcon,
  GlobeIcon,
  PlaneIcon,
  ReceiptIcon,
  RepeatIcon,
  ShieldIcon,
  type LucideIcon,
} from "lucide-react";

import { ItemFormDialog } from "@/components/items/item-form-dialog";
import { cn } from "cn";
import { buildMapModel, type MapItem } from "@/lib/map/map-model";
import { layoutGrouped, type GroupRect } from "@/lib/map/treemap";
import { formatCost } from "@/lib/money";
import { getUrgency } from "@/lib/urgency";
import type { CategoryRow, ItemRow } from "@/lib/validation/item";
import { MapTooltip, type TooltipRect } from "./map-tooltip";
import { SummaryStrip } from "./summary-strip";
import { Tile, daysLabel } from "./tile";
import { UnpricedShelf } from "./unpriced-shelf";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  repeat: RepeatIcon,
  shield: ShieldIcon,
  globe: GlobeIcon,
  receipt: ReceiptIcon,
  "badge-check": BadgeCheckIcon,
  plane: PlaneIcon,
};

function iconFor(category: CategoryRow | undefined): LucideIcon | null {
  if (!category) return null;
  return CATEGORY_ICONS[category.icon] ?? null;
}

export function MoneyMap({ items, categories }: { items: ItemRow[]; categories: CategoryRow[] }) {
  const [container, setContainer] = useState<{ w: number; h: number } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainer({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const model = useMemo(() => buildMapModel(items), [items]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  /** The soonest due item on the board · the porcelain hairline subject. */
  const soonestId = useMemo(() => {
    const ranked = [...items].sort(
      (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
    );
    return ranked[0]?.id ?? null;
  }, [items]);

  const groupRects = useMemo<GroupRect[] | null>(() => {
    if (!container || container.w <= 0 || container.h <= 0) return null;

    const groups = new Map<string, MapItem[]>();
    for (const item of model.tiles) {
      const list = groups.get(item.categoryId) ?? [];
      list.push(item);
      groups.set(item.categoryId, list);
    }
    return layoutGrouped(
      [...groups.entries()].map(([id, list]) => ({
        id,
        children: list.map((i) => ({ id: i.id, value: i.yearCost ?? 0 })),
      })),
      container.w,
      container.h,
    );
  }, [container, model]);

  const rectById = useMemo(() => {
    const map = new Map<string, TooltipRect>();
    if (!groupRects) return map;
    for (const g of groupRects) {
      for (const c of g.children) {
        map.set(c.id, { x: c.x + g.x, y: c.y + g.y, width: c.width, height: c.height });
      }
    }
    return map;
  }, [groupRects]);

  const itemById = useMemo(() => {
    const map = new Map<string, MapItem>();
    for (const i of model.tiles) map.set(i.id, i);
    return map;
  }, [model]);

  const editingItem = editingId ? items.find((i) => i.id === editingId) : null;

  const openEdit = useCallback((id: string) => setEditingId(id), []);
  const closeEdit = useCallback(() => setEditingId(null), []);

  const activeId = hoveredId ?? focusedId;
  const activeRect = activeId ? (rectById.get(activeId) ?? null) : null;
  const activeItem = activeId ? (itemById.get(activeId) ?? null) : null;

  const empty = items.length === 0;

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-0 flex-1 flex-col">
        {empty ? (
          <div className="flex min-h-0 flex-1 items-center justify-center p-6">
            <div className="flex max-w-sm flex-col items-center gap-3 text-center">
              <div aria-hidden className="grid aspect-[16/7] w-full grid-cols-4 grid-rows-2 gap-0.5 border border-dashed border-rule p-1">
                <div className="col-span-2 bg-surface-2" />
                <div className="bg-surface-2" />
                <div className="bg-surface-2" />
                <div className="bg-surface-2" />
                <div className="col-span-2 bg-surface-2" />
                <div className="bg-surface-2" />
              </div>
              <p className="ledger-cap mt-3 text-[11px] text-ink-muted">The ledger is blank</p>
              <h2 className="font-display text-2xl font-semibold text-ink">Your map starts with one entry</h2>
              <p className="text-sm leading-relaxed text-ink-muted" style={{ textWrap: "pretty" }}>
                Add a subscription, bill or document renewal. Entry size is what it costs you a year.
                Shade is how soon it comes due.
              </p>
              <ItemFormDialog
                categories={categories}
                trigger={
                  <button
                    type="button"
                    className="plate mt-2 rounded-[var(--radius-control)] px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    Add your first item
                  </button>
                }
              />
            </div>
          </div>
        ) : (
        <div
          ref={ref}
          className="relative min-h-0 flex-1 overflow-hidden p-0.5"
          aria-label="Money Map: treemap of items sized by yearly cost, colored by urgency. Full list follows."
        >
          {groupRects && (
            <AnimatePresence>
              {groupRects.map((group) => {
                const category = categoryById.get(group.id);
                const groupItems = group.children
                  .map((c) => itemById.get(c.id))
                  .filter((x): x is MapItem => x != null);
                const groupYearly = groupItems.reduce(
                  (s, it) => s + (it.yearCost ?? 0),
                  0,
                );
                const groupSoonest = groupItems.length
                  ? groupItems.reduce(
                      (a, b) => (a.daysLeft <= b.daysLeft ? a : b),
                      groupItems[0],
                    )
                  : null;
                const groupCurrency = groupItems[0]?.currency ?? "BDT";
                return (
                  <section
                    key={group.id}
                    aria-label={category?.name ?? "Uncategorized"}
                    className="absolute"
                    style={{ left: group.x, top: group.y, width: group.width, height: group.height }}
                  >
                    <header
                      className={cn(
                        "ledger-cap absolute inset-x-0 top-0 z-10 flex h-5 items-center justify-between gap-2 px-2",
                        "bg-ink text-cta-ink",
                      )}
                    >
                      <span className="truncate text-[9px] tracking-[0.12em]">
                        {category?.name?.toUpperCase() ?? "UNCATEGORIZED"}
                      </span>
                      <span className="tabular flex shrink-0 items-baseline gap-1.5 text-[9px]">
                        <span className="opacity-70">{groupItems.length}</span>
                        <span className="opacity-90">{formatCost(groupYearly, groupCurrency)}</span>
                      </span>
                    </header>
                    {groupSoonest && (
                      <span
                        className="ledger-cap absolute right-2 top-6 z-10 hidden text-[9px] text-ink-muted md:block"
                        title={daysLabel(groupSoonest.daysLeft)}
                      >
                        next: {daysLabel(groupSoonest.daysLeft)}
                      </span>
                    )}
                    {group.children.map((child, i) => {
                      const item = itemById.get(child.id);
                      if (!item) return null;
                      return (
                        <Tile
                          key={child.id}
                          id={child.id}
                          x={child.x}
                          y={child.y + 20}
                          width={child.width}
                          height={Math.max(0, child.height - 20)}
                          title={item.title}
                          cost={formatCost(item.yearCost, item.currency)}
                          daysLeft={item.daysLeft}
                          urgency={item.urgency}
                          icon={iconFor(categoryById.get(item.categoryId))}
                          isSoonest={child.id === soonestId}
                          index={i}
                          onHoverChange={setHoveredId}
                          onSelect={openEdit}
                          onFocusChange={setFocusedId}
                        />
                      );
                    })}
                  </section>
                );
              })}
            </AnimatePresence>
          )}

          <MapTooltip
            item={activeItem}
            rect={activeRect}
            category={activeItem ? categoryById.get(activeItem.categoryId) : undefined}
            canvasWidth={container?.w ?? 0}
          />
        </div>
        )}

        <UnpricedShelf items={model.shelf} onAddCost={openEdit} />

        <SummaryStrip model={model} />

        <section aria-label="All items" className="sr-only">
          <ul>
            {items.map((item) => {
              const { daysLeft, level } = getUrgency(item.due_date);
              return (
                <li key={item.id}>
                  {item.title}: {level}, {daysLabel(daysLeft)}
                  {item.amount != null && `, ${formatCost(Number(item.amount), item.currency)}`}
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {editingItem && (
        <ItemFormDialog
          key={editingItem.id}
          categories={categories}
          open
          onOpenChange={(next) => !next && closeEdit()}
          item={{
            id: editingItem.id,
            title: editingItem.title,
            notes: editingItem.notes,
            categoryId: editingItem.category_id,
            dueDate: editingItem.due_date,
            recurrence: editingItem.recurrence,
            autoRenews: editingItem.auto_renews,
            amount: editingItem.amount == null ? null : Number(editingItem.amount),
            currency: editingItem.currency,
          }}
        />
      )}
    </MotionConfig>
  );
}
