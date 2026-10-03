"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig } from "motion/react";
import {
  BadgeCheckIcon,
  GlobeIcon,
  LayersIcon,
  LayoutGridIcon,
  PlaneIcon,
  ReceiptIcon,
  RepeatIcon,
  ShieldIcon,
  type LucideIcon,
} from "lucide-react";

import { ItemFormDialog } from "@/components/items/item-form-dialog";
import { cn } from "cn";
import { buildMapModel, type MapItem } from "@/lib/map/map-model";
import { layoutFlat, layoutGrouped } from "@/lib/map/treemap";
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

type Grouping = "flat" | "category";

function iconFor(category: CategoryRow | undefined): LucideIcon | null {
  if (!category) return null;
  return CATEGORY_ICONS[category.icon] ?? null;
}

export function MoneyMap({ items, categories }: { items: ItemRow[]; categories: CategoryRow[] }) {
  const [grouping, setGrouping] = useState<Grouping>("flat");
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

  const layout = useMemo(() => {
    if (!container || container.w <= 0 || container.h <= 0) return null;

    if (grouping === "category") {
      const groups = new Map<string, MapItem[]>();
      for (const item of model.tiles) {
        const list = groups.get(item.categoryId) ?? [];
        list.push(item);
        groups.set(item.categoryId, list);
      }
      const groupRects = layoutGrouped(
        [...groups.entries()].map(([id, list]) => ({
          id,
          children: list.map((i) => ({ id: i.id, value: i.yearCost ?? 0 })),
        })),
        container.w,
        container.h,
      );
      return { kind: "category" as const, groupRects };
    }

    const tileInputs = model.tiles.map((i) => ({ id: i.id, value: i.yearCost ?? 0 }));
    if (model.other) {
      tileInputs.push({ id: model.other.id, value: model.other.yearCost });
    }
    const rects = layoutFlat(tileInputs, container.w, container.h);
    return { kind: "flat" as const, rects };
  }, [container, grouping, model]);

  const rectById = useMemo(() => {
    const map = new Map<string, TooltipRect>();
    if (!layout) return map;
    if (layout.kind === "flat") {
      for (const r of layout.rects) map.set(r.id, r);
    } else {
      for (const g of layout.groupRects) {
        for (const c of g.children) {
          map.set(c.id, { x: c.x + g.x, y: c.y + g.y, width: c.width, height: c.height });
        }
      }
    }
    return map;
  }, [layout]);

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
        {!empty && (
        <div className="flex items-center justify-end gap-1 px-4 pt-2" role="group" aria-label="Grouping">
          {(["flat", "category"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={grouping === mode}
              onClick={() => setGrouping(mode)}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-[var(--radius-control)] border px-2.5 text-xs transition-colors",
                grouping === mode
                  ? "border-border-subtle bg-surface-2 text-ink"
                  : "border-transparent text-ink-muted hover:text-ink",
              )}
            >
              {mode === "flat" ? (
                <LayoutGridIcon className="size-3.5" aria-hidden />
              ) : (
                <LayersIcon className="size-3.5" aria-hidden />
              )}
              {mode === "flat" ? "Flat" : "By category"}
            </button>
          ))}
        </div>
        )}

        {empty ? (
          <div className="flex min-h-0 flex-1 items-center justify-center p-6">
            <div className="flex max-w-sm flex-col items-center gap-3 text-center">
              <div aria-hidden className="grid aspect-[16/7] w-full grid-cols-4 grid-rows-2 gap-1 rounded-[var(--radius-tile)] border border-dashed border-border-subtle p-1">
                <div className="col-span-2 rounded-[var(--radius-tile)] bg-surface-2" />
                <div className="rounded-[var(--radius-tile)] bg-surface-2" />
                <div className="rounded-[var(--radius-tile)] bg-surface-2" />
                <div className="rounded-[var(--radius-tile)] bg-surface-2" />
                <div className="col-span-2 rounded-[var(--radius-tile)] bg-surface-2" />
                <div className="rounded-[var(--radius-tile)] bg-surface-2" />
              </div>
              <h2 className="mt-3 text-lg font-semibold">Your map starts with one item</h2>
              <p className="text-sm leading-relaxed text-ink-muted" style={{ textWrap: "pretty" }}>
                Add a subscription, bill or document renewal. Tile size is what it costs you a year.
                Color is how soon it lands.
              </p>
              <a
                href="#add-item"
                className="mt-2 rounded-[var(--radius-control)] bg-cta px-3 py-2 text-sm font-semibold text-cta-ink transition-transform duration-300 ease-[var(--ease-fluid)] hover:scale-[1.01] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
              >
                Add your first item
              </a>
            </div>
          </div>
        ) : (
        <div
          ref={ref}
          className="relative min-h-0 flex-1 overflow-hidden"
          aria-label="Money Map: treemap of items sized by yearly cost, colored by urgency. Full list follows."
        >
          {layout?.kind === "flat" && (
            <AnimatePresence>
              {layout.rects.map((rect, i) => {
                const item = itemById.get(rect.id);
                if (!item) return null;
                return (
                  <Tile
                    key={rect.id}
                    id={rect.id}
                    x={rect.x}
                    y={rect.y}
                    width={rect.width}
                    height={rect.height}
                    title={item.title}
                    cost={formatCost(item.yearCost, item.currency)}
                    daysLeft={item.daysLeft}
                    urgency={item.urgency}
                    icon={iconFor(categoryById.get(item.categoryId))}
                    index={i}
                    onHoverChange={setHoveredId}
                    onSelect={openEdit}
                    onFocusChange={setFocusedId}
                  />
                );
              })}
              {model.other && (
                <Tile
                  key={model.other.id}
                  id={model.other.id}
                  x={rectById.get(model.other.id)?.x ?? 0}
                  y={rectById.get(model.other.id)?.y ?? 0}
                  width={rectById.get(model.other.id)?.width ?? 0}
                  height={rectById.get(model.other.id)?.height ?? 0}
                  title={`Other (${model.other.count})`}
                  cost={formatCost(model.other.yearCost, model.other.currency)}
                  daysLeft={0}
                  urgency={model.other.urgency}
                  icon={null}
                  index={layout.rects.length}
                  onHoverChange={setHoveredId}
                  onFocusChange={setFocusedId}
                />
              )}
            </AnimatePresence>
          )}

          {layout?.kind === "category" && (
            <AnimatePresence>
              {layout.groupRects.map((group) => {
                const category = categoryById.get(group.id);
                return (
                  <div
                    key={group.id}
                    className="absolute rounded-[var(--radius-tile)] border border-border-subtle"
                    style={{ left: group.x, top: group.y, width: group.width, height: group.height }}
                  >
                    <p className="absolute left-2 top-1 z-10 max-w-[calc(100%-16px)] truncate text-[11px] font-medium text-ink-muted">
                      {category?.name ?? "Uncategorized"}
                    </p>
                    {group.children.map((child, i) => {
                      const item = itemById.get(child.id);
                      if (!item) return null;
                      return (
                        <Tile
                          key={child.id}
                          id={child.id}
                          x={child.x}
                          y={child.y + 18}
                          width={child.width}
                          height={Math.max(0, child.height - 18)}
                          title={item.title}
                          cost={formatCost(item.yearCost, item.currency)}
                          daysLeft={item.daysLeft}
                          urgency={item.urgency}
                          icon={iconFor(categoryById.get(item.categoryId))}
                          index={i}
                          onHoverChange={setHoveredId}
                          onSelect={openEdit}
                          onFocusChange={setFocusedId}
                        />
                      );
                    })}
                  </div>
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
