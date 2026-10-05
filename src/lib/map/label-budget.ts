/**
 * In-tile label budgets (TradingView-style density).
 *
 * Priority top-down: keep name + days when possible; drop cost then icon;
 * if even the name won't fit, fall back to days ticker (or a monogram).
 * Thresholds include padding, inter-item gaps, and a small breathe margin so
 * short tiles never clip titles against the top edge.
 */

export const FULL_MIN_W = 72;
export const TICKER_MIN = 36;

/** Rough line heights (px) of the stacked labels. */
const PAD_Y = 12; // p-1.5 top + bottom
const PAD_X = 28; // p-1.5 + px-2, both sides
const GAP = 2; // gap-0.5 between stacked rows
const BREATHE = 6; // soft margin so labels aren't flush with the tile edge
const TITLE_LINE = 20; // text-base leading-tight
const TITLE_CHAR = 8.5; // avg glyph width, semibold 16px
const TICKER_LINE = 20;
const COST_LINE = 16;
const ICON_LINE = 18; // size-4 + mb-0.5

export interface LabelBudget {
  /** Show the title (1 or 2 lines). */
  showTitle: boolean;
  /** Clamp title to this many lines (1 when a 2-line wrap won't fit). */
  titleLines: 1 | 2;
  showTicker: boolean;
  showCost: boolean;
  showIcon: boolean;
  /** Single-letter fallback when neither title nor ticker fits. */
  showMonogram: boolean;
}

function stackHeight(titleLines: number, rows: number[]): number {
  let h = PAD_Y + BREATHE + titleLines * TITLE_LINE;
  for (const row of rows) h += GAP + row;
  return h;
}

/**
 * Which labels fit for a tile of the given size, dropping cost → icon first,
 * then the title, so short tiles never clip.
 */
export function labelBudget(
  width: number,
  height: number,
  title: string,
  hasCost: boolean,
  hasIcon: boolean,
): LabelBudget {
  const textW = Math.max(width - PAD_X, 1);
  const wantedLines = (Math.min(2, Math.max(1, Math.ceil((title.length * TITLE_CHAR) / textW))) as 1 | 2);

  let titleLines: 1 | 2 = wantedLines;
  let needTitleTicker = stackHeight(titleLines, [TICKER_LINE]);
  // Prefer a single clamped line over dropping the title entirely.
  if (height < needTitleTicker && titleLines > 1) {
    titleLines = 1;
    needTitleTicker = stackHeight(1, [TICKER_LINE]);
  }

  const needCost = stackHeight(titleLines, [TICKER_LINE, COST_LINE]);
  const needIcon =
    PAD_Y + BREATHE + ICON_LINE + GAP + titleLines * TITLE_LINE + GAP + TICKER_LINE + GAP + COST_LINE;

  // Ticker-only is allowed without the breathe margin — a centered "+Nd" on a
  // ~36px tile is still readable, and beats an empty cell.
  const showTicker = width >= TICKER_MIN && height >= PAD_Y + TICKER_LINE;
  const showTitle = width >= FULL_MIN_W && height >= needTitleTicker;
  const showCost = showTitle && hasCost && height >= needCost;
  const showIcon = showTitle && showCost && hasIcon && width >= 96 && height >= needIcon;
  const showMonogram = !showTitle && !showTicker && width >= 20 && height >= 24;

  return { showTitle, titleLines, showTicker, showCost, showIcon, showMonogram };
}

/** First alphanumeric character of a title, uppercased — monogram fallback. */
export function titleMonogram(title: string): string {
  const ch = title.match(/[A-Za-z0-9]/)?.[0];
  return (ch ?? "?").toUpperCase();
}
