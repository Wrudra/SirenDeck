"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
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
import { markDone } from "@/lib/actions/items";
import { buildMapModel, sumCategoryTotals, type MapItem } from "@/lib/map/map-model";
import { fitSectionTotal, formatSectionTotal } from "@/lib/map/section-total";
import {
  OTHER_GROUP_ID,
  layoutFlat,
  layoutGrouped,
  type GroupDatum,
  type GroupRect,
} from "@/lib/map/treemap";
import { formatCost } from "@/lib/money";
import { getUrgency } from "@/lib/urgency";
import type { CategoryRow, ItemRow } from "@/lib/validation/item";
import { MapTooltip, type TileBox } from "./map-tooltip";
import { Tile, daysLabel } from "./tile";
import { UnpricedShelf } from "./unpriced-shelf";

/** Inset so the cards do not sit on the window edge. */
const MAP_SIDE = 28;
const MAP_BOTTOM = 28;

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
  const [requestedZoomId, setZoomId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [layoutMotion, setLayoutMotion] = useState(true);
  const [donePending, startDone] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<number | null>(null);

  const setHover = useCallback((id: string | null) => {
    if (hoverTimer.current != null) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    if (id) setHoveredId(id);
    else hoverTimer.current = window.setTimeout(() => setHoveredId(null), 90);
  }, []);

  // The canvas is not in the tree while the map is empty, so this has to
  // run again when the first item arrives. A mount-only effect never sees it.
  const hasItems = items.length > 0;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainer({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasItems]);

  useEffect(() => {
    if (!selectedId) return;
    function onDown(e: PointerEvent) {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-tile-id]")) return;
      if (target.closest("[data-map-detail]")) return;
      setSelectedId(null);
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [selectedId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setLayoutMotion(false);
      if (requestedZoomId) setZoomId(null);
      else setSelectedId(null);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setLayoutMotion(true));
      });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestedZoomId]);

  const model = useMemo(() => buildMapModel(items), [items]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const entries = useMemo<GroupDatum[]>(() => {
    const groups = new Map<string, MapItem[]>();
    for (const item of model.tiles) {
      const list = groups.get(item.categoryId) ?? [];
      list.push(item);
      groups.set(item.categoryId, list);
    }
    const built = [...groups.entries()].map(([id, list]) => {
      const sorted = [...list].sort(
        (a, b) => a.daysLeft - b.daysLeft || a.id.localeCompare(b.id),
      );
      return {
        id,
        soonest: sorted[0]?.daysLeft ?? 0,
        children: sorted.map((item, index) => ({
          id: item.id,
          value: item.layoutWeight,
          order: index,
        })),
      };
    });
    built.sort((a, b) => a.soonest - b.soonest || a.id.localeCompare(b.id));
    return built.map((group, index) => ({
      id: group.id,
      order: index,
      children: group.children,
    }));
  }, [model]);

  /**
   * Overview layout. A stock-heatmap treemap: categories are the sectors,
   * each tile's area is how soon it is due, and squarify keeps the blocks
   * as square as the weights allow. The heaviest sector lands first.
   */
  const overview = useMemo(() => {
    if (!container || container.w <= MAP_SIDE * 2 || container.h <= MAP_BOTTOM) return null;
    const width = container.w - MAP_SIDE * 2;
    const height = container.h - MAP_BOTTOM;
    return {
      rects: layoutGrouped(entries, width, height, {
        paddingInner: 8,
        headerHeight: 28,
      }).map((group) => ({ ...group, x: group.x + MAP_SIDE })),
      otherMembers: [] as string[],
    };
  }, [container, entries]);

  const otherMembers = useMemo(() => overview?.otherMembers ?? [], [overview]);

  /** Yearly total per section id; Other = sum of its folded categories. */
  const sectionTotals = useMemo(() => {
    const out = new Map(model.categoryTotals);
    if (otherMembers.length > 0) {
      out.set(OTHER_GROUP_ID, sumCategoryTotals(model.categoryTotals, otherMembers));
    }
    return out;
  }, [model, otherMembers]);

  const otherLabel = useMemo(
    () => otherMembers.map((id) => categoryById.get(id)?.name ?? "Uncategorized").join(", "),
    [otherMembers, categoryById],
  );

  // A resize can dissolve the Other section while zoomed into it: fall back
  // to the overview rather than an empty zoom.
  const zoomId =
    requestedZoomId === OTHER_GROUP_ID && overview && otherMembers.length === 0
      ? null
      : requestedZoomId;

  const groupRects = useMemo<GroupRect[] | null>(() => {
    if (!container || !overview) return null;
    if (!zoomId) return overview.rects;

    const children =
      zoomId === OTHER_GROUP_ID
        ? entries.filter((g) => otherMembers.includes(g.id)).flatMap((g) => g.children)
        : (entries.find((g) => g.id === zoomId)?.children ?? []);
    if (children.length === 0) return [];
    const width = Math.max(container.w - MAP_SIDE * 2, 0);
    const height = Math.max(container.h - MAP_BOTTOM, 0);
    return [
      {
        id: zoomId,
        x: MAP_SIDE,
        y: 0,
        width,
        height,
        children: layoutFlat(children, width, height, 8),
      },
    ];
  }, [container, overview, entries, otherMembers, zoomId]);

  const itemById = useMemo(() => {
    const map = new Map<string, MapItem>();
    for (const i of model.tiles) map.set(i.id, i);
    return map;
  }, [model]);

  const editingItem = editingId ? items.find((i) => i.id === editingId) : null;

  const openEdit = useCallback((id: string) => setEditingId(id), []);
  const closeEdit = useCallback(() => setEditingId(null), []);
  const onTileSelect = useCallback((id: string) => setSelectedId(id), []);

  // One item has no neighbor to sit beside, so the card stays at the top.
  // Otherwise a click pins the card, and hover only previews while nothing is pinned.
  const solo = model.tiles.length === 1 && model.other == null;
  const activeId = solo ? model.tiles[0].id : (selectedId ?? hoveredId ?? focusedId);
  const activeItem = activeId ? (itemById.get(activeId) ?? null) : null;
  const activeAnchor = useMemo<TileBox | null>(() => {
    if (!activeId || !groupRects) return null;
    for (const group of groupRects) {
      for (const child of group.children) {
        if (child.id !== activeId) continue;
        return {
          x: child.x + group.x,
          y: child.y + group.y,
          w: child.width,
          h: child.height,
        };
      }
    }
    return null;
  }, [activeId, groupRects]);
  const onDone = useCallback(() => {
    if (!activeItem) return;
    const id = activeItem.id;
    startDone(async () => {
      const result = await markDone(id);
      if (result.ok) {
        toast.success(result.rolled ? "Next cycle started" : "Marked done");
        setSelectedId(null);
        setHoveredId(null);
      } else if (result.error) {
        toast.error(result.error);
      }
    });
  }, [activeItem]);

  const empty = items.length === 0;

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-0 flex-1 flex-col">
        {empty ? (
          <div className="flex min-h-0 flex-1 items-center justify-center p-6">
            <div className="flex max-w-md flex-col items-center gap-3 text-center">
              <div aria-hidden className="grid aspect-[16/7] w-full grid-cols-4 grid-rows-2 gap-2">
                <div className="col-span-2 row-span-2 rounded-2xl bg-heat-overdue" />
                <div className="rounded-2xl bg-heat-urgent" />
                <div className="rounded-2xl bg-heat-calm" />
                <div className="rounded-2xl bg-heat-critical" />
                <div className="rounded-2xl bg-heat-calm" />
                <div className="rounded-2xl bg-heat-soon" />
                <div className="rounded-2xl bg-heat-urgent" />
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-ink">Your map starts with one deadline</h2>
              <p className="text-sm leading-relaxed text-ink-muted" style={{ textWrap: "pretty" }}>
                Add a subscription, bill or document renewal. The closer the deadline, the larger the tile.
                Color runs the same way: green is calm, red is past due.
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
        <>
        {zoomId && (
          <div className="flex h-8 shrink-0 items-center gap-1.5 bg-bg px-3 text-sm text-ink">
            <button
              type="button"
              onClick={() => setZoomId(null)}
              className="rounded-sm px-1 text-ink-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
            >
              ‹ All
            </button>
            <span className="text-ink-muted">·</span>
            {zoomId === OTHER_GROUP_ID ? (
              <span className="min-w-0 truncate">
                Other <span className="text-ink-muted">({otherLabel})</span>
              </span>
            ) : (
              <span className="min-w-0 truncate">{categoryById.get(zoomId)?.name ?? "Category"}</span>
            )}
            {(sectionTotals.get(zoomId)?.length ?? 0) > 0 && (
              <span
                className="tabular ml-auto shrink-0 pl-2 text-xs text-ink-muted"
                style={{ fontFamily: "var(--font-mono-var)" }}
              >
                {formatSectionTotal(sectionTotals.get(zoomId)!)} / yr
              </span>
            )}
          </div>
        )}
        <div
          ref={ref}
          className="relative min-h-0 flex-1 overflow-hidden bg-bg"
          aria-label="Money Map: treemap of items sized by how soon they are due, colored by urgency. Full list follows."
        >
          {groupRects && (
            <>
              {!zoomId &&
                groupRects.map((group) => {
                  const isOther = group.id === OTHER_GROUP_ID;
                  const category = isOther ? undefined : categoryById.get(group.id);
                  const name = isOther ? "Other" : (category?.name ?? "Uncategorized");
                  const totals = sectionTotals.get(group.id) ?? [];
                  const fullTotal = totals.length > 0 ? formatSectionTotal(totals) : null;
                  // Name first: the figure shortens, then hides, on narrow bars.
                  const shownTotal = fitSectionTotal(group.width, name, totals);
                  const yearly = fullTotal ? `, ${fullTotal} a year` : "";
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => {
                        setHoveredId(null);
                        setZoomId(group.id);
                      }}
                      className="group absolute z-10 flex h-7 cursor-pointer items-end justify-between gap-2 bg-transparent px-0.5 pb-1 text-left text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                      style={{ left: group.x, top: group.y, width: group.width }}
                      title={
                        isOther
                          ? `Other: ${otherLabel}${fullTotal ? ` · ${fullTotal} / yr` : ""}`
                          : fullTotal
                            ? `${name} · ${fullTotal} / yr`
                            : undefined
                      }
                      aria-label={
                        isOther
                          ? `Zoom into Other: ${otherLabel}${yearly}`
                          : `Zoom into ${name}${yearly}`
                      }
                    >
                      <span className="min-w-0 truncate text-[13px] font-medium tracking-[-0.01em]">
                        {name}
                        <span aria-hidden className="ml-0.5 text-ink-muted">
                          ›
                        </span>
                      </span>
                      {shownTotal && (
                        <span aria-hidden className="tabular shrink-0 whitespace-nowrap text-[12px] text-ink-muted">
                          {shownTotal}
                        </span>
                      )}
                    </button>
                  );
                })}
              <AnimatePresence>
                {groupRects.flatMap((group) =>
                  group.children.map((child) => {
                    const item = itemById.get(child.id);
                    if (!item) return null;
                    return (
                      <Tile
                        key={child.id}
                        id={child.id}
                        x={child.x + group.x}
                        y={child.y + group.y}
                        width={child.width}
                        height={child.height}
                        title={item.title}
                        dueDate={item.dueDate}
                        categoryId={item.categoryId}
                        cost={formatCost(item.yearCost, item.currency)}
                        daysLeft={item.daysLeft}
                        urgency={item.urgency}
                        icon={iconFor(categoryById.get(item.categoryId))}
                        hot={child.id === hoveredId}
                        selected={child.id === selectedId}
                        layoutMotion={layoutMotion}
                        onHoverChange={setHover}
                        onSelect={onTileSelect}
                        onOpen={openEdit}
                        onFocusChange={setFocusedId}
                      />
                    );
                  }),
                )}
              </AnimatePresence>
            </>
          )}
          <MapTooltip
            item={activeItem}
            category={activeItem ? categoryById.get(activeItem.categoryId) : undefined}
            anchor={activeAnchor}
            bounds={container}
            pinned={solo}
            onDone={activeItem ? onDone : undefined}
            onEdit={activeItem ? () => openEdit(activeItem.id) : undefined}
            donePending={donePending}
            onHold={setHover}
          />
        </div>
        </>
        )}

        <UnpricedShelf items={model.shelf} onAddCost={openEdit} />

        <section aria-label="All items" className="sr-only">
          <ul>
            {items.map((item) => {
              const { daysLeft, level } = getUrgency(item.due_date);
              return (
                <li key={item.id} suppressHydrationWarning>
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
