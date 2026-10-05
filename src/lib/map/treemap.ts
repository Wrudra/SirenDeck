import {
  hierarchy,
  treemap,
  treemapSquarify,
  type HierarchyRectangularNode,
} from "d3-hierarchy";

export interface TileDatum {
  id: string;
  value: number;
}

export interface TileRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GroupDatum {
  id: string;
  children: TileDatum[];
}

export interface GroupRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** item tiles, positioned relative to the group cell */
  children: TileRect[];
}

type D3Datum = TileDatum & Partial<GroupDatum>;
type D3Node = HierarchyRectangularNode<D3Datum>;

function toRect(node: D3Node): TileRect {
  return {
    id: node.data.id,
    x: node.x0,
    y: node.y0,
    width: node.x1 - node.x0,
    height: node.y1 - node.y0,
  };
}

/**
 * Squarified treemap layout for a flat list of tiles (math only · no DOM).
 * Values must be > 0; filter before calling.
 */
export function layoutFlat(
  items: TileDatum[],
  width: number,
  height: number,
  paddingInner = 1,
): TileRect[] {
  if (items.length === 0 || width <= 0 || height <= 0) return [];

  const root = hierarchy<D3Datum>({ id: "__root__", value: 0, children: items })
    .sum((d) => d.value)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const laidOut = treemap<D3Datum>()
    .tile(treemapSquarify)
    .size([width, height])
    .paddingInner(paddingInner)(root);

  return laidOut.leaves().map(toRect);
}

/**
 * Two-level nested squarified treemap: category cells first, item tiles
 * within each cell. Each cell reserves a header band at its top; item
 * coordinates are returned relative to their cell so the renderer can
 * absolutely position both layers.
 */
export function layoutGrouped(
  groups: GroupDatum[],
  width: number,
  height: number,
  opts: { paddingInner?: number; headerHeight?: number } = {},
): GroupRect[] {
  const { paddingInner = 1, headerHeight = 24 } = opts;
  if (groups.length === 0 || width <= 0 || height <= 0) return [];

  const root = hierarchy<D3Datum>({
    id: "__root__",
    value: 0,
    children: groups.map((g) => ({ id: g.id, value: 0, children: g.children })),
  })
    .sum((d) => d.value)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const laidOut = treemap<D3Datum>()
    .tile(treemapSquarify)
    .size([width, height])
    .paddingInner(paddingInner)
    .paddingTop(headerHeight)(root);

  return (laidOut.children ?? []).map((group) => ({
    id: group.data.id,
    x: group.x0,
    y: group.y0,
    width: group.x1 - group.x0,
    height: group.y1 - group.y0,
    children: (group.children ?? []).map((child) => ({
      id: child.data.id,
      x: child.x0 - group.x0,
      y: child.y0 - group.y0,
      width: child.x1 - child.x0,
      height: child.y1 - child.y0,
    })),
  }));
}

/** Synthetic section id for tiny categories folded together. */
export const OTHER_GROUP_ID = "__other_group__";

export interface ReadableGroupedLayout {
  rects: GroupRect[];
  /**
   * Category ids folded into the synthetic {@link OTHER_GROUP_ID} section.
   * Empty when nothing was merged, or when a single small category was
   * kept under its own id (and only enlarged).
   */
  otherMembers: string[];
}

/**
 * {@link layoutGrouped} with a readability pass: no category section may end
 * up narrower than `minGroupWidth` or shorter than `minGroupHeight` (a thin
 * sliver can't hold its title or tiles).
 *
 * Undersized sections are pulled into one "small" bucket. Two or more
 * become the synthetic Other section ({@link OTHER_GROUP_ID}); a lone one
 * keeps its own id. If the bucket itself is still undersized, its layout
 * weight is boosted until it clears the minimum. Readable labels win over
 * area fidelity for tiny categories; big categories stay proportional.
 */
export function layoutGroupedReadable(
  groups: GroupDatum[],
  width: number,
  height: number,
  opts: {
    paddingInner?: number;
    headerHeight?: number;
    minGroupWidth?: number;
    minGroupHeight?: number;
  } = {},
): ReadableGroupedLayout {
  const {
    paddingInner = 1,
    headerHeight = 24,
    minGroupWidth = 96,
    minGroupHeight = headerHeight + 44,
  } = opts;
  const layoutOpts = { paddingInner, headerHeight };
  const plain = () => ({ rects: layoutGrouped(groups, width, height, layoutOpts), otherMembers: [] });

  // Nothing to merge, or a canvas too small for two readable sections.
  if (groups.length < 2 || width < minGroupWidth * 2 || height < minGroupHeight) return plain();

  const isThin = (r: GroupRect) => r.width < minGroupWidth - 0.5 || r.height < minGroupHeight - 0.5;
  const members = new Set<string>();
  let boost = 1;
  let rects: GroupRect[] = [];
  let bucketId: string | null = null;

  for (let iter = 0; iter < 16; iter++) {
    const real = groups.filter((g) => !members.has(g.id));
    const folded = groups.filter((g) => members.has(g.id));
    bucketId = folded.length === 0 ? null : folded.length === 1 ? folded[0].id : OTHER_GROUP_ID;

    const input: GroupDatum[] = [...real];
    if (bucketId) {
      const children = folded.flatMap((g) => g.children);
      // Inside the bucket, keep every tile at least half its largest
      // sibling so a $5 line item doesn't collapse to a hairline.
      const floor = Math.max(...children.map((c) => c.value)) * 0.5;
      input.push({
        id: bucketId,
        children: children.map((c) => ({ id: c.id, value: Math.max(c.value, floor) * boost })),
      });
    }

    rects = layoutGrouped(input, width, height, layoutOpts);

    const thinReal = rects.filter((r) => r.id !== bucketId && isThin(r));
    // Never fold the last real section away: keep at least one proportional.
    if (thinReal.length > 0 && real.length - thinReal.length >= 1) {
      for (const r of thinReal) members.add(r.id);
      boost = 1; // bucket changed; re-derive its weight from scratch
      continue;
    }

    const bucket = bucketId ? rects.find((r) => r.id === bucketId) : undefined;
    if (bucket && isThin(bucket)) {
      const need = Math.max(minGroupWidth / bucket.width, minGroupHeight / bucket.height);
      boost *= Math.min(Math.max(need * need, 1.25), 8);
      continue;
    }
    break;
  }

  return {
    rects,
    otherMembers: bucketId === OTHER_GROUP_ID ? [...members] : [],
  };
}
