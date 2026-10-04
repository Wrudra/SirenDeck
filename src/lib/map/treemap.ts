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
